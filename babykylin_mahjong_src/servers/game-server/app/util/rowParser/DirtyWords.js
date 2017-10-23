/**
 * Created by tony on 2016/12/26.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var DirtyWords = function (data) {
    IndexData.call(this, data);
};

util.inherits(DirtyWords, IndexData);

var pro = DirtyWords.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

module.exports = function (data) {
    return new DirtyWords(data);
};