/**
 * Created by kilua on 2016/7/18 0018.
 */

var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var EndlessBuff = function (data) {
    IndexData.call(this, data);
};

util.inherits(EndlessBuff, IndexData);

var pro = EndlessBuff.prototype;

pro.rowParser = function (row) {
    row.moneyNum = utils.parseParams(row.moneyNum, '#');
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

module.exports = function (data) {
    return new EndlessBuff(data);
};