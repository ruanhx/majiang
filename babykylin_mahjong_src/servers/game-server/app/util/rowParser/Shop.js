/**
 * Created by kilua on 2016/6/30 0030.
 */

var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var Shop = function (data) {
    IndexData.call(this, data);
};

util.inherits(Shop, IndexData);

var pro = Shop.prototype;

//主要是讲moneyShow变成数组
pro.rowParser = function (row) {
    row.moneyShow = utils.parseParams(row.moneyShow, '#');
    return row;
};

pro.getPrimaryKey = function () {
    return 'shopId';
};

module.exports = function (data) {
    return new Shop(data);
};