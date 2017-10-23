/**
 * Created by Administrator on 2016/3/5 0005.
 */

var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var Skill = function (data) {
    IndexData.call(this, data);
};

util.inherits(Skill, IndexData);

var pro = Skill.prototype;

pro.rowParser = function (row) {
    row.logicEffects = utils.parseParams(row.logicEffects, '#');
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

module.exports = function (data) {
    return new Skill(data);
};