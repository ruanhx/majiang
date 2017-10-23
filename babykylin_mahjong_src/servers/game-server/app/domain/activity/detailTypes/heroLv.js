/**
 * Created by 卢家泉 on 2017/7/15.
 * 活动内4个武装到达等级
 */

var util = require('util'),
    logger = require('pomelo-logger').getLogger(__filename);;

var _ = require('underscore');

var ConditionAward = require('./conditionAward');

var HeroLv = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on('onActHeroLevelUp', this.onHeroLevelUp.bind(this));
};

util.inherits(HeroLv, ConditionAward);

var pro = HeroLv.prototype;

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
pro.progress = function (heroMaxLvSet) {
    var isNew = false;
    var tRoleTypeSet = [];
    _.each(this.conditionsDict, function (condStatus) {
        tRoleTypeSet = [];
        heroMaxLvSet.forEach(function(heroMaxLv){
            if(heroMaxLv.maxLv >= condStatus.param01){
                tRoleTypeSet.push(heroMaxLv.roleType);
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

pro.onHeroLevelUp = function (heroBagItems) {
    if (!this.isOpen()) {
        return;
    }
    var heroMaxLvMap = {};
    _.each(heroBagItems, function (hero) {
        if(!hero){
            logger.error("heroBagItems:%j",heroBagItems);
        }else{
            if(heroMaxLvMap[hero.data.roleType]){
                if(heroMaxLvMap[hero.data.roleType].maxLv < hero.curLevel){
                    heroMaxLvMap[hero.data.roleType].maxLv = hero.curLevel;
                }
            }else{
                heroMaxLvMap[hero.data.roleType] = {
                    roleType : hero.data.roleType,
                    maxLv : hero.curLevel
                }
            }
        }

    });
    this.progress(_.values(heroMaxLvMap));
};

module.exports = HeroLv;