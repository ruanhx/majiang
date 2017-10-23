/**
 * Created by tony on 2017/3/3.
 */
var util = require('util');
var utils = require('../utils');
var IndexData = require('../jsonTable');

var ComposeRand = function (data) {
    IndexData.call(this, data);
};

util.inherits(ComposeRand, IndexData);

var pro = ComposeRand.prototype;

pro.rowParser = function (row) {
    var list = utils.parseParams( row.gradeWeight , '#');
    row.gradeWeightTotal = _.reduce(list,function (a,b) {
        return a+b;
    },0);
    return row;
};

pro.getPrimaryKey = function () {
    return 'level';
};

module.exports = function (data) {
    return new ComposeRand(data);
};