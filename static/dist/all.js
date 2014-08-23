'use strict';
(function(exports) {


    var NUM_TO_SIM = 10000;


    function initWinArray(size) {
        var arrayLength = size * size + 1;
        var winArray = [];
        for (var i = 0; i < arrayLength; i++) {
            winArray.push(0);
        }
        return winArray;

    }
    //Returns index in a row and col in a 2-D list where the AI should play its current card.
    exports.calculateNextMove = function(deck, board, currentCard, canReserve, playerVal) {

        var winArray = initWinArray(board.size);

        for (var i = 0; i < NUM_TO_SIM; i++) {
            var tempBoard = board.clone();
            var tempDeck = deck.slice(0);
            var result = exports.playRandomGame(tempDeck, tempBoard, currentCard, canReserve, playerVal);
            if (result !== false) {
                winArray[result] += 1;
            }
        }

        var max = -1;
        var maxIndex = -1;
        for (i = 0; i < winArray.length; i++) {
            if (winArray[i] > max) {
                max = winArray[i];
                maxIndex = i;
            }
        }

        return exports.toRowAndCol(maxIndex, board.size);
    };


    exports.playRandomGame = function(deck, board, currentCard, canReserve, playerVal) {
        var randomIndex;
        var isReserve;
        var rowAndCol;
        do {
            randomIndex = Math.random() * (board.size * board.size + 1);
            isReserve = board.size * board.size == randomIndex;
            rowAndCol = exports.toRowAndCol(randomIndex, board.size);
        } while (!(isReserve && canReserve) || board.isOccupied(rowAndCol[0], rowAndCol[1]));

        if (!isReserve) {
            board.placeCard(currentCard, rowAndCol[0], rowAndCol[1]);
        }

        for (var i = 0; i < board.size; i++) {
            for (var j = 0; j < board.size; j++) {
                if (!board.isOccupied(i, j)) {
                    board.placeCard(deck.pop(), i, j);
                }
            }
        }
        board.replaceFaceDownCards(deck);
        return playerVal == board.getWinner() ? randomIndex : false;
    };

    exports.toOneDimIndex = function(row, col, size) {
        if (row == -1 && col == -1) {
            return size * size;
        }
        if (row < 0 || row >= size || col < 0 || col >= size) {
            return -1;
        }
        return row * size + col;
    };

    //Returns an array containing therow and then the col.
    exports.toRowAndCol = function(index, size) {
        if (index == size * size) {
            return [-1, -1];
        }
        if (index > size * size || index < 0) {
            return -1;
        }
        var toReturn = [];
        toReturn.push(Math.floor(index / size));
        toReturn.push(Math.floor(index % size));
        return toReturn;
    };

})(typeof exports === 'undefined' ? this['crossCardAI'] = {} : exports);
/**
 * Models used for the CrossCard game. Used in both the client and the server code.
 * @author Sawyer Hood
 */
'use strict';
(function(exports) {

  /**
   * The Card class is used to store data for cards used everywhere in the app,
   * the board, the deck, what the player posseses, etc.
   */
  exports.Card = function Card(value, type) {
    this.value = value; //A value from 0-5. If the value is 0 it does not show on the board.
    this.type = type; // Valid types are: -, |, +, *, CC
  };

  /**
   * The player class owns all data responisble for managing the state of the player.
   */
  exports.Player = function Player(type, name, id) {
    this.type = type; // - or | for what player they are.
    this.name = name || 'Sawyer'; //Name of the player.
    this.id = id || 1; // A unique identifier, the server uses thier socket.io client id.
    this.currentCard = null; // Card to play
    this.reserveCard = null; //Card in reserve
  };

  /**
   * The 'controller' for the game links the deck, players, and board together to keep
   * track of the game state.
   */
  exports.Game = function Game(board, players, deck, gameId) {
    this.gameId = gameId || 0; //Unique identifier for the game.
    this.board = board; //A board object. Represents the cards on the playing field.
    this.players = players; //A list of player objects playing.
    this.deck = deck; // A list of cards to form a deck.
    this.playerIndex = 0; //Index of the player whose turn it is.

    /**
     * Returns the current player.
     */
    this.getCurrentPlayer = function() {
      return this.players[this.playerIndex];
    };

    /**
     * Changes to the next turn.
     */
    this.nextTurn = function() {
      this.playerIndex++;
      if (this.playerIndex >= this.players.length) //Reached end of players, start over.
        this.playerIndex = 0;
      if (this.getCurrentPlayer().reserveCard === null) { //If the player doesn't have a reserve
        this.getCurrentPlayer().currentCard = this.deck.pop(); //Give them a new card.
      } else { //Current card becomes reserve card.
        this.getCurrentPlayer().currentCard = this.getCurrentPlayer().reserveCard;
        this.getCurrentPlayer().reserveCard = null;
      }
    };


    /**
     * Plays the current players current card in the specified row and column.
     * Returns true if successful and false if not.
     */
    this.playCard = function(row, col) {
      var didPlace = board.placeCard(this.getCurrentPlayer().currentCard, row, col);
      if (didPlace)
        this.getCurrentPlayer().currentCard = null; //Get rid of current card if played.
      return didPlace;
    };

    /**
     * Reserves the current player's current card. Gives them a new card.
     */
    this.reserve = function() {
      var myPlayer = this.getCurrentPlayer();
      if (myPlayer.reserveCard === null) {
        myPlayer.reserveCard = myPlayer.currentCard;
        myPlayer.currentCard = this.deck.pop();
        return true;
      }
      return false;

    };

    /**
     * Used to generate a player object for the client on the other team to use.
     * We don't want the other player to know what cards he/she has.
     */
    this._makeHiddenPlayerSlice = function(player) {
      return {
        id: player.id,
        name: player.name,
        type: player.type
      };
    };

    /**
     * A limited object for the client to use. We don't want the client to know the contents of the deck.
     * or what the other player has. We give them the bare minimum to be able to function.
     */
    this.makeClientSlice = function(playerId) {
      var slice = {
        board: this.board.board,
        player: this.players[0].id == playerId ? this.players[0] : this.players[1],
        otherPlayer: this._makeHiddenPlayerSlice(this.players[0].id != playerId ? this.players[0] : this.players[1]),
        currentTurnId: this.getCurrentPlayer().id,
        gameId: this.gameId
      };
      return slice;
    };

    /**
     * Replaces all cards on the board with the value 'CC' with a card from the deck. Called at the end of the game.
     */
    this.replaceFaceDownCards = function() {
      this.board.replaceFaceDownCards(this.deck);
    };

  };

  /**
   * Responible for keeping the state of the board while calculating scores.
   */
  exports.Board = function Board(board, size) {

    /**
     * Initializes the board.
     */
    this.clearBoard = function() {
      var newBoard = [];
      for (var i = 0; i < this.size; i++) {
        newBoard.push([]);
        for (var j = 0; j < this.size; j++) {
          newBoard[i].push(null);
        }

      }
      if (newBoard.length % 2 !== 0) {
        newBoard[newBoard.length % 2][newBoard.length % 2] = new exports.Card(0, 'CC'); //Put a facedown card in the middle.
      } else {
        newBoard[0][0] = new exports.Card(0, 'CC');
        newBoard[0][newBoard.length - 1] = new exports.Card(0, 'CC');
        newBoard[newBoard.length - 1][0] = new exports.Card(0, 'CC');
        newBoard[newBoard.length - 1][newBoard.length - 1] = new exports.Card(0, 'CC');
      }
      return newBoard;
    };

    this.size = size || 4;
    this.board = board || this.clearBoard(); //2D array of cards.

    /**
     * Checks if there is a card at this location.
     */
    this.isOccupied = function(row, col) {
      if (this.board.length <= row || this.board[row].length <= col)
        return true;
      return this.board[row][col] !== null;
    };

    /**
     * Returns true if the board is full.
     */
    this.isBoardFull = function() {
      for (var i = 0; i < this.size; i++) {
        for (var j = 0; j < this.size; j++) {
          if (!this.isOccupied(i, j))
            return false;
        }
      }
      return true;
    };

    /**
     * Gets the value along a given row.
     */
    this.getRowValue = function(row) {
      var total = 0;
      for (var i = 0; i < this.board[row].length; i++) {
        if (!this.isOccupied(row, i)) {
          continue;
        } else if (this.board[row][i].type == '+' || this.board[row][i].type == '-') {
          total += this.board[row][i].value; //Add to the total
        } else if (this.board[row][i].type == '*') { //Zero the row.
          return 0;
        }
      }
      return total;
    };

    /**
     * Gets the value along a given column.
     */
    this.getColValue = function(col) {
      var total = 0;
      for (var i = 0; i < this.board.length; i++) {
        if (!this.isOccupied(i, col)) {
          continue;
        } else if (this.board[i][col].type == '+' || this.board[i][col].type == '|') {
          total += this.board[i][col].value; //Add to the total
        } else if (this.board[i][col].type == '*') { //Zero the row.
          return 0;
        }
      }
      return total;
    };

    /**
     * Places a card in the given location, returns false if the spot is full.
     */
    this.placeCard = function(card, row, col) {
      if (this.isOccupied(row, col))
        return false;
      this.board[row][col] = card;
      return true;
    };

    /**
     * Returns the card at the given location.
     */
    this.getCard = function(row, col) {
      return this.board[row][col];
    };

    /**
     * Returns a list of column values in descending order.
     */
    this.getSortedColVaules = function() {
      var scores = [];
      for (var i = 0; i < this.size; i++) {
        scores.push(this.getColValue(i));
      }
      scores.sort(function(a, b) {
        return b - a;
      });
      return scores;
    };

    /**
     * Returns a list of row values in descending order.
     */
    this.getSortedRowVaules = function() {
      var scores = [];
      for (var i = 0; i < this.size; i++) {
        scores.push(this.getRowValue(i));
      }
      scores.sort(function(a, b) {
        return b - a;
      });
      return scores;
    };

    /**
     * Returns '|' if vertical wins, '-' if horizontal wins, and null if the game is still going.
     */
    this.getWinner = function() {
      if (this.isBoardFull()) {
        var colVals = this.getSortedColVaules();
        console.log(colVals);
        var rowVals = this.getSortedRowVaules();
        for (var i = 0; i < this.size; i++) {
          if (colVals[i] > rowVals[i])
            return '|';
          if (rowVals[i] > colVals[i])
            return '-';
        }
      }
      return null;
    };

    /**
     * Replaces all faceDownCards with cards from the given deck.
     */
    this.replaceFaceDownCards = function(deck) {
      for (var i = 0; i < this.size; i++) {
        for (var j = 0; j < this.size; j++) {
          var card = this.getCard(i, j);
          if (card) {
            if (card.type == 'CC')
              this.board[i][j] = deck.pop();
          }
        }
      }
    };

    //Returns a copy of the board, awesome for the AI.
    this.clone = function() {
      var boardCopy = [];
      for(var i = 0; i < this.board.length; i++) {
        boardCopy = this.board[i].slice(0);
      }
      return this(boardCopy, this.size);
    };


  };

  /**
   * Shuffles an array.
   */
  exports.shuffle = function shuffle(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  };
})(typeof exports === 'undefined' ? this['crossCardModels'] = {} : exports);
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
      };

      $scope.newGame = function() { //Puts the player back into match making.

        game.startMatching(game.getPlayer().name);
        $scope.gameOver = false;
        $location.path('/');
      };

      $scope.reserve = function() { //Reserves a card.
        if ($scope.game.isMyTurn() && !$scope.game.hasMadeMove()) {
          if (!$scope.game.reserve()) {
            alert("Can't reserve");
          }
        }
      };

      $scope.switchTurnOff = function() {
        $scope.switchTurn = false;
      };

      $scope.gameOver = false;
      $scope.switchTurn = false;


    }
  ])
  .controller('MatchingController', ['$scope', '$location', 'socket', 'game', //Controller for the match making process.
    function($scope, $location, socket, game) {

      $scope.game = game;
      $scope.connect = function() {
        game.startMatching($scope.name);
      };

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
          });
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
    });

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
        });
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
      for (var prop in data) {
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
  .directive('crossCard', function() { //Used to display cards throughout the app.
    return {
      restrict: 'E',
      scope: {
        card: '=card',
        theme: '=theme'
      },
      templateUrl: 'static/partials/card.html'
    };
  });