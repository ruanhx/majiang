/**
 * Created by kilua on 2016/6/30 0030.
 */

var util = require('util'),
    _ = require('underscore');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var RacingScore = function (data) {
    IndexData.call(this, data);
};

util.inherits(RacingScore, IndexData);

var pro = RacingScore.prototype;

pro.rowParser = function (row) {
    row.rankRange = utils.parseParams(row.rank, '#');
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

pro.getScoreByRank = function (rank) {
    var values = _.values(this.all());
    for (var i=0;i<values.length;i++){
        if (rank >= values[i].rankRange[0] && rank <= values[i].rankRange[1]) {
            return values[i].score;
        }
    }
    // this.all().forEach(function (rec) {
    //     if (rank >= rec.rankRange[0] && rank <= rec.rankRange[1]) {
    //
    //     }
    // })
};

module.exports = function (data) {
    return new RacingScore(data);
};