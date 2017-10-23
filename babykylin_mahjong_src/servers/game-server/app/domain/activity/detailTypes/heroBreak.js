/**
 * Created by 卢家泉 on 2017/7/15.
 * 活动内4个武装突破
 */

var util = require('util');

var _ = require('underscore');

var ConditionAward = require('./conditionAward');

var HeroBreak = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on('onActHeroBreak', this.onHeroBreak.bind(this));
};

util.inherits(HeroBreak, ConditionAward);

var pro = HeroBreak.prototype;

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
pro.progress = function (heroMaxBreakSet) {
    var isNew = false;
    var tRoleTypeSet = [];
    _.each(this.conditionsDict, function (condStatus) {
        tRoleTypeSet = [];
        heroMaxBreakSet.forEach(function(heroMaxBreak){
            if(heroMaxBreak.maxBreak >= condStatus.param01){
                tRoleTypeSet.push(heroMaxBreak.roleType);
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

pro.onHeroBreak = function (heroBagItems) {
    if (!this.isOpen()) {
        return;
    }
    var heroMaxBreakMap = {};
    _.each(heroBagItems, function (hero) {
        if(heroMaxBreakMap[hero.data.roleType]){
            if(heroMaxBreakMap[hero.data.roleType].maxBreak < hero.quality){
                heroMaxBreakMap[hero.data.roleType].maxBreak = hero.quality;
            }
        }else{
            heroMaxBreakMap[hero.data.roleType] = {
                roleType : hero.data.roleType,
                maxBreak : hero.quality
            }
        }
    });
    this.progress(_.values(heroMaxBreakMap));
};

module.exports = HeroBreak;