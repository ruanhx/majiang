/**
 * Created by cxy on 2015/9/2.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore'),
    dataApi = require('../../../util/dataApi'),
    pomelo = require('pomelo'),
    Consts = require('../../../consts/consts'),
    Code = require('../../../../shared/code'),
    utils = require('../../../util/utils'),
    area = require('../../../domain/area/area');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

//
pro.onInviteChange = function (playerId, inviteId, inviteCharge, cb) {
    var player = area.getPlayer(playerId);

    if (player == null)
        return cb(null);

    player.set('inviteId', inviteId);
    var act = player.activityMgr.getByType(Consts.ACTIVITY_TYPE.PLZ_CODE);

    if (null == act)
        return cb(null);

    var actChange = false;
    _.each(act.condDict, function (condDetail) {
        var inviteData = dataApi.InvitCfg.findBy('id', condDetail.id)[0];
        if (inviteData.rewardType == Consts.INVIT_REWARD_TYPE.INVIT_AWARD) {
            if (inviteData.conditionType == Consts.INVIT_COND_TYPE.INVIT) {
                condDetail.count = inviteCharge;
                //表示还没有领取奖励
                if (condDetail.isDrew <= 0){
                    actChange = true;
                }
            }
        }
    });

    // if (actChange)
    //     act.pushNew();

    cb(null);
};

//刷新inviteId人的数据
pro.onPlayerChange = function (inviteId, playerId,playerBarrierId, lastBarrierId, playerCharge, playerLastCharge, cb) {
    var player = area.getPlayer(inviteId);
    if (null == player)
        return cb(null);

    var act = player.activityMgr.getByType(Consts.ACTIVITY_TYPE.PLZ_CODE);
    if (null == act)
        return cb(null);

    var actChange = false;
    _.each(act.condDict, function (condDetail) {
        var inviteData = dataApi.InvitCfg.findBy('id', condDetail.id)[0];

        if (inviteData.rewardType  == Consts.INVIT_REWARD_TYPE.BIT_AWARD ||
            ( inviteData.rewardType == Consts.INVIT_REWARD_TYPE.INVIT_AWARD  && inviteData.conditionType == Consts.INVIT_COND_TYPE.BARRIER)) {

            var param1s = utils.parseParams(inviteData.param1, '#');

            // 大奖: 邀请玩家达成该奖励对应的等级、人数
            if (inviteData.conditionType == Consts.INVIT_COND_TYPE.BARRIER &&
                (lastBarrierId >= param1s[0] || lastBarrierId == 0) &&
                playerBarrierId > lastBarrierId) {
                condDetail.count = condDetail.count + 1;
                actChange = true;
            }
        }
        else if (inviteData.rewardType == Consts.INVIT_REWARD_TYPE.INVIT_AWARD) {
            var param1s = utils.parseParams(inviteData.param1, '#');
            //邀请奖励: 邀请好友完成首冲
            if (inviteData.conditionType == Consts.INVIT_COND_TYPE.CHARGE_DIAMOND &&
                (playerCharge >= param1s[0] || playerCharge == 0) &&
                playerCharge > playerLastCharge ) {
                condDetail.count = condDetail.count + 1;
                actChange = true;
            }
        }
    });

    // if (actChange)
    //     act.pushNew();

    cb(null);
};

//新增邀请码对象 OK
/* inviteId :    被邀请人的玩家id
 * inviteCount ：被邀请人的 已邀请人数
 * barrierId：   我的最新关卡id
 * playerCharge：我的充值获得的钻石总数
 * */
pro.OnPlayerInviteAdd = function( inviteId , inviteCount, playerbarrierId, playerCharge, cb)
{
    var player = area.getPlayer(inviteId);

    if (null == player)
        return cb(null);

    player.set('inviteCount', inviteCount);
    var activityMgr = player.activityMgr;
    var act = activityMgr.getByType( Consts.ACTIVITY_TYPE.PLZ_CODE );
    if (null == act)
        return cb(null);

    var actChange = false;
    _.each(act.condDict, function (condDetail) {
        var inviteData = dataApi.InvitCfg.findBy('id', condDetail.id)[0];
        var param1s = utils.parseParams(inviteData.param1, '#');
        if (inviteData.rewardType == Consts.INVIT_REWARD_TYPE.BIT_AWARD || (inviteData.rewardType == Consts.INVIT_REWARD_TYPE.INVIT_AWARD && inviteData.conditionType == Consts.INVIT_COND_TYPE.BARRIER)) {
            // 大奖: 邀请玩家达成该奖励对应的等级、人数
            if (inviteData.conditionType == Consts.INVIT_COND_TYPE.BARRIER
                && playerbarrierId >= param1s[0]) {
                condDetail.count = condDetail.count + 1;
                actChange = true;
            }
        }
        else if (inviteData.rewardType == Consts.INVIT_REWARD_TYPE.INVIT_AWARD) {
            //邀请奖励: 邀请好友完成首冲
            if (inviteData.conditionType == Consts.INVIT_COND_TYPE.CHARGE_DIAMOND
                && playerCharge >= param1s[0]) {
                condDetail.count = condDetail.count + 1;
                actChange = true;
            }
        }
    });

    //act.pushNew();
    cb(null);
};
