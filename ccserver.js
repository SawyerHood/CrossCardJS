
var express    = require('express');    // call express
var app        = express();         // define our app using express
var http = require('http').Server(app);
var io = require('socket.io')(http);
var gameModels = require('./static/js/crossCardModels.js');
var port = process.env.PORT || 8080;    // set our port
var fs = require('fs');
var file = __dirname + '/static/deck.json';
var waitingPlayers = [];
var baseDeck;
var games = {};

fs.readFile(file, 'utf8', function (err, data) {
  if (err) {
    console.log('Error: ' + err);
    return;
  }
  baseDeck = JSON.parse(data);
});

function sendUpdatedGame(gameId) {
  var game = games[gameId];
  var p1 = game.players[0].id;
  var p2 = game.players[1].id;
  io.sockets.connected[p1].emit('game updated', game.makeClientSlice(p1));
  io.sockets.connected[p2].emit('game updated', game.makeClientSlice(p2));
}

app.get('/', function(req, res){
  res.sendfile('./index.html');
});

app.use('/static', express.static(__dirname + '/static'));


io.on('connection', function(socket){
  socket.on('new player', function(name) {
    waitingPlayers.push(new gameModels.Player(null, name, socket.id));
    console.log(name);
    if(waitingPlayers.length >= 2){
      var player1 = waitingPlayers.shift();
      var player2 = waitingPlayers.shift();
      player1.type = '|';
      player2.type = '-';
      var players = [player1, player2];
      var d = new Date();
      var gameId = d.getTime();
      games[gameId] = new gameModels.Game(new gameModels.Board(), players, gameModels.shuffle(baseDeck.slice(0)), gameId);
      games[gameId].nextTurn();
      console.log('Match bro');
      sendUpdatedGame(gameId);
    }
  });

  socket.on('play card', function(data) {
    var game = games[data.gameId];
    game.playCard(data.row, data.col);
    game.nextTurn();
    sendUpdatedGame(data.gameId);
    if(game.board.isBoardFull()){
      delete games[data.gameId];
    }
  });

  socket.on('reserve card', function(gameId) {
    var game = games[gameId];
    game.reserve();
    sendUpdatedGame(gameId);
  });

  socket.on('disconnect', function() {
    console.log(socket.id + ' Disconnected');
    for (var i = 0; i < waitingPlayers.length; i++) {
      if(waitingPlayers[i].id == socket.id) {
        waitingPlayers.splice(i,1);
        break;
      }
    }
    for (gameId in games) {
      for(var j = 0; j < games[gameId].players.length; j++){
        if(games[gameId].players[j].id == socket.id) {
          var indexToDC = (j + games[gameId].players.length - 1) % games[gameId].players.length;
          var toDC = games[gameId].players[indexToDC].id;
          for(key in io.sockets.connected) {
            console.log(io.sockets.connected);
          }
          if(toDC in io.sockets.connected) {
            console.log('THIHFOSDFKSHDFUE');
            io.sockets.connected[toDC].emit('booted');
            delete games[gameId];
          }
          return;
        }
      }
    }
  });
});




http.listen(port);
console.log('Server is listening on ' + port);
