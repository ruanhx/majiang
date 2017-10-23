/**
 * Created by kilua on 2016/6/23 0023.
 * 战斗力活动
 */

var util = require('util');
var logger = require('pomelo-logger').getLogger(__filename);
var ConditionAward = require('./conditionAward'),
    EVENTS = require('../../event/events');

var Power = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on(EVENTS.UPDATE_PROP, this.onUpdateProp.bind(this));
};

util.inherits(Power, ConditionAward);

var pro = Power.prototype;

pro.init = function () {
    // 读取当前猎魔人战斗力来初始化各条件进度
    var self = this;
    var conds = self.getConditionList();
    conds.forEach(function (cond) {
        var condStatus = self.conditionsDict[cond.id];
        if (!condStatus) {
            condStatus = self.conditionsDict[cond.id] = {};
        }
        condStatus.progress = self.player.highPower;
        condStatus.isDrew = 0;
    });
    return true;
};

/*
 *   监控最高战斗力更新
 * */
pro.onUpdateProp = function (prop, value) {
    if (prop === 'highPower') {
        // 更新进度
        // logger.debug("监控最高战斗力更新 power.onUpdateProp() 更新进度");
        this.progress(value);
    }
};

module.exports = Power;