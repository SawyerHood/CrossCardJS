
angular.module('crossCardApp', ['ngRoute'])
.controller('BoardController', ['$scope', '$http', 'baseDeck', 'game', '$location', function($scope, $http, baseDeck, game, $location){

  $scope.game = game;
  baseDeck = baseDeck.data;
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
    return $scope.game.getPlayer(); 
  };

  $scope.playCard = function (row, col) {
    if($scope.game.isMyTurn() && !$scope.game.hasMadeMove()){ 
      if(!$scope.game.playCard(row, col)) {
      
        alert("Choose another location.");
      
     }
    }
  }

  $scope.newGame = function() {
    
    game.startMatching(game.getPlayer().name);
    $scope.gameOver = false;
    $location.path('/');
  }

  $scope.reserve = function() {
    if($scope.game.isMyTurn() && !$scope.game.hasMadeMove()){ 
      if(!$scope.game.reserve()) {
        alert("Can't reserve");
      } 
    }
  }

  $scope.switchTurnOff = function() {
    $scope.switchTurn = false;
  }

  $scope.gameOver = false;
  $scope.switchTurn = false;
  
  
}]).
controller('MatchingController', ['$scope', '$location', 'socket', 'game', function($scope, $location, socket, game){

  $scope.game = game;
  $scope.connect = function() {
    game.startMatching($scope.name);
  }

  socket.on('game updated', function (data) {
    //game.initGame(data);
    game.stopMatching();
    $location.path('/OnlineMultiplayerGame');
    
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
  var gameData = {board: new crossCardModels.Board(), player: null, otherPlayer: null, currentTurnId: 0, gameId: 0};
  var madeMove = false;
  var matching = false;
  var gameOver = false;
  function update(data) {
    for(prop in data) {
      if(prop != 'board')
        gameData[prop] = data[prop];
    }
    madeMove = false;
    gameData.board.board = data.board;
    if(gameData.board.isBoardFull()) {
      gameOver = true;
    } else {
      gameOver = false;
    }
  }

  socket.on('game updated', function(data){
    update(data);
  });

  
  return {
    getBoard : function() {
      console.log(gameData.board);
      return gameData.board; 
    },
    playCard: function(row, col) {
      var cardPlaced = gameData.board.placeCard(gameData['player'].currentCard, row, col);
      if(!cardPlaced)
        return false;
      madeMove = true;
      socket.emit('play card', {row: row, col: col, gameId: gameData.gameId});
      return true;
    },
    reserve: function() {
      if(gameData['player'].reserveCard)
        return false;
      madeMove = true;
      socket.emit('reserve card', gameData.gameId);
      return true;
    },
    isGameOver: null,
    initGame: function(data) {
      update(data);
    },
    getPlayer: function() {
      return gameData.player;
    },
    getOtherPlayer: function() {
      return gameData.otherPlayer;
    },
    isMyTurn: function () {
      return gameData.player.id == gameData.currentTurnId;
    },
    hasMadeMove: function() {
      return madeMove;
    },
    isMatching: function () {
      return matching;
    },
    startMatching: function(name) {
      socket.emit('new player', name);
      matching = true;
    },
    stopMatching: function() {
      matching = false;
    },
    isGameOver: function() {
      return gameOver;
    },
    getWinner: function() {
      return gameData.player.type == gameData.board.getWinner() ? gameData.player.name : gameData.otherPlayer.name;
    }
  };
});

