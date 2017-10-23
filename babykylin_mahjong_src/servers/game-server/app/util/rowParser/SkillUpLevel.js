/**
 * Created by Administrator on 2016/3/7 0007.
 */

var util = require('util');

var utils = require('../utils'),
    consts = require('../../consts/consts'),
    IndexData = require('../jsonTable');

var SkillUpLevel = function (data) {
    IndexData.call(this, data);
};

util.inherits(SkillUpLevel, IndexData);

var pro = SkillUpLevel.prototype;

pro.rowParser = function (row) {
    row.id = row.level;
    // row.unInitiativeSkills = utils.parseParams(row.unInitiativeSkills, '#');
    // row.skills = [];
    // row.skills.push(row.initiativeSkill);
    // row.skills.push(row.jumpSkill);
    // row.skills = row.skills.concat(row.unInitiativeSkills);
    return row;
};

pro.getPrimaryKey = function () {
    return 'level';
};

pro.getLevelUpCost = function (skillType, curLV, addLV, upRate) {
    var i, totalCost = 0, levelUpData,rowField;
    if(skillType === consts.HERO_SKILL_TYPES.SUPER || skillType === consts.HERO_SKILL_TYPES.FEATURE){
        rowField = "centerSkillNeedCoreNum";
    }else if(skillType === consts.HERO_SKILL_TYPES.ADVANCE_SMALL){
        rowField = "smallSkillNeedCoreNum";
    }else{
        return Number.POSITIVE_INFINITY;
    }
    for (i = curLV; i < curLV + addLV; ++i) {
        levelUpData = this.findById(i);
        if (levelUpData) {
            totalCost += Math.ceil(levelUpData[rowField] * upRate)
        } else {
            totalCost += Number.POSITIVE_INFINITY;
        }
    }
    return totalCost;
};

module.exports = function (data) {
    return new SkillUpLevel(data);
};