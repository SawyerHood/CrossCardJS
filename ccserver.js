
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
  console.log(baseDeck);
});

function sendUpdatedGame(gameId) {
  var game = games[gameId];
  var p1 = game.players[0].id;
  var p2 = game.players[1].id;
  io.sockets.connected[p1].emit('game updated', {
    board: game.board, 
    player: game.players[0],
    otherPlayer: {name: game.players[1].name, id: game.players[1].id}, 
    currentTurnId: game.getCurrentPlayer().id, 
    gameId: game.gameId
   });
  io.sockets.connected[p2].emit('game updated', {
    board: game.board, 
    player: game.players[1],
    otherPlayer: {name: game.players[0].name, id: game.players[0].id}, 
    currentTurnId: game.getCurrentPlayer().id, 
    gameId: game.gameId
   });
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
      var player1 = waitingPlayers.pop();
      var player2 = waitingPlayers.pop();
      player1.type = '|';
      player2.type = '-';
      var players = [player1, player2];
      var d = new Date();
      var gameId = d.getTime();
      games[gameId] = new gameModels.Board(baseDeck.splice(0), players, gameId);
      games[gameId].nextTurn();
      console.log('Match bro');
      sendUpdatedGame(gameId);
    }
  });
});




http.listen(port);
console.log('Server is listening on ' + port);
