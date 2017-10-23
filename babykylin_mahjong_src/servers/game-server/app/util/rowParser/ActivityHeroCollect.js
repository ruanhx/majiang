/**
 * Created by kilua on 2016/6/23 0023.
 */

var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');
var ActivityHeroCollect = function (data) {
    IndexData.call(this, data, [['id']]);
};

util.inherits(ActivityHeroCollect, IndexData);

var pro = ActivityHeroCollect.prototype;

pro.rowParser = function (row) {
    row.heroIds = utils.parseParams(row.heroIds, '#');
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

module.exports = function (data) {
    return new ActivityHeroCollect(data);
};
