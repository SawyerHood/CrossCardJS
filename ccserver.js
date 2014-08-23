/**
 * The server file for the game.
 @author Sawyer Hood
 */
var express = require('express'); // call express
var app = express(); // define our app using express
var http = require('http').Server(app);
var io = require('socket.io')(http);
var gameModels = require('./js/crossCardModels.js');
var port = 8080; // set our port
var fs = require('fs');
var file = __dirname + '/static/deck.json';
var waitingPlayers = [];
var baseDeck;
var games = {};

//Reads the deck Json file on program start.
fs.readFile(file, 'utf8', function(err, data) {
  if (err) {
    console.log('Error: ' + err);
    return;
  }
  baseDeck = JSON.parse(data);
});

//Gives each player thier respective client slices.
function sendUpdatedGame(gameId) {
  var game = games[gameId];
  var p1 = game.players[0].id;
  var p2 = game.players[1].id;
  io.sockets.connected[p1].emit('game updated', game.makeClientSlice(p1));
  io.sockets.connected[p2].emit('game updated', game.makeClientSlice(p2));
}

//Sends the base page when navigated to.
app.get('/', function(req, res) {
  res.sendfile('./index.html');
});

app.use('/static', express.static(__dirname + '/static'));


io.on('connection', function(socket) {
  socket.on('new player', function(name) { //New player connected.
    waitingPlayers.push(new gameModels.Player(null, name, socket.id)); //Add them to the queue.
    console.log(name);
    if (waitingPlayers.length >= 2) { // 2 people in the queue.
      var player1 = waitingPlayers.shift();
      var player2 = waitingPlayers.shift();
      player1.type = '|';
      player2.type = '-';
      var players = [player1, player2]; //Match the players.
      var d = new Date();
      var gameId = d.getTime(); //Use the current time for the gameId
      games[gameId] = new gameModels.Game(new gameModels.Board(undefined, 4), players, gameModels.shuffle(baseDeck.slice(0)), gameId);
      games[gameId].nextTurn();
      console.log(player1.name + ' ' + player2.name + ' matched.');
      sendUpdatedGame(gameId); //Give both players the  updated game.
    }
  });

  socket.on('play card', function(data) { //Someone played a card.
    //TODO server side turn checking.
    if (!(data.gameId in games)) //Make sure the game exists.
      return;
    var game = games[data.gameId];
    game.playCard(data.row, data.col);
    game.nextTurn();
    if (game.board.isBoardFull()) { //The game is over, flip facedown cards.
      game.replaceFaceDownCards();
    }
    sendUpdatedGame(data.gameId); //Update game to clients
    if (game.board.isBoardFull()) {
      delete games[data.gameId]; //Delete game from memory.
    }
  });

  socket.on('reserve card', function(gameId) { //Someone reserves a card.
    if (!(gameId in games)) //Make sure the game exists.
      return;
    var game = games[gameId];
    game.reserve();
    sendUpdatedGame(gameId);
  });

  socket.on('disconnect', function() { //Player is disconnected.
    console.log(socket.id + ' Disconnected');
    for (var i = 0; i < waitingPlayers.length; i++) { //If they are in the queue, remove them.
      if (waitingPlayers[i].id == socket.id) {
        waitingPlayers.splice(i, 1);
        break;
      }
    }
    for (var gameId in games) { //If they are in a game remove them.
      for (var j = 0; j < games[gameId].players.length; j++) {
        if (games[gameId].players[j].id == socket.id) {
          var indexToDC = (j + games[gameId].players.length - 1) % games[gameId].players.length;
          var toDC = games[gameId].players[indexToDC].id;
          for (var key in io.sockets.connected) {}
          if (toDC in io.sockets.connected) {

            io.sockets.connected[toDC].emit('booted'); //Boot the other player.
            delete games[gameId]; //Delete the game.
          }
          return;
        }
      }
    }
  });
});



http.listen(port);
console.log('Server is listening on ' + port);