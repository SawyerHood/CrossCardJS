(function(exports){
  exports.Card = function Card(value, type) {
      this.value = value;
      this.type = type;
    }

    exports.Player = function Player(type, name, id){
      this.type = type;
      this.name = name || "Sawyer";
      this.id = id || 1;
      this.currentCard = null;
      this.reserveCard = null;
    }

    exports.Board = function Board(deck, players, gameId, playerIndex, board) {
      

      this.clearBoard = function() {
        newBoard = [];
        for(var i = 0; i < this.size; i++) {
          newBoard.push([]);
          for(var j = 0; j < this.size; j++) {
            newBoard[i].push(null);
          }
          
        }
        return newBoard;
      }

      this.gameId = gameId || 0;
      this.size = board ? board.length : 3;
      this.board = board || this.clearBoard();
      this.deck = deck;
      this.players = players || [new exports.Player('-'), new exports.Player('|')];
      this.playerIndex = playerIndex || 0;

      this.isOccupied = function(row, col) {
        if(this.board.length <= row || this.board[row].length <= col)
          return true;
        return this.board[row][col] != null;
      }

      this.isBoardFull = function() {
        for(var i = 0; i < this.size; i++) {
          for(var j = 0; j < this.size; j++) {
            if(!this.isOccupied(i,j))
              return false;
          }
        }
        return true;
      }

      this.getRowValue = function(row) {
        var total = 0;
        for(var i = 0; i < this.board[row].length; i++) {
          if(!this.isOccupied(row, i)) {
            continue;
          } else if (this.board[row][i].type == "+" || this.board[row][i].type == "-") {
            total += this.board[row][i].value;
          } else if (this.board[row][i].type == "*"){
            return 0;
          }
        }
        return total;
      }

      this.getColValue = function(col) {
        var total = 0;
        for(var i = 0; i < this.board.length; i++) {
          if(!this.isOccupied(i, col)) {
            continue;
          } else if (this.board[i][col].type == "+" || this.board[i][col].type == "|") {
            total += this.board[i][col].value;
          } else if (this.board[i][col].type == "*"){
            return 0;
          }
        }
        return total;
      }

      this.placeCard = function(card, row, col) {
        if (this.isOccupied(row, col))
          return false;
        this.board[row][col] = card;
        return true;
      }

      this.getCard = function(row, col) {
        return this.board[row][col];
      }

      this.getSortedColVaules = function() {
        var scores = [];
        for(var i = 0; i < this.size; i++) {
          scores.push(this.getColValue(i));
        }
        scores.sort(function(a,b){return b-a});
        return scores;
      }

      this.getSortedRowVaules = function() {
        var scores = [];
        for(var i = 0; i < this.size; i++) {
          scores.push(this.getRowValue(i));
        }
        scores.sort(function(a,b){return b-a});
        return scores;
      }

      this.getWinner = function() {
        if (this.isBoardFull()) { 
          var colVals = this.getSortedColVaules();
          console.log(colVals);
          var rowVals = this.getSortedRowVaules();
          for(var i = 0; i < this.size; i++){
            if(colVals[i] > rowVals[i])
              return "|";
            if(rowVals[i] > colVals[i])
              return "-";
          }
        }
        return null;
      }

      this.nextTurn = function() {
      this.playerIndex++;
      if (this.playerIndex >= this.players.length)
        this.playerIndex = 0;
      if (this.getCurrentPlayer().reserveCard == null) {
        this.getCurrentPlayer().currentCard = this.deck.pop();
      } else {
        this.getCurrentPlayer().currentCard = this.getCurrentPlayer().reserveCard;
        this.getCurrentPlayer().reserveCard = null;
      }
    }

    this.getCurrentPlayer = function () {
      return this.players[this.playerIndex]; 
    };

    this.playCard = function (row, col) {
        var didPlace = this.placeCard(this.getCurrentPlayer().currentCard, row, col);
        if(didPlace)
          this.getCurrentPlayer().currentCard = null;
        return didPlace;
    }

    this.reserve = function() {
      var myPlayer = this.getCurrentPlayer();
      if(myPlayer.reserveCard == null) {
        myPlayer.reserveCard = myPlayer.currentCard;
        myPlayer.currentCard = this.deck.pop();
        return true;
      } 
      return false;

    }
  }

  exports.shuffle = function shuffle(o){ 
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  };
})(typeof exports === 'undefined'? this['crossCardModels']={}: exports); 