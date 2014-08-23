'use strict';
(function(exports) {


    var NUM_TO_SIM = 1000000;


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
            var tempDeck = exports.shuffle(deck.slice(0));
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
        console.log('winArray : ' + winArray);
        return exports.toRowAndCol(maxIndex, board.size);
    };


    exports.playRandomGame = function(deck, board, currentCard, canReserve, playerVal) {
        var randomIndex;
        var isReserve;
        var rowAndCol;
        
       
        do {
            randomIndex = Math.floor(Math.random() * (board.size * board.size + 1));
            isReserve = board.size * board.size == randomIndex;
            if(isReserve && canReserve) {
                break;
            }
            rowAndCol = exports.toRowAndCol(randomIndex, board.size);
        } while (board.isOccupied(rowAndCol[0], rowAndCol[1]));
        
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

    exports.shuffle = function shuffle(o) {
        for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
  };

  exports.AIGame = function(board, humanPlayerName, deck) {
    var players = [];
    players.push(humanPlayer);
    players.push(new crossCardModels.Player('|', humanPlayerName, '0000'));
    players.push(new crossCardModels.Player('-', 'Computer Player', '1111'));
    this.game = new crossCardModels.Game(board, players, deck, 11);

    this.playCard = function(row, col) {
        this.game.playCard(row, col);
        this.game.nextTurn();
        return new Promise(function(resolve){
            if(!this.game.board.isBoardFull())
            {
                var whereToPlay = exports.calculateNextMove(game.deck, game.board, game.getCurrentPlayer().currentCard, 
                    this.game.getCurrentPlayer().reserveCard == null, this.getCurrentPlayer().type);
                if(whereToPlay[0] == -1 && whereToPlay[1] == -1){
                    game.reserve();
                    whereToPlay = exports.calculateNextMove(this.game.deck, this.game.board, this.game.getCurrentPlayer().currentCard, 
                    this.game.getCurrentPlayer().reserveCard == null, this.game.getCurrentPlayer().type);
                }
                this.game.playCard(whereToPlay[0], whereToPlay[1]);
                this.game.nextTurn(); 
            }
            resolve(this.game.makeClientSlice('0000'));

        });
    }
  };

})(typeof exports === 'undefined' ? this['crossCardAI'] = {} : exports);