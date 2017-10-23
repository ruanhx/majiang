/**
 * Created by employee11 on 2016/3/1.
 */
var util = require('util');

var utils = require('../utils'),
    IndexData = require('../jsonTable');

var HeroAttribute = function (data) {
    IndexData.call(this, data, [['heroId', 'quality']]);
};

util.inherits(HeroAttribute, IndexData);

var pro = HeroAttribute.prototype;

pro.rowParser = function (row) {
    //row.Id = row.id;
    //row.id = [row.heroId, row.quality].join('_');
    row.skills = utils.parseParams(row.skills, '#');
    row.jumpSkill = utils.parseParams(row.jumpSkill, '#');
    //row.jumpSkill.forEach(function(jumpSkill){
    //    row.skills.unshift(jumpSkill);
    //});
    //row.skills.unshift(row.bigSkill);
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

/*
 *   通过猎魔人id，查找猎魔人数据
 * */
pro.getHeroDataById = function (heroId) {
    return this.findById(heroId);
};

module.exports = function (data) {
    return new HeroAttribute(data);
};