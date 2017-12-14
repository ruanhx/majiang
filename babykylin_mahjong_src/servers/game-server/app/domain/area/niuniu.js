/**
 * Created by Administrator on 2017/12/14 0014.
 */
var _ = require('underscore');
var exp = module.exports = {};

function getRandom() {
    return _.random(1,10);
    // return parseInt(2 + (9 - 2 + 1) * Math.random());
}

function getCards() {
    var arr = [];
    var count = 5;
    while (count--) {
        arr.push(getRandom());
    }
    return arr;
}


function cal(cards) {
    console.log(cards);
    var s = 0;
    var dict = {};
    for (var i = 0; i < cards.length; i++) {
        var ci = cards[i];
        s += ci;
        dict[ci] = dict[ci] === undefined ? 1 : dict[ci] + 1;
    };
    var point = s % 10;

    var exists = false;
    for (var i in dict) {
        var other = (10 + point - i) % 10;
        if (dict[other]) {
            if ((other == i && dict[other] >= 2) || (other!=i&&dict[other] >= 1)) {
                exists = true;
                break;
            }
        }

    }
    return exists ? point : -1;
}

console.log(cal(getCards()));