/**
 * Created by kilua on 2016/6/22 0022.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var ActivityGoods = function (data) {
    IndexData.call(this, data, [['id']]);
};

util.inherits(ActivityGoods, IndexData);

var pro = ActivityGoods.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'goodsId';
};

module.exports = function (data) {
    return new ActivityGoods(data);
};