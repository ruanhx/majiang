/**
 * Created by tony on 2016/9/19.
 */

var util = require('util');

var _ = require('underscore');

var ConditionAward = require('./conditionAward');

var TotalOrdinaryBarrierCnt = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on('FightOrdinarfyBarrier', this.onFightOrdinarfyBarrier.bind(this));
};

util.inherits(TotalOrdinaryBarrierCnt, ConditionAward);

var pro = TotalOrdinaryBarrierCnt.prototype;

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
        condStatus.progress += 1;
    });
    this.save();
    this.refreshRedSpot();
};

pro.onFightOrdinarfyBarrier = function (barrierId) {
    if (!this.isOpen()) {
        return;
    }
    this.progress();
};

module.exports = TotalOrdinaryBarrierCnt;