
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
      io.sockets.connected[player1.id].emit('match found', {gameBoard: games[gameId], yourPlayer: player1});
      io.sockets.connected[player2.id].emit('match found', {gameBoard: games[gameId], yourPlayer: player2});
    }
  });
});



http.listen(port);
console.log('Server is listening on ' + port);
