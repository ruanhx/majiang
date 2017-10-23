/**
 * Created by 卢家泉 on 2017/7/15.
 * 活动内抓宝排行到达名次
*/
var util = require('util');

var _ = require('underscore');

var ConditionAward = require('./conditionAward');

var ActEctypePass = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on('onActActEctypePass', this.change.bind(this));
};

util.inherits(ActEctypePass, ConditionAward);

var pro = ActEctypePass.prototype;

pro.init = function () {
    var self = this;
    var conds = self.getConditionList();
    //TODO:加载进度
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
// pro.progress = function (diff) {
//     _.each(this.conditionsDict, function (condStatus) {
//         if(diff>condStatus.progress){
//             condStatus.progress = diff;
//         }
//     });
//     this.save();
//     //this.pushNew();
//
// };

pro.change = function (diff) {
    if (!this.isOpen()) {
        return;
    }

    this.progress(diff);
};

module.exports = ActEctypePass;