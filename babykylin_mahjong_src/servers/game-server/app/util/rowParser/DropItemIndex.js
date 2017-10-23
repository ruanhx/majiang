/**
 * Created by Administrator on 2016/3/25 0025.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var DropItemIndex = function (data) {
    IndexData.call(this, data);
};

util.inherits(DropItemIndex, IndexData);

var pro = DropItemIndex.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
};

module.exports = function (data) {
    return new DropItemIndex(data);
};