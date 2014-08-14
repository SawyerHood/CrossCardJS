/**
 * Models used for the CrossCard game. Used in both the client and the server code.
 * @author Sawyer Hood
 */

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
    this.name = name || "Sawyer"; //Name of the player.
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
      newBoard = [];
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
        } else if (this.board[row][i].type == "+" || this.board[row][i].type == "-") {
          total += this.board[row][i].value; //Add to the total
        } else if (this.board[row][i].type == "*") { //Zero the row.
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
        } else if (this.board[i][col].type == "+" || this.board[i][col].type == "|") {
          total += this.board[i][col].value; //Add to the total
        } else if (this.board[i][col].type == "*") { //Zero the row.
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
            return "|";
          if (rowVals[i] > colVals[i])
            return "-";
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


  };

  /**
   * Shuffles an array.
   */
  exports.shuffle = function shuffle(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  };
})(typeof exports === 'undefined' ? this['crossCardModels'] = {} : exports);