/**
 * Created by tony on 2016/9/19.
 * 累计登陆条件奖励
 */


var util = require('util');

var _ = require('underscore'),
dataApi = require('../../../util/dataApi'),
    dropUtils = require('../../area/dropUtils');
var ConditionAward = require('./conditionAward');
var Activity = require('../playerActivity');
var Utils = require('./../../../util/utils');
var  TotalUseDiamond = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on('onActTotalUseGold', this.onUseGold.bind(this));
};


util.inherits(TotalUseDiamond, ConditionAward);

var pro = TotalUseDiamond.prototype;

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
    this.save();
    this.refreshRedSpot();
};

pro.onUseGold = function (cnt) {
    if (!this.isOpen()) {
        return;
    }
    this.progress(cnt);
};

module.exports = TotalUseDiamond;