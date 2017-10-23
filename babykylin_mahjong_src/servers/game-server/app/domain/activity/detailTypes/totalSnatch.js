/**
 * Created by kilua on 2016/6/24 0024.
 */

var util = require('util');

var _ = require('underscore');

var ConditionAward = require('./conditionAward');

var TotalSnatch = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on('onActSnatch', this.onCharge.bind(this));
};

util.inherits(TotalSnatch, ConditionAward);

var pro = TotalSnatch.prototype;

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
pro.progress = function (cnt) {
    _.each(this.conditionsDict, function (condStatus) {
        condStatus.progress += cnt;
    });
    if (cnt > 0) {
        this.save();
        this.refreshRedSpot();
    }
};

pro.onCharge = function (cnt) {
    if (!this.isOpen()) {
        return;
    }
    this.progress(cnt);
};

module.exports = TotalSnatch;