/**
 * Created by tony on 2016/10/3.
 */
var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var SysEamil = function (data) {
    IndexData.call(this, data, [['id']]);
};

util.inherits(SysEamil, IndexData);

var pro = SysEamil.prototype;

pro.rowParser = function (row) {

    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

module.exports = function (data) {
    return new SysEamil(data);
};

