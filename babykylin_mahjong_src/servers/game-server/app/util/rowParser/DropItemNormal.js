/**
 * Created by Administrator on 2016/3/25 0025.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var DropItemNormal = function (data) {
    IndexData.call(this, data);
};

util.inherits(DropItemNormal, IndexData);

var pro = DropItemNormal.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
};

module.exports = function (data) {
    return new DropItemNormal(data);
};