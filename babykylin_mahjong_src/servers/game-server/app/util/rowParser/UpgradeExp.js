/**
 * Created by Administrator on 2016/3/7 0007.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var upgradeExp = function (data) {
    IndexData.call(this, data);
};

util.inherits(upgradeExp, IndexData);

var pro = upgradeExp.prototype;

pro.rowParser = function (row) {
    row.id = row.lv;
    return row;
};

pro.getPrimaryKey = function () {
    return 'lv';
};

module.exports = function (data) {
    return new upgradeExp(data);
};