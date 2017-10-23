/**
 * Created by tony on 2016/10/3.
 */
var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var HunterItemRefresh = function (data) {
    IndexData.call(this, data, [['treasureId']]);
};

util.inherits(HunterItemRefresh, IndexData);

var pro = HunterItemRefresh.prototype;

var hunterItemMaxCountMap = {}
pro.rowParser = function (row) {
    hunterItemMaxCountMap[row.treasureId] = (hunterItemMaxCountMap[row.treasureId] || 0) + Math.ceil(row.maxItemCnt);
    return row;
};

pro.getPrimaryKey = function () {
    return 'treasureId';
};

pro.getMaxCntByTreasureId = function(treasureId){
    return (hunterItemMaxCountMap[treasureId] || 0);
}

module.exports = function (data) {
    return new HunterItemRefresh(data);
};

