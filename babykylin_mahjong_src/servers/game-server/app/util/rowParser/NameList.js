/**
 * Created by kilua on 2016/7/23 0023.
 */

var util = require('util');

var _ = require('underscore');

var IndexData = require('../jsonTable');

var NAME_TYPE = {PLAYER: 1, AI: 2};

var NameList = function (data) {
    IndexData.call(this, data, [['type']]);
};

util.inherits(NameList, IndexData);

var pro = NameList.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

/*
 *   根据指定类型，随机一个名字
 *   @param {Boolean} forAI 是否为AI生成名字
 * */
pro.getRndNameByType = function (forAI) {
    var type = forAI ? NAME_TYPE.AI : NAME_TYPE.PLAYER;
    var nameData = _.sample(this.findByIndex({type: type}));
    return nameData ? nameData.name : '';
};

module.exports = function (data) {
    return new NameList(data);
};
