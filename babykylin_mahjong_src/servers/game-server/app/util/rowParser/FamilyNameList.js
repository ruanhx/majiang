/**
 * Created by kilua on 2016/7/23 0023.
 */

var util = require('util');

var _ = require('underscore');

var IndexData = require('../jsonTable');

var FAMILY_NAME_TYPE = {PLAYER: 1, AI: 2};

var FamilyNameList = function (data) {
    IndexData.call(this, data, [['type']]);
};

util.inherits(FamilyNameList, IndexData);

var pro = FamilyNameList.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

/*
 *   根据指定类型，随机一个姓氏
 *   @param {Boolean} forAI 是否为AI生成姓氏
 * */
pro.getRndFamilyNameByType = function (forAI) {
    var type = forAI ? FAMILY_NAME_TYPE.AI : FAMILY_NAME_TYPE.PLAYER;
    var familyNameData = _.sample(this.findByIndex({type: type}));
    return familyNameData ? familyNameData.familyName : '';
};

module.exports = function (data) {
    return new FamilyNameList(data);
};
