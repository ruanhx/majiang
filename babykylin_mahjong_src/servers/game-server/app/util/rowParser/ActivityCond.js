/**
 * Created by kilua on 2016/6/22 0022.
 */

var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var ActivityCond = function (data) {
    IndexData.call(this, data, [['id']]);
};

util.inherits(ActivityCond, IndexData);

var pro = ActivityCond.prototype;

pro.rowParser = function (row) {
    row.condParam = utils.parseParams(row.condParam, '#');
    row.condParam01 = utils.parseParams(row.condParam01, '#');
    row.dropIds = utils.parseParams(row.dropIds, '#');
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

module.exports = function (data) {
    return new ActivityCond(data);
};