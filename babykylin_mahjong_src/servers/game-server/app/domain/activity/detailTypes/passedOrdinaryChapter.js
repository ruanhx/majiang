/**
 * Created by 卢家泉 on 2017/7/15.
 * 活动内通关普通关卡达到章节
 */
var util = require('util');

var _ = require('underscore');

var ConditionAward = require('./conditionAward');

var PassedOrdinaryChapter = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on('onActPassedOrdinaryChapter', this.onPassedChapter.bind(this));
};

util.inherits(PassedOrdinaryChapter, ConditionAward);

var pro = PassedOrdinaryChapter.prototype;

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
// pro.progress = function (chapterId) {
//     var isNew = false;
//     _.each(this.conditionsDict, function (condStatus) {
//         if(condStatus.progress < chapterId){
//             condStatus.progress = chapterId;
//             isNew  |= true;
//         }
//     });
//     if(isNew){
//         this.save();
//         //this.pushNew();
//     }
// };

pro.onPassedChapter = function (chapterId) {
    if (!this.isOpen()) {
        return;
    }
    this.progress(chapterId);
};

module.exports = PassedOrdinaryChapter;