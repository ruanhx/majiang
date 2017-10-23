/**
 * Created by rhx on 2017/6/8.
 */
var util = require('util');

var IndexData = require('../jsonTable');

var RollingInformation = function (data) {
    IndexData.call(this, data);
};

util.inherits(RollingInformation, IndexData);

var pro = RollingInformation.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'informationId';
};

module.exports = function (data) {
    return new RollingInformation(data);
};