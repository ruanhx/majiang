/**
 * Created by tony on 2016/10/3.
 */
var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var ActivetyStrength = function (data) {
    IndexData.call(this, data, [['group']]);
};

util.inherits(ActivetyStrength, IndexData);

var pro = ActivetyStrength.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

module.exports = function (data) {
    return new ActivetyStrength(data);
};