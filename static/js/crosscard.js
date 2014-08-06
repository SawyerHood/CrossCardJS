
angular.module('crossCardApp', ['ngRoute'])
.controller('BoardController', ['$scope', '$http', 'baseDeck', 'game', function($scope, $http, baseDeck, game){


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
    return $scope.gameBoard.getCurrentPlayer(); 
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
  $scope.gameBoard = game.gameBoard;
  $scope.gameBoard.nextTurn();
}]).
controller('MatchingController', ['$scope', '$location', 'socket', 'game', function($scope, $location, socket, game){

  $scope.matching = false;
  $scope.connect = function() {
    socket.emit('new player', $scope.name);
    $scope.matching = true;
  }

  socket.on('match found', function (data) {
    game.gameBoard = data.gameBoard;
    game.yourPlayer = data.yourPlayer; 
    $location.path('/OnlineMultiplayerGame').replace();
    $scope.matching = false;
  });

 $scope.$watch('matching', function(newValue, oldValue) {
    console.log(newValue);
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
            console.log(data);
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
service('game', function(){
  var board = {};
  return board;
});

