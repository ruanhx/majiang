/**
 * Created by cxy on 2015/9/2.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore'),
    pomelo = require('pomelo');

var dataApi = require('../../util/dataApi'),
    inviteDao = require('../../dao/inviteDao'),
    common = require('../../util/utils'),
    Consts = require('../../consts/consts');

var inviteManager = function () {

};

module.exports = inviteManager;
var pro = inviteManager;

/**
 *  玩家充值后， 影响被邀请者的奖励状态
 *  barrierId:关卡id
 */
pro.OnPlayerCharge = function (player, barrierId,playerLastBarrierId, lastBuyGetDiamond) {
    var dbClient = pomelo.app.get('dbclient'),
        inviteId = player.id;

    inviteDao.getPlayerInviteList(dbClient, inviteId, function (err, list) {
        _.each(list, function (target) {
            // 被邀请者ID， 邀请者ID， 邀请者现有钻石数， 邀请者上次的钻石数
            pomelo.app.rpc.area.inviteRemote.onInviteChange.toServer('*', target.id, player.id, player.buyGetDiamond, function(){});
        });
    });

    // 邀请者ID， 被邀请者ID， 被邀请者变化后的等级，被邀请者现有钻石数， 被邀请者上次的钻石数
    pomelo.app.rpc.area.inviteRemote.onPlayerChange.toServer('*', player.inviteId, player.id, barrierId,playerLastBarrierId, player.buyGetDiamond, lastBuyGetDiamond, function(){});
};

pro.initInviteData = function (player) {
    var dbClient = pomelo.app.get('dbclient');
    var act = player.activityMgr.getByType(Consts.ACTIVITY_TYPE.PLZ_CODE);

    if (null == act)
        return;

    var updateFinish = 0;
    _.each(act.condDict, function (condDetail) {
        var inviteData = dataApi.InvitCfg.findBy('id', condDetail.id)[0];

        logger.debug('inviteData.id = %s ',inviteData.id);
        var param1s = common.parseParams(inviteData.param1, '#');
        if (inviteData.rewardType == 2) {
            if (inviteData.conditionType == 1) {
                updateFinish = updateFinish + 1;
                inviteDao.getInviteMeCharge(dbClient, player.inviteId, function (err, inviteCharge) {
                    if (null == err)
                        condDetail.count = inviteCharge;
                    //因为存在异步同步 （这样保证最后一次才推送数据给前端）
                    if(--updateFinish <= 0){
                        //act.pushNew();
                    }
                });
            }
        }
        //关卡条件（这边这样处理数据多的话会存在效率问题 需要优化）
        if (inviteData.rewardType == Consts.INVIT_REWARD_TYPE.BIT_AWARD ||
            (inviteData.rewardType == Consts.INVIT_REWARD_TYPE.INVIT_AWARD && inviteData.conditionType == Consts.INVIT_COND_TYPE.BARRIER)) {
            // 大奖: 邀请玩家达成该奖励对应的等级、人数
            if (inviteData.conditionType == Consts.INVIT_COND_TYPE.BARRIER) {
                updateFinish = updateFinish + 1;
                condDetail.count = 0;
                inviteDao.getPlayerInviteList(dbClient, player.id, function (err, list) {
                    _.each(list, function (target) {
                        inviteDao.getInviteOtherLevel(dbClient, target.id, param1s[0], function (err, count) {
                            if (null == err)
                                if( count > 0 ){
                                    condDetail.count +=1 ;
                                }
                            // if(--updateFinish <= 0){
                            //     act.pushNew();
                            // }
                        });
                    });
                });
            }
        }
        //2=邀请奖励
        else if (inviteData.rewardType == Consts.INVIT_REWARD_TYPE.INVIT_AWARD) {
            //3=邀请好友各充值
            if (inviteData.conditionType == Consts.INVIT_COND_TYPE.CHARGE_DIAMOND){
                updateFinish = updateFinish + 1;
                inviteDao.getInviteOtherCharge(dbClient, player.id, param1s[0], function (err, count) {
                    if (null == err)
                        condDetail.count = count;

                    // if(--updateFinish <= 0)
                    //     act.pushNew();
                });
            }
        }
    });
};

