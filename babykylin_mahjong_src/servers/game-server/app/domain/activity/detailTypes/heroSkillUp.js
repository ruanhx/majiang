/**
 * Created by 卢家泉 on 2017/7/15.
 * 活动内4个武装突破
 */

var util = require('util');

var _ = require('underscore');

var ConditionAward = require('./conditionAward');

var HeroSkillUp = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on('onActHeroSkillUp', this.onHeroSkillUp.bind(this));
};

util.inherits(HeroSkillUp, ConditionAward);

var pro = HeroSkillUp.prototype;

pro.init = function () {
    var self = this;
    var conds = self.getConditionList();
    conds.forEach(function (cond) {
        //TODO:要把活动开启前的进度加进来
        var condStatus = self.conditionsDict[cond.id];
        if (!condStatus) {
            condStatus = self.conditionsDict[cond.id] = {};
        }
        condStatus.param01 = cond.param01;//附加条件，用来判断进度书否可以加 这里是英雄等级
        condStatus.progress = 0;
        condStatus.isDrew = 0;
    });
    return true;
};

/*
 *   更新进度，并保存
 * */
pro.progress = function (heroMaxMSkillLvSet) {
    var isNew = false;
    var tRoleTypeSet = [];
    _.each(this.conditionsDict, function (condStatus) {
        tRoleTypeSet = [];
        heroMaxMSkillLvSet.forEach(function(heroMaxMSkillLv){
            if(heroMaxMSkillLv.maxMSkillLv >= condStatus.param01){
                tRoleTypeSet.push(heroMaxMSkillLv.roleType);
            }
        });
        if(condStatus.progress < tRoleTypeSet.length){
            condStatus.progress = tRoleTypeSet.length;
            isNew = true;
        }
    });
    if(isNew){
        this.save();
        this.refreshRedSpot();
    }
};

pro.onHeroSkillUp = function (heroItems) {
    if (!this.isOpen()) {
        return;
    }
    var heroMaxMSkillLvMap = {};
    _.each(heroItems, function (hero) {
        if(heroMaxMSkillLvMap[hero.data.roleType]){
            if(heroMaxMSkillLvMap[hero.data.roleType].maxMSkillLv < hero.getMainSkill().lv){
                heroMaxMSkillLvMap[hero.data.roleType].maxMSkillLv = hero.getMainSkill().lv;
            }
        }else{
            heroMaxMSkillLvMap[hero.data.roleType] = {
                roleType : hero.data.roleType,
                maxMSkillLv : hero.getMainSkill().lv
            }
        }
    });
    this.progress(_.values(heroMaxMSkillLvMap));
};

module.exports = HeroSkillUp;