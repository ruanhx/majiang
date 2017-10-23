/**
 * Created by kilua on 2016/7/17 0017.
 */

var util = require('util');

var _ = require('underscore');

var IndexData = require('../jsonTable');

//解析出星星数和等级
function extractStarAndLV(wakeUpLV) {
    var star = Math.floor(wakeUpLV / 10),
        lv = wakeUpLV % 10;
    return {star: star, lv: lv};
}

//数据索引
//由部位 星星 等级
var EquipWakeup = function (data) {
    IndexData.call(this, data, [['star', 'lv', 'part']]);
};

util.inherits(EquipWakeup, IndexData);

var pro = EquipWakeup.prototype;

pro.rowParser = function (row) {
    return row;
};


pro.extractStarAndLV = function (wakeUpLV) {
    var star = Math.floor(wakeUpLV / 10),
        lv = wakeUpLV % 10;
    return {star: star, lv: lv};
};



pro.getPrimaryKey = function () {
    return 'id';
};

pro.getWakeUpData = function (wakeUpLV, part) {
    var wakeUp = extractStarAndLV(wakeUpLV),
        wakeUpData = this.findByIndex({star: wakeUp.star, lv: wakeUp.lv, part: part});
    if (_.isArray(wakeUpData)) {
        // 找不到数据时，结果是个空数组；找到多条数据时，结果是个数组
        return null;
    }
    return wakeUpData;
};
///*
// *   查找觉醒等级加成百分比，该加成加成攻击和生命(由于某些部位只有工具属性，某些部位只有生命属性，所以结果是有的部位只加攻击，有的部分只加生命)
// * */
//pro.getAllAdd = function (wakeUpLV, part) {
//    var wakeUpData = this.getWakeUpData(wakeUpLV, part);
//    return wakeUpData ? wakeUpData.allAdd : 0;
//};

/*
 *   查找觉醒需要的金币
 * */
pro.getNeedGold = function (wakeUpLV, part) {
    var wakeUpData = this.getWakeUpData(wakeUpLV, part);
    return wakeUpData ? wakeUpData.goldNum : Number.POSITIVE_INFINITY;
};

/*
 *   查找觉醒需要的材料
 * */
pro.getNeedMaterials = function (wakeUpLV, part) {
    var wakeUpData = this.getWakeUpData(wakeUpLV, part), i, materials = [];
    if (!wakeUpData) {
        return materials;
    }
    for (i = 1; i <= 4; ++i) {
        materials.push({itemId: wakeUpData[util.format('need%s', i)], count: wakeUpData[util.format('needNum%s', i)]});
    }
    return materials;
};

module.exports = function (data) {
    return new EquipWakeup(data);
};