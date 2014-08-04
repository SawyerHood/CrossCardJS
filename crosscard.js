angular.module('crossCardApp', [])
.controller('BoardController', ['$scope', '$http', function($scope, $http){

  function Card(value, type) {
    this.value = value;
    this.type = type;
  }

  function Player(type){
    this.type = type;
    this.currentCard = null;
    this.reserveCard = null;
  }

  function Board() {
    this.board = [[],[],[]];
    this.size = 3;

    this.clearBoard = function() {
      this.board = [];
      for(var i = 0; i < this.size; i++) {
        this.board.push([]);
        for(var j = 0; j < this.size; j++) {
          this.board[i].push(null);
        }
      }
    }

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
    this.clearBoard();

  }

  //+ Jonas Raoni Soares Silva
  //@ http://jsfromhell.com/array/shuffle [v1.0]
  function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  };

  $scope.gameBoard = new Board();

  function playRandomCards (){
    var types = ["+","-","|",]
    for(var i = 0; i < $scope.gameBoard.size; i++) {
      for(var j = 0; j < $scope.gameBoard.size; j++) {
        $scope.gameBoard.placeCard($scope.deck.pop(), i, j);
      }
    }
  }

  var baseDeck;
  $http.get("deck.json").
  success(function(data, status, headers, config) {
    baseDeck = data;
    $scope.deck = shuffle(baseDeck.slice(0));
    $scope.nextTurn();
    
  }).
  error(function(data, status, headers, config) {
      console.log(status);
    });

  var currentPlayerIndex = 0;
  $scope.players = [new Player('-'), new Player('|')];
  $scope.getCurrentPlayer = function () {
    return $scope.players[currentPlayerIndex]; 
  };

  $scope.playCard = function (row, col) {
    console.log($scope.getCurrentPlayer().currentCard);
    if($scope.gameBoard.placeCard($scope.getCurrentPlayer().currentCard, row, col)) {
      $scope.getCurrentPlayer().currentCard = null;
      if($scope.gameBoard.isBoardFull()) {
        $scope.gameOver = true;
        $scope.winner = $scope.gameBoard.getWinner();
      } else {
      $scope.nextTurn();
      }
    } else {
      alert("Choose another location.");
    }
  }

  $scope.nextTurn = function() {
    currentPlayerIndex++;
    if (currentPlayerIndex >= $scope.players.length)
      currentPlayerIndex = 0;
    $scope.getCurrentPlayer().currentCard = $scope.deck.pop();
  }

  $scope.newGame = function() {
    currentPlayerIndex = 0;
    $scope.players = [new Player('-'), new Player('|')];
    $scope.deck = shuffle(baseDeck.slice(0));
    $scope.gameBoard = new Board();
    $scope.nextTurn();
    $scope.gameOver = false;

  }

  $scope.gameOver = false;

}]);

