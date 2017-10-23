/**
 * Created by kilua on 2016/6/24 0024.
 */

var util = require('util');

var _ = require('underscore');

var ConditionAward = require('./conditionAward');

var TotalConsume = function (manager, player, actDta) {
    ConditionAward.call(this, manager, player, actDta);
    player.on('onConsume', this.onConsume.bind(this));
};

util.inherits(TotalConsume, ConditionAward);

var pro = TotalConsume.prototype;

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

/*
 *   消费事件监听器
 *   @param {Number} diamond 本次消费钻石
 * */
pro.onConsume = function (diamond) {
    if (!this.isOpen()) {
        return;
    }
    this.progress(diamond);
};

module.exports = TotalConsume;
