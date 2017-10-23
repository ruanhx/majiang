/**
 * Created by kilua on 2016/5/19 0019.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var Guide = function (data) {
    IndexData.call(this, data);
};

util.inherits(Guide, IndexData);

var pro = Guide.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

module.exports = function (data) {
    return new Guide(data);
};