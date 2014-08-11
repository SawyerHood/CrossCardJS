/**
 * The client javascript file.
 * @author Sawyer Hood
 */
angular.module('crossCardApp', ['ngRoute'])
  .controller('BoardController', ['$scope', '$http', 'baseDeck', 'game', '$location', //Controls the board.
    function($scope, $http, baseDeck, game, $location) {

      $scope.game = game;
      baseDeck = baseDeck.data;
      $scope.theme = {};
      $scope.theme['-'] = '/static/hori.svg';
      $scope.theme['+'] = '/static/cross.svg';
      $scope.theme['|'] = '/static/verti.svg';
      $scope.theme['*'] = '/static/dot.svg';
      $scope.theme['CC'] = '/static/swirl.svg';

      $scope.getCurrentPlayer = function() { //Returns the name of the current player.
        if (game.isMyTurn()) {
          return game.getPlayer().name + '\'s (' + game.getPlayer().type + ')';
        }
        return game.getOtherPlayer().name + '\'s (' + game.getOtherPlayer().type + ')';
      };

      $scope.playCard = function(row, col) { //Plays a the given location.
        if ($scope.game.isMyTurn() && !$scope.game.hasMadeMove()) {
          if (!$scope.game.playCard(row, col)) {

            alert("Choose another location.");

          }
        }
      }

      $scope.newGame = function() { //Puts the player back into match making.

        game.startMatching(game.getPlayer().name);
        $scope.gameOver = false;
        $location.path('/');
      }

      $scope.reserve = function() { //Reserves a card.
        if ($scope.game.isMyTurn() && !$scope.game.hasMadeMove()) {
          if (!$scope.game.reserve()) {
            alert("Can't reserve");
          }
        }
      }

      $scope.switchTurnOff = function() {
        $scope.switchTurn = false;
      }

      $scope.gameOver = false;
      $scope.switchTurn = false;


    }
  ])
  .controller('MatchingController', ['$scope', '$location', 'socket', 'game', //Controller for the match making process.
    function($scope, $location, socket, game) {

      $scope.game = game;
      $scope.connect = function() {
        game.startMatching($scope.name);
      }

      socket.on('game updated', function(data) {
        game.stopMatching();
        $location.path('/OnlineMultiplayerGame');

      });



    }
  ])
  .config(function($routeProvider) {
    $routeProvider.when('/OnlineMultiplayerGame', {
      templateUrl: 'static/partials/localMultiplayer.html',
      controller: 'BoardController',
      resolve: {
        baseDeck: function($http) {
          return $http({
            method: 'GET',
            url: 'static/deck.json'
          }).
          success(function(data, status, headers, config) {
            return data;
          }).
          error(function(data, status, headers, config) {
            console.log(status);
          })
        }
      }

    })
      .when('/', {
        templateUrl: "static/partials/matching.html",
        controller: "MatchingController"
      });


  })
  .run(function(socket, $location, game, $rootScope) {
    socket.on('disconnect', function() { //If they are disconnected, go back to the main screen.
      console.log('Stopped');
      game.stopMatching();
      $location.path('/').replace();
    });
    socket.on('booted', function() { //If they are booted go back to the main screen.
      console.log('Stopped');
      game.stopMatching();
      $location.path('/').replace();
    });
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
      if (!game.isInGame()) {
        if (next.templateUrl === 'static/partials/localMultiplayer.html') {
          $location.path('/');
        }
      }
    })
  })
  .factory('socket', function($rootScope) { //Socket io factory.
    var socket = io.connect();
    return {
      on: function(eventName, callback) {
        socket.on(eventName, function() {
          var args = arguments;
          $rootScope.$apply(function() {
            callback.apply(socket, args);
          });
        });
      },
      emit: function(eventName, data, callback) {
        socket.emit(eventName, data, function() {
          var args = arguments;
          $rootScope.$apply(function() {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        })
      }
    };
  })
  .factory('game', function(socket) { //Stores all game data.

    var gameData;
    var madeMove;
    var matching;
    var gameOver;
    var inGame;

    function resetGame() {
      gameData = {
        board: new crossCardModels.Board(),
        player: null,
        otherPlayer: null,
        currentTurnId: 0,
        gameId: 0
      };

      madeMove = false;
      matching = false;
      gameOver = false;
      inGame = false;
    }


    function update(data) {
      for (prop in data) {
        if (prop != 'board')
          gameData[prop] = data[prop];
      }
      madeMove = false;
      gameData.board.board = data.board;
      if (gameData.board.isBoardFull()) {
        gameOver = true;
      } else {
        gameOver = false;
      }
    }

    socket.on('game updated', function(data) {
      update(data);
    });

    resetGame();

    return {
      getBoard: function() {
        return gameData.board;
      },
      playCard: function(row, col) {
        var cardPlaced = gameData.board.placeCard(gameData['player'].currentCard, row, col);
        if (!cardPlaced)
          return false;
        madeMove = true;
        socket.emit('play card', {
          row: row,
          col: col,
          gameId: gameData.gameId
        });
        return true;
      },
      reserve: function() {
        if (gameData['player'].reserveCard)
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
      isMyTurn: function() {
        return gameData.player.id == gameData.currentTurnId;
      },
      hasMadeMove: function() {
        return madeMove;
      },
      isMatching: function() {
        return matching;
      },
      startMatching: function(name) {
        resetGame();
        socket.emit('new player', name);
        matching = true;
        inGame = true;
      },
      stopMatching: function() {
        matching = false;
      },
      isGameOver: function() {
        return gameOver;
      },
      getWinner: function() {
        return gameData.player.type == gameData.board.getWinner() ? gameData.player.name : gameData.otherPlayer.name;
      },
      isInGame: function() {
        return inGame;
      }
    };
  })
  .directive('crossCard', function(){ //Used to display cards throughout the app.
    return {
      restrict: 'E',
      scope: {
        card: '=card',
        theme: '=theme'
      },
      templateUrl: 'static/partials/card.html'
      };
    });