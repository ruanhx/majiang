/**
 * Created by tony on 2016/9/19.
 */

var util = require('util');

var _ = require('underscore');

var ConditionAward = require('./conditionAward');

var TotalEndlessScore = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on('doEndlessSettlement', this.doEndlessSettlement.bind(this));
};

util.inherits(TotalEndlessScore, ConditionAward);

var pro = TotalEndlessScore.prototype;

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
pro.progress = function (score) {
    _.each(this.conditionsDict, function (condStatus) {
        condStatus.progress += score;
    });
    if (score > 0) {
        this.save();
        this.refreshRedSpot();
    }
};

pro.doEndlessSettlement = function (score) {
    if (!this.isOpen()) {
        return;
    }
    this.progress(score);
};

module.exports = TotalEndlessScore;