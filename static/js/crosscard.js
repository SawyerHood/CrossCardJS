angular.module('crossCardApp', ['ngRoute'])
.controller('BoardController', ['$scope', '$http', 'baseDeck', function($scope, $http, baseDeck){


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
  $scope.gameBoard = new Board(deck, players);
  $scope.gameBoard.nextTurn();
  

  

}]).
config(function($routeProvider){
  $routeProvider.when('/', {
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

  });
});

