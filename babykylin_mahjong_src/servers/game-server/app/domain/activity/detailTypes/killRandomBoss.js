/**
 * Created by 卢家泉 on 2017/7/15.
 * 活动内击杀随机boss
*/
var util = require('util');

var _ = require('underscore');

var ConditionAward = require('./conditionAward');

var KillRandomBoss = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on('onActKillRandomBoss', this.kill.bind(this));
};

util.inherits(KillRandomBoss, ConditionAward);

var pro = KillRandomBoss.prototype;

pro.init = function () {
    var self = this;
    var conds = self.getConditionList();
    conds.forEach(function (cond) {
        var condStatus = self.conditionsDict[cond.id];
        if (!condStatus) {
            condStatus = self.conditionsDict[cond.id] = {};
        }
        condStatus.progress = 0;
        condStatus.isDrew = 0;
    });
    return true;
};

/*
 *   更新进度，并保存
 * */
pro.progress = function () {
    _.each(this.conditionsDict, function (condStatus) {
            condStatus.progress ++;
    });
    this.save();
    this.refreshRedSpot();

};

pro.kill = function () {
    if (!this.isOpen()) {
        return;
    }

    this.progress();
};

module.exports = KillRandomBoss;