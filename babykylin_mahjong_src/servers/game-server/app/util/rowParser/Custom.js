/**
 * Created by Administrator on 2016/3/11 0011.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var Custom = function (data) {
    IndexData.call(this, data);
};

util.inherits(Custom, IndexData);

var pro = Custom.prototype;

pro.rowParser = function (row) {
    row.id = row.customId;
    return row;
};

pro.getPrimaryKey = function () {
    return 'customId';
};

module.exports = function (data) {
    return new Custom(data);
};