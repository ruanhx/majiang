/**
 * Created by kilua on 2016/7/18 0018.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var EndlessBattle = function (data) {
    IndexData.call(this, data, [['id']]);
};

util.inherits(EndlessBattle, IndexData);

var pro = EndlessBattle.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return '';
};

module.exports = function (data) {
    return new EndlessBattle(data);
};