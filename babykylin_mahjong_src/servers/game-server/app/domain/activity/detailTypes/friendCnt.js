/**
 * Created by 卢家泉 on 2017/7/15.
 * 活动内好友数量达到
*/
var util = require('util');

var _ = require('underscore');

var ConditionAward = require('./conditionAward');

var FriendCnt = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on('onActFriendChange', this.change.bind(this));
};

util.inherits(FriendCnt, ConditionAward);

var pro = FriendCnt.prototype;

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
// pro.progress = function (cnt) {
//     _.each(this.conditionsDict, function (condStatus) {
//         if(cnt>condStatus.progress){
//             condStatus.progress = cnt;
//         }
//     });
//     this.save();
//     //this.pushNew();
//
// };

pro.change = function (cnt) {
    if (!this.isOpen()) {
        return;
    }

    this.progress(cnt);
};

module.exports = FriendCnt;