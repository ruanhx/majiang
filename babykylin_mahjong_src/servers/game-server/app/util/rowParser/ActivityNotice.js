/**
 * Created by kilua on 2016/6/23 0023.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var ActivityNotice = function (data) {
    IndexData.call(this, data, [['id']]);
};

util.inherits(ActivityNotice, IndexData);

var pro = ActivityNotice.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return '';
};

module.exports = function (data) {
    return new ActivityNotice(data);
};