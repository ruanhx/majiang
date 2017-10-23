/**
 * Created by kilua on 2016/6/24 0024.
 */

var util = require('util');

var ConditionAward = require('./conditionAward');

var SingleCharge = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on('onCharge', this.onCharge.bind(this));
};

util.inherits(SingleCharge, ConditionAward);

var pro = SingleCharge.prototype;

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

pro.onCharge = function (orderInfo) {
    if (!this.isOpen()) {
        return;
    }
    this.progress(orderInfo.diamond);
};

/*
 *   更新进度，并保存
 *   singleCharge特殊，单独处理
 * */
pro.progress = function (newProgress) {
    var changed = false;
    for(var key in this.conditionsDict){
        if (newProgress == key) {
            this.conditionsDict[key].progress = newProgress;
            changed = true;
        }
    }
    if (changed) {
        this.save();
        this.refreshRedSpot();
    }
};

module.exports = SingleCharge;
