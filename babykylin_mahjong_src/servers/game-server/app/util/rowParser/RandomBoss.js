/**
 * Created by tony on 2017/2/25.
 */

var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var RandomBoss = function (data) {
    IndexData.call(this, data, [['customId']]);
};

util.inherits(RandomBoss, IndexData);

var pro = RandomBoss.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'randomBossId';
};

module.exports = function (data) {
    return new RandomBoss(data);
};