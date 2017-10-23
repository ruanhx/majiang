/**
 * Created by Administrator on 2016/3/25 0025.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var teamBarrier = function (data) {
    IndexData.call(this, data);
};

util.inherits(teamBarrier, IndexData);

var pro = teamBarrier.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

module.exports = function (data) {
    return new teamBarrier(data);
};