/**
 * Created by Administrator on 2016/3/11 0011.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var RequiredCost = function (data) {
    IndexData.call(this, data);
};

util.inherits(RequiredCost, IndexData);

var pro = RequiredCost.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'number';
};

module.exports = function (data) {
    return new RequiredCost(data);
};