/**
 * Created by rhx on 2017/6/8.
 */

var rankListManager = function () {
    this.ranks = [];
};
var pro = rankListManager.prototype;

pro.setRankByType = function (rank, type) {
    this.ranks[type] = rank;
};

pro.getRankByType = function (type) {
    return this.ranks[type];
};

var _getInstance;
module.exports.getInstance = function () {
    if (!_getInstance) {
        _getInstance = new rankListManager();
    }
    return _getInstance;
};