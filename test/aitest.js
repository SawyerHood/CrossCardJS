var assert = require('assert');
var gameModels = require('../static/js/crossCardModels.js');
var ai = require('../static/js/ai.js');

describe('AI', function(){
    describe('#toOneDimIndex()', function(){
        it('Should return the correct 1-d representation if the row and col are on the board.', function() {
            assert.equal(0, ai.toOneDimIndex(0, 0, 4));
            assert.equal(1, ai.toOneDimIndex(0, 1, 4));
            assert.equal(10, ai.toOneDimIndex(2, 2, 4));
            assert.equal(4, ai.toOneDimIndex(1, 0, 4));

        });
        it('Should return size*size if -1, -1 is entered, indicating the reserve slot.', function(){
            assert.equal(25, ai.toOneDimIndex(-1, -1, 5));
            assert.equal(16, ai.toOneDimIndex(-1, -1, 4));
        });
        it('Should return -1 if the entered value is invalid.', function() {
            assert.equal(-1, ai.toOneDimIndex(5, 5, 5));
            assert.equal(-1, ai.toOneDimIndex(3, 6, 4));
        });
    });

    describe('#toRowAndCol()', function(){
        it('Should return the 2-D representation of a 1-D index.', function() {
            assert.deepEqual([2,2], ai.toRowAndCol(10, 4));
            assert.deepEqual([0,0], ai.toRowAndCol(0, 4));
            assert.deepEqual([1,0], ai.toRowAndCol(4, 4));

        });
         it('Should return the -1 if the index is invalid.', function() {
            assert.deepEqual(-1, ai.toRowAndCol(-1, 4));
            assert.deepEqual([-1, -1], ai.toRowAndCol(16, 4));
        });
    });
});