/**
 * Created by kilua on 2016/7/18 0018.
 */

var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var EndlessType = function (data) {
    IndexData.call(this, data, [['type']]);
};

util.inherits(EndlessType, IndexData);

var pro = EndlessType.prototype;

pro.rowParser = function (row) {
    if (row.dayTimes === -1) {
        // -1表示不限制
        row.dayTimes = Number.POSITIVE_INFINITY;
    }
    row.buyPrice = utils.parseParams(row.buyPrice, '#');
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

/*
 *   AI是否该处于优势地位
 * */
pro.isAIAdvantageByOccasionId = function (occasionId) {
    var occasionData = this.findById(occasionId);
    if (occasionData) {
        return Math.random() < occasionData.aiGoodRate;
    }
    return false;
};

pro.getAiMatchCnt = function (occasionId) {
    var occasionData = this.findById(occasionId);
    var list = [];
    if (occasionData) {
        list = occasionData.aiAndWinRate.split("#");
    }
    return list.length;
};

pro.getAiWinRate = function (occasionId, count) {
    var occasionData = this.findById(occasionId);
    var list = [];
    if (occasionData) {
        list = occasionData.aiAndWinRate.split("#");
    }
    if(count>list.length-1){
        return null;
    }
    return list[count];
};

module.exports = function (data) {
    return new EndlessType(data);
};