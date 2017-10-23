/**
 * Created by tony on 2016/9/8.
 */

var util = require('util'),
    pomelo = require('pomelo');

var _ = require('underscore');

var Activity = require('./activity'),
    starRankingList = require('../../world/rankList/starRankingList'),
    dataApi = require('../../../util/dataApi');

var starRank = function (manager, player, actData) {
    Activity.call(this, manager, player, actData);
};

util.inherits(starRank, Activity);

var pro = starRank.prototype;


pro.onClose = function () {
    var self = this;
    pomelo.app.rpc.world.rankListRemote.sendStarRankAward("*", {}, function () {
        if (self.isOpenByOpFlags()) {
            // 活动无运营标识或运营标识未关闭，当活动时间结束时
            if (self.haveAwardsToDraw()) {
                //若有奖励可领取，活动在列表中消失（开启活动界面状态下不刷新），同时将奖励直接发给玩家（不在线的玩家上线时给予）
                self.applyAllAvailableAwards();
                self.manager.remove(self);
            } else {
                //若无奖励可领取，则活动在列表中消失
                self.manager.remove(self);
            }
        } else {
            // 活动时间到的时候，对应标志之前已被关闭，直接删除活动
            self.manager.remove(self);
        }
    });

};

module.exports = starRank;