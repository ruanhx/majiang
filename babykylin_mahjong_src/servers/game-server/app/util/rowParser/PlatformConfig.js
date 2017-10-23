/**
 * Created by tony on 2016/10/28.
 */
var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var PlatformConfig = function (data) {
    IndexData.call(this, data);
};

util.inherits(PlatformConfig, IndexData);

var pro = PlatformConfig.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

module.exports = function (data) {
    return new PlatformConfig(data);
};