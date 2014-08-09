
angular.module('crossCardApp', ['ngRoute'])
.controller('BoardController', ['$scope', '$http', 'baseDeck', 'game', function($scope, $http, baseDeck, game){

  $scope.game = game;
  baseDeck = baseDeck.data;
  console.log(game.getPlayer());
  var Player = crossCardModels.Player;
  var Board = crossCardModels.Board;
  var Card = crossCardModels.Card;
  var shuffle = crossCardModels.shuffle;
  

  function playRandomCards (){
    var types = ["+","-","|",]
    for(var i = 0; i < $scope.gameBoard.size; i++) {
      for(var j = 0; j < $scope.gameBoard.size; j++) {
        $scope.gameBoard.placeCard($scope.deck.pop(), i, j);
      }
    }
  }

  $scope.getCurrentPlayer = function () {
    return $scope.game.player; 
  };

  $scope.playCard = function (row, col) {
    if($scope.gameBoard.playCard(row, col)) {
      if($scope.gameBoard.isBoardFull()) {
        $scope.gameOver = true;
        $scope.winner = $scope.gameBoard.getWinner();
      } else {
      $scope.switchTurn = true;
      $scope.gameBoard.nextTurn();
      }
    } else {
      alert("Choose another location.");
    }
  }

  $scope.newGame = function() {
    currentPlayerIndex = 0;
    $scope.players = [new Player('-'), new Player('|')];
    $scope.deck = shuffle(baseDeck.slice(0));
    $scope.gameBoard = new Board(deck, players);
    $scope.gameOver = false;
  }

  $scope.reserve = function() {
    
    if(!$scope.gameBoard.reserve()) {
      alert("Can't reserve");
    } 
  }

  $scope.switchTurnOff = function() {
    $scope.switchTurn = false;
  }

  $scope.gameOver = false;
  $scope.switchTurn = false;
  var deck = shuffle(baseDeck.slice(0));
  var players = [new Player('-'), new Player('|')];
  
}]).
controller('MatchingController', ['$scope', '$location', 'socket', 'game', function($scope, $location, socket, game){

  $scope.matching = false;
  $scope.connect = function() {
    socket.emit('new player', $scope.name);
    $scope.matching = true;
  }

  socket.on('game updated', function (data) {
    game.gameBoard = data.gameBoard;
    game.yourPlayer = data.yourPlayer; 
    $location.path('/OnlineMultiplayerGame').replace();
    $scope.matching = false;
  });

 

}]).
config(function($routeProvider){
  $routeProvider.when('/OnlineMultiplayerGame', {
    templateUrl: 'static/partials/localMultiplayer.html',
    controller: 'BoardController',
    resolve: {
      baseDeck : function ($http) {
          return $http ({method: 'GET', url: 'static/deck.json'}).
          success(function(data, status, headers, config) {
            return data;
          }).
          error(function(data, status, headers, config) {
              console.log(status);
          })
        }
    }

  })
  .when('/',  {
    templateUrl: "static/partials/matching.html",
    controller: "MatchingController"
  });
}).
factory('socket', function ($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
}).
factory('game', function(socket){
  var gameData = {board: null, player: null, otherPlayer: null, currrentTurnId: 0, gameId: 0};
  var board = new crossCardModels.Board(null, null, 0, 0, null);

  function update(data) {
    for(prop in data) {
      gameData[prop] = data[prop];
    }
    board.board = gameData[board];
    //console.log(data.player);
  }

  socket.on('game updated', function(data){
    update(data);
  });

  
  return {
    getBoard : function() {
      return gameData.board; 
    },
    playCard: function(row, col) {
      socket.emit('play card', {row: row, col: col, gameId: gameData.gameId});
    },
    reserve: function() {
      socket.emit('reserve card', {gameId: gameData.gameId});
    },
    isGameOver: null,
    initGame: function(data) {
      update(data);
    },
    getColValue: function(i) {
      return board.getColValue(i);
    },
    getRowValue: function(i) {
      return board.getRowValue(i);
    },
    getPlayer: function() {
      return gameData.player;
    }
  };
});

