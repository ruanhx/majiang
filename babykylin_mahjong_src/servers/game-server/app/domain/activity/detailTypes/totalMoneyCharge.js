/**
 * Created by kilua on 2016/6/24 0024.
 */

var util = require('util');

var _ = require('underscore');

var ConditionAward = require('./conditionAward');

var TotalMoneyCharge = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on('onCharge', this.onCharge.bind(this));
};

util.inherits(TotalMoneyCharge, ConditionAward);

var pro = TotalMoneyCharge.prototype;

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
pro.progress = function (newProgress) {
    _.each(this.conditionsDict, function (condStatus) {
        condStatus.progress += newProgress;
    });
    if (newProgress > 0) {
        this.save();
        this.refreshRedSpot();
    }
};

pro.onCharge = function (orderInfo) {
    if (!this.isOpen()) {
        return;
    }
    this.progress(orderInfo.money);
};

module.exports = TotalMoneyCharge;