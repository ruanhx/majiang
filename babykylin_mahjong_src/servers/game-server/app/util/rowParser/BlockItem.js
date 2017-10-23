/**
 * Created by Administrator on 2016/3/11 0011.
 */

var util = require('util'),
    _ = require('underscore');

var IndexData = require('../jsonTable');

var BlockItem = function (data) {
    IndexData.call(this, data);
};

util.inherits(BlockItem, IndexData);

var pro = BlockItem.prototype;
var robotUseItemId = [];
pro.rowParser = function (row) {
    if (row.type == 1) {
        robotUseItemId.push(row.id);
    }
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};
/**
 * 获取随机道具
 */
pro.getRandItem = function () {
    var index = _.random(0,robotUseItemId.length);
    var itemId = robotUseItemId[index];
    return this.findById(itemId);
};
module.exports = function (data) {
    return new BlockItem(data);
};