/**
 * Created by max on 2017/7/8.
 */

var util = require('util'),
    pomelo = require('pomelo');

var _ = require('underscore');

var Activity = require('./activity'),
    starRankingList = require('../../world/rankList/starRankingList'),
    dataApi = require('../../../util/dataApi');

var barrierScoreRank = function (manager, actData) {
    Activity.call(this, manager, actData);
};

util.inherits(barrierScoreRank, Activity);

var pro = barrierScoreRank.prototype;


pro.reset = function () {
    pomelo.app.rpc.world.rankListRemote.sendBarrierScoreAward("*", {}, function () {

    });
};

// pro.onClose = function () {
//     starRankingList.getModle().dispatchAwards();
//     if (this.isOpenByOpFlags()) {
//         // 活动无运营标识或运营标识未关闭，当活动时间结束时
//         if (this.haveAwardsToDraw()) {
//             //若有奖励可领取，活动在列表中消失（开启活动界面状态下不刷新），同时将奖励直接发给玩家（不在线的玩家上线时给予）
//             this.applyAllAvailableAwards();
//             this.manager.remove(this);
//         } else {
//             //若无奖励可领取，则活动在列表中消失
//             this.manager.remove(this);
//         }
//     } else {
//         // 活动时间到的时候，对应标志之前已被关闭，直接删除活动
//         this.manager.remove(this);
//     }
// };

module.exports = barrierScoreRank;