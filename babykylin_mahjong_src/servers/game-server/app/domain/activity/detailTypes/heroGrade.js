/**
 * Created by 卢家泉 on 2017/7/15.
 * 活动内4个武装到达评级
 */

var util = require('util');

var _ = require('underscore');

var ConditionAward = require('./conditionAward');

var HeroGrade = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on('onActHeroGrade', this.onHeroGrade.bind(this));
};

util.inherits(HeroGrade, ConditionAward);

var pro = HeroGrade.prototype;

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
pro.progress = function (heroMaxGradeSet) {
    var isNew = false;
    var tRoleTypeSet = [];
    _.each(this.conditionsDict, function (condStatus) {
        tRoleTypeSet = [];
        heroMaxGradeSet.forEach(function(heroMaxGrade){
            if(heroMaxGrade.maxGrade >= condStatus.param01){
                tRoleTypeSet.push(heroMaxGrade.roleType);
            }
        });
        if(condStatus.progress !== tRoleTypeSet.length){
            condStatus.progress = tRoleTypeSet.length;
            isNew = true;
        }
    });
    if(isNew){
        this.save();
        this.refreshRedSpot();
    }
};

pro.onHeroGrade = function (heroBagItems) {
    if (!this.isOpen()) {
        return;
    }
    var heroMaxLvMap = {};
    _.each(heroBagItems, function (hero) {
        if(heroMaxLvMap[hero.data.roleType]){
            if(heroMaxLvMap[hero.data.roleType].maxGrade < hero.data.roleGrade){
                heroMaxLvMap[hero.data.roleType].maxGrade = hero.data.roleGrade;
            }
        }else{
            heroMaxLvMap[hero.data.roleType] = {
                roleType : hero.data.roleType,
                maxGrade : hero.data.roleGrade
            }
        }
    });
    this.progress(_.values(heroMaxLvMap));
};

module.exports = HeroGrade;