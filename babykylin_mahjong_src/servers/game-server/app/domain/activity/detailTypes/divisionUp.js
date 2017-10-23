/**
 * Created by 卢家泉 on 2017/7/15.
 * 活动内段位达到多少
 */

var util = require('util');

var _ = require('underscore');

var ConditionAward = require('./conditionAward');

var DivisionUp = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on('onActDivisionUp', this.divisionUp.bind(this));
};

util.inherits(DivisionUp, ConditionAward);

var pro = DivisionUp.prototype;

pro.init = function () {
    var self = this;
    var conds = self.getConditionList();
    conds.forEach(function (cond) {
        //TODO:要把活动开启前的进度加进来
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
// pro.progress = function (division) {
//     _.each(this.conditionsDict, function (condStatus) {
//             condStatus.progress = division;
//     });
//     this.save();
//     //this.pushNew();
//
// };

pro.divisionUp = function (division) {
    if (!this.isOpen()) {
        return;
    }

    this.progress(division);
};

module.exports = DivisionUp;