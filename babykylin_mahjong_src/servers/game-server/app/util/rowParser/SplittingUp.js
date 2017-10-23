/**
 * Created by tony on 2016/11/23.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var SplittingUp = function (data) {
    IndexData.call(this, data);
};

util.inherits(SplittingUp, IndexData);

var pro = SplittingUp.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'needRoleQuality';
};

module.exports = function (data) {
    return new SplittingUp(data);
};