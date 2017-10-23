/**
 * Created by 卢家泉 on 2017/7/15.
 * 活动内无尽历史最高分达到一定分值。
 */

var util = require('util');

var _ = require('underscore');

var ConditionAward = require('./conditionAward');

var EndlessHighScore = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on('onActEndlessHighScore', this.updateEndlessHighScore.bind(this));
};

util.inherits(EndlessHighScore, ConditionAward);

var pro = EndlessHighScore.prototype;

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
// pro.progress = function (highScore) {
//     _.each(this.conditionsDict, function (condStatus) {
//             condStatus.progress = highScore;
//     });
//     this.save();
//     //this.pushNew();
//
// };

pro.updateEndlessHighScore = function (highScore) {
    if (!this.isOpen()) {
        return;
    }

    this.progress(highScore);
};

module.exports = EndlessHighScore;