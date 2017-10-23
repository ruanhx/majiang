/**
 * Created by kilua on 2016/7/18 0018.
 */

var util = require('util');

var _ = require('underscore');

var IndexData = require('../jsonTable');

var EndlessScoreBox = function (data) {
    IndexData.call(this, data, [['id']]);
};

util.inherits(EndlessScoreBox, IndexData);

var pro = EndlessScoreBox.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return '';
};

/*
 *   查找不大于指定得分的最高记录
 * */
pro.getSmallerMaxByScore = function (occasionId, score) {
    var smaller = _.filter(this.findBy('id', occasionId), function (row) {
        return row.score <= score;
    });
    var smallerMax = _.max(smaller, function (row) {
        return row.score;
    });
    return _.isEmpty(smallerMax) ? null : smallerMax;
};

module.exports = function (data) {
    return new EndlessScoreBox(data);
};