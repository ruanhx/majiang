/**
 * Created by kilua on 2016/7/1 0001.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var FunctionOpen = function (data) {
    IndexData.call(this, data);
};

util.inherits(FunctionOpen, IndexData);

var pro = FunctionOpen.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

module.exports = function (data) {
    return new FunctionOpen(data);
};