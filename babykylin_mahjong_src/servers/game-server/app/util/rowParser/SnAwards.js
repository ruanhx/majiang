/**
 * Created by Administrator on 2016/3/25 0025.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var SnAwards = function (data) {
    IndexData.call(this, data);
};

util.inherits(SnAwards, IndexData);

var pro = SnAwards.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

module.exports = function (data) {
    return new SnAwards(data);
};