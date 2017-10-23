/**
 * Created by tony on 2016/12/28.
 */
var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var ActivityRecharge = function (data) {
    IndexData.call(this, data);
};

util.inherits(ActivityRecharge, IndexData);

var pro = ActivityRecharge.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

module.exports = function (data) {
    return new ActivityRecharge(data);
};