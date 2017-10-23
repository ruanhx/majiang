/**
 * Created by kilua on 2016/6/22 0022.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    dataApi = require('../../../util/dataApi'),
    dataUtils = require('../../../util/dataUtils'),
    dropUtils = require('../../../domain/area/dropUtils'),
    libUtils = require('../../../../mylib/utils/lib/utils'),
    CondDetail = require('../../../domain/activity/condDetail'),
    inviteDao = require('../../../dao/inviteDao'),
    inviteManager = require('../../../domain/area/inviteManager'),
    Consts = require('../../../consts/consts'),
    flow = require('../../../consts/flow');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

/*
 *   获取活动列表
 * */
pro.list = function (msg, session, next) {
    logger.debug('getList playerId = %s', session.get('playerId'));
    var player = area.getPlayer(session.get('playerId')),
        manager = player.activityMgr;
    if (!manager) {
        return next(null, {code: Code.FAIL});
    }

    next(null, {code: Code.OK, activities: manager.getClientInfo()});


};

/*
 *   点击活动详细内容，去除NEW标志
 * */
pro.viewDetail = function (msg, session, next) {
    logger.debug('viewDetail playerId = %s, actId = %s', session.get('playerId'), msg.actId);
    var player = area.getPlayer(session.get('playerId')),
        manager = player.activityMgr;
    if (!manager) {
        return next(null, {code: Code.FAIL});
    }
    var activity = manager.getById(msg.actId);
    if (!activity) {
        return next(null, {code: Code.AREA.NO_SUCH_ACTIVITY});
    }
    activity.setViewTick(Date.now());
    return next(null, {code: Code.OK,detailInfo:activity.getDetailInfo()});
};

/*
 *   购买优惠商店商品
 * */
pro.buyGoods = function (msg, session, next) {
    logger.debug('buyGoods playerId = %s, actId = %s, goodsId = %s', session.get('playerId'), msg.actId, msg.goodsId);
    var player = area.getPlayer(session.get('playerId')),
        manager = player.activityMgr;
    if (!manager) {
        return next(null, {code: Code.FAIL});
    }
    var activity = manager.getById(msg.actId);
    if (!activity) {
        return next(null, {code: Code.AREA.NO_SUCH_ACTIVITY});
    }
    if (activity.getType() !== Consts.ACTIVITY_TYPE.DISCOUNT_SHOP) {
        return next(null, {code: Code.AREA.ACTIVITY_TYPE_ERROR});
    }
    if (!activity.isOpen()) {
        return next(null, {code: Code.AREA.ACTIVITY_NOT_OPEN});
    }
    var goods = activity.getGoodsById(msg.goodsId);
    if (!goods) {
        return next(null, {code: Code.AREA.NO_SUCH_DISCOUNT_GOODS});
    }
    if (goods.buyCnt >= goods.max) {
        return next(null, {code: Code.AREA.REACH_DISCOUNT_SHOP_BUY_MAX});
    }
    // 判断购买限制
    if (activity.isLimited( msg.goodsId)) {
        return next(null, {code: Code.AREA.BARRIER_NOT_PASSED});
    }
    if (player.getMoneyByType(goods.priceType) < goods.price) {
        return next(null, {code: Code.AREA.LACK_MONEY});
    }
    if (player.isBagFull(goods.type, goods.typeId, goods.unit)) {
        return next(null, {code: Code.AREA.BAG_IS_FULL});
    }
    player.setMoneyByType(goods.priceType, player.getMoneyByType(goods.priceType) - goods.price,flow.MONEY_FLOW_COST.ACITIVTY_BUY,msg.goodsId);
    activity.addGoodBuyCount(msg.goodsId, 1);
    player.applyDrops([{dropType: goods.type, itemId: goods.typeId, count: goods.unit}],null,flow.ITEM_FLOW.ACTIVITY_BUY_GOODS);
    //activity.handover(msg.goodsId);
    var awards=[];
    ////表示购买的是宝箱
    //if( goods.type ==Consts.GOODS_TYPE.ITEM )
    //{
    //    var data = dataApi.Items.findById(  goods.typeId  );
    //    if( data.type == Consts.ITEM_TYPE.BOX)
    //    {
    //        var dropId =data.value;
    //        var drops = dropUtils.getDropItems(dropId);
    //        awards.push({awards: drops});
    //        // 给与奖励
    //        player.applyDrops(drops)
    //        return next(null, {code: Code.OK,awards:awards});
    //    }
    //}

    //var drops = player.applyDrops([{dropType: goods.type, itemId: goods.typeId, count: goods.unit}]);
    //awards.push({awards:drops});
    //return next(null, {code: Code.OK,awards:awards});
    return next(null, {code: Code.OK, moneyType: goods.priceType, count: player.getMoneyByType(goods.priceType)});
};

/*
 *   领取活动奖励
 * */
pro.drawAwards = function (msg, session, next) {
    logger.debug('drawAwards playerId = %s, actId = %s, condId = %s', session.get('playerId'), msg.actId, msg.condId);
    var player = area.getPlayer(session.get('playerId')),
        manager = player.activityMgr;
    if (!manager) {
        return next(null, {code: Code.FAIL});
    }
    var activity = manager.getById(msg.actId);
    if (!activity) {
        return next(null, {code: Code.AREA.NO_SUCH_ACTIVITY});
    }
    if (activity.getType() !== Consts.ACTIVITY_TYPE.CONDITION_AWARD) {
        return next(null, {code: Code.AREA.ACTIVITY_TYPE_ERROR});
    }
    if (!activity.isOpen()) {
        return next(null, {code: Code.AREA.ACTIVITY_NOT_OPEN});
    }
    if (!activity.isFinishByCondId(msg.condId)) {
        return next(null, {code: Code.AREA.ACTIVITY_NOT_FINISHED});
    }
    if (activity.isDrewByCondId(msg.condId)) {
        return next(null, {code: Code.AREA.ACTIVITY_AWARDS_DREW});
    }

    var drops = activity.getDropsByCondId(msg.condId);
    var result = activity.applyAwards(msg.condId, drops);
    if(result==null)
    {
        return next(null, {code:Code.FAIL, drops: {}});
    }
    else
    {
        return next(null, {code:Code.OK, drops: result,detailInfo:activity.getDetailInfo()});
    }
};


/*
 *   收集英雄活动领取奖励
 * */
pro.drawAwards4Collect = function (msg, session, next) {
    logger.debug('drawAwards playerId = %s, actId = %s, collectId = %s', session.get('playerId'), msg.actId, msg.collectId);
    var player = area.getPlayer(session.get('playerId')),
        manager = player.activityMgr;
    if (!manager) {
        return next(null, {code: Code.FAIL});
    }
    var activity = manager.getById(msg.actId);
    if (!activity) {
        return next(null, {code: Code.AREA.NO_SUCH_ACTIVITY});
    }
    if (activity.getType() !== Consts.ACTIVITY_TYPE.HERO_COLLECT) {
        return next(null, {code: Code.AREA.ACTIVITY_TYPE_ERROR});
    }
    if (!activity.isOpen()) {
        return next(null, {code: Code.AREA.ACTIVITY_NOT_OPEN});
    }
    if (!activity.isFinishByCollectId(msg.collectId)) {
        return next(null, {code: Code.AREA.ACTIVITY_NOT_FINISHED});
    }
    if (activity.isDrewByCollectId(msg.collectId)) {
        return next(null, {code: Code.AREA.ACTIVITY_AWARDS_DREW});
    }
    var result = activity.applyAwards(msg.collectId);

    if(result===null)
    {
        return next(null, {code:Code.FAIL, drops: {}});
    }
    else
    {
        return next(null, {code:Code.OK, drops: result,detailInfo:activity.getDetailInfo()});
    }
};

/*
*  吃鸡腿获取体力
* */
pro.getEnergy = function( msg, session, next )
{
    logger.debug('getEnergy playerId = %s, actId = %s, id = %s', session.get('playerId'), msg.actId, msg.id);
    var player = area.getPlayer(session.get('playerId')),
        manager = player.activityMgr;
    if (!manager) {
        return next(null, {code: Code.FAIL});
    }

    var activity = manager.getById(msg.actId);
    if (!activity) {
        logger.debug("ActivityStrengrh activityHandler.getEnergy not found actId %s", msg.actId );
        return next(null, {code: Code.AREA.NO_SUCH_ACTIVITY});
    }

    var data = dataApi.ActivetyStrength.findById( msg.id );
    if(!data)
    {
        logger.debug("ActivityStrengrh activityHandler.getEnergy not found id %s", msg.id );
        return next(null, {code: Code.AREA.NO_SUCH_ACTIVITY});
    }

    if (activity.getType() !== Consts.ACTIVITY_TYPE.GET_ENERGY) {
        return next(null, {code: Code.AREA.ACTIVITY_TYPE_ERROR});
    }

    if(activity.haveGot(msg.id)){
        return next(null, {code: Code.AREA.ACTIVITY_AWARDS_DREW});
    }

    //已经领取过了
    //if( activity.getBuyTimeById( msg.id) > 0 )
    //{
    //    return next(null, {code: Code.AREA.ACTIVITY_AWARDS_DREW});
    //}

    //时间未到
    if( !activity.isTimeOk( msg.id) )
    {
        return next(null, {code: Code.AREA.ACTIVITY_NOT_FINISHED});
    }

    //var diamond = activity.awardDiamond( msg.id );
    //if(diamond>0)
    //{
    //    //下发钻石
    //    player.setMoneyByType(Consts.MONEY_TYPE.DIAMOND, player.getMoneyByType(Consts.MONEY_TYPE.DIAMOND) +diamond);
    //}
    //
    //player.setMoneyByType(Consts.MONEY_TYPE.ENERGY, player.getMoneyByType(Consts.MONEY_TYPE.ENERGY) + data.strength );

    activity.addBuyRecord( msg.id , Date.now() );
    var rewardId = data.rewardId;

    var drops = dropUtils.getDropItems(rewardId);
    // 给与奖励
    var award = player.applyDrops(drops,null,flow.ITEM_FLOW.ACTIVITY);
    return next(null, {code: Code.OK ,award:award } );
};

pro.getFristReacharge = function (msg, session, next ) {
    logger.debug('getEnergy playerId = %s, actId = %s', session.get('playerId'), msg.actId );
    var player = area.getPlayer(session.get('playerId')),
        manager = player.activityMgr;
    if (!manager) {
        return next(null, {code: Code.FAIL});
    }
    var activity = manager.getById(msg.actId);

    if( player.fristRecharge == 0 )
    {
        return next(null, {code: Code.FAIL});
    }
    if( player.fristRechargeAwardTime > 0 ){
        return next(null, {code: Code.FAIL});
    }
    var currtime = Date.now();
    player.setFristRechargeAwardTime( currtime );
    activity.refreshAward(  currtime );
    var data = dataApi.ActivetyRecharge.findById( msg.id );
    var drops1 = dropUtils.getDropItems( data.dropId01 );
    var drops2 = dropUtils.getDropItems( data.dropId02 );
    // 给与奖励
    var award1 = player.applyDrops(drops1,null,flow.ITEM_FLOW.FIRST_RECHARGE_GAIN);
    var award2 = player.applyDrops(drops2,null,flow.ITEM_FLOW.FIRST_RECHARGE_GAIN);
    return next(null, {code: Code.OK ,award1:award1 , award2:award2 } );
};

/*
 *   序列号兑换奖励(特殊活动)
 * */
pro.snExchange = function (msg, session, next) {
    logger.debug('snExchange playerId = %s, interface = %s, sn = %s', session.get('playerId'), msg.interface, msg.sn);
    var ifName = msg.interface || 'default',
        player = area.getPlayer(session.get('playerId')),
        activityMgr = player.activityMgr,
        app = this.app,
        activity, sn;
    if (!_.isString(msg.sn)) {
        logger.debug('snExchange param sn %s must be a string!', msg.sn);
        return next(null, {code: Code.FAIL});
    }
    sn = libUtils.trim(msg.sn);
    // // 判定是否有兑换码活动
    // if (!activityMgr) {
    //     logger.debug('snExchange no activityMgr');
    //     return next(null, {code: Code.FAIL});
    // }
    // activity = activityMgr.getActivationCodeExchange();
    // if (!activity) {
    //     return next(null, {code: Code.AREA.NO_SUCH_ACTIVITY});
    // }
    // // 判定活动是否开放
    // if (!activity.isOpen(this.app.get('operationFlags'), utils.getServerDay(this.app))) {
    //     return next(null, {code: Code.AREA.ACTIVITY_NOT_OPEN});
    // }
    app.rpc.world.snRemote.canUse(session, ifName, sn, player.id, function (err, errCode, awardId) {
        if (err) {
            logger.error('snExchange rpc err %s, playerId = %s, sn = %s', err.stack, player.id, sn);
            return next(null, {code: Code.FAIL});
        }
        if (errCode !== Code.OK) {
            return next(null, {code: errCode});
        }
        var snAwardData = dataApi.SnAwards.findById(awardId);
        if (!snAwardData) {
            logger.error('snExchange no such awardId %s', awardId);
            return next(null, {code: Code.FAIL});
        }
        // // 记录领取日志
        // // 注意不是dbclient
        // playerActionLogDao.logSnExchange(app.get('logClient'), player, sn, snAwardData);
        // // 给与奖励并下发
        // var dropMgr = dropManager.create();
        // dropMgr.addNormalDrop(snAwardData.dropId);
        // dropMgr.apply(player);
        //
        // // 记录签到获得钻石
        // var dropDiamond = dropManager.getDropDiamondTotal(dropMgr.getFinalDrops());
        // if(dropDiamond > 0){
        //     diamondFlowDao.log(pomelo.app.get('logClient'), player.id, player.level, diamondFlowDao.LOG_TYPE.OTHER_GOT, dropDiamond);
        // }
        var dropsItems = dropUtils.getDropItems( snAwardData.dropId );
        // 给与奖励
        var drops = player.applyDrops(dropsItems,null,flow.ITEM_FLOW.SNEXCHANGE);
        return next(null, {code: Code.OK, drops: drops});
    });
};


/*
* 获取邀请码奖励
* */
pro.drawInvitAwards = function (msg, session, next) {
    logger.debug('drawAwards playerId = %s, id = %s, condParam = %s', session.get('playerId'), msg.id, msg.condParam);
    var player = area.getPlayer(session.get('playerId')),
        activityMgr = player.activityMgr,
        activity, condDetail;

    if (!activityMgr) {
        return next(null, {code: Code.FAIL});
    }
    activity = activityMgr.getById(msg.id);
    if (!activity) {
        return next(null, {code: Code.AREA.NO_SUCH_ACTIVITY});
    }
    // 活动是否开启
    if (!activity.isOpen()) {
        return next(null, {code: Code.AREA.ACTIVITY_NOT_OPEN});
    }
    condDetail = activity.getCondDetailById(msg.condParam);
    if (!condDetail) {
        return next(null, {code: Code.AREA.NO_SUCH_ACTIVITY_AWARD});
    }
    // 是否已领取
    if (condDetail.everDrew()) {
        return next(null, {code: Code.AREA.ACTIVITY_AWARDS_DREW});
    }

    var self = this;
    // 是否为邀请码确认
    if (activity.getType() == Consts.ACTIVITY_TYPE.PLZ_CODE) {
        var inviteData = dataApi.InvitCfg.findBy('id', condDetail.id)[0];
        if (inviteData.rewardType == 1 && msg.inviteCode != null) {
            if (inviteData.conditionType == 0) {
                //接受邀请关卡上限
                var inviteLv =dataUtils.getOptionValue('maxInvitCustom',-1);
                if (inviteLv != -1 && player.passedBarrierMgr.isPassed(inviteLv) ){
                    return next(null, {code: Code.AREA.ACTIVITY_INVITE_LEVEL_HEIGHT});
                }
                //邀请人数上限
                var inviteMax = dataUtils.getOptionValue('maxInvitNum',0);
                inviteDao.updatePlayerByInviteCode(self.app.get('dbclient'), msg.inviteCode, inviteMax, player.id, function (err, res) {
                    if (res.id == 0)
                        return next(null, {code: Code.AREA.ACTIVITY_INVITE_CODE_ERROR});

                    if (inviteMax != -1 && res.inviteCount >= inviteMax)
                        return next(null, {code: Code.AREA.ACTIVITY_INVITE_PLAYER_FULL});

                    player.set('inviteId', res.id);

                    var newBarrierId = player.passedBarrierMgr.getNewBarrierId(Consts.CHAPTER_TYPE.NORMAL)
                    self.app.rpc.area.inviteRemote.OnPlayerInviteAdd.toServer('*', res.id, res.inviteCount + 1, newBarrierId, player.buyGetDiamond, null);

                    // 给与奖励
                    condDetail.setDrew();

                    // 邀请者ID， 被邀请者ID， 被邀请者变化后的等级，被邀请者现有钻石数， 被邀请者上次的钻石数
                    inviteManager.initInviteData(player);

                    return next(null, {
                        code: Code.OK,
                        id: msg.id,
                        condParam: msg.condParam,
                        drops: player.applyDrops( condDetail.getAward() ,null,flow.ITEM_FLOW.INVIT_GAIN)
                    })
                });
                return;
            }
        }
    }

    // 是否达成
    if (!condDetail.finished()) {
        return next(null, {code: Code.AREA.ACTIVITY_NOT_FINISHED});
    }

    // 给与奖励
    condDetail.setDrew();
    return next(null, {code: Code.OK, id: msg.id, condParam: msg.condParam, drops:  player.applyDrops( condDetail.getAward(),null,flow.ITEM_FLOW.INVIT_GAIN) });
};


/*
 * 获取邀请码奖励
 * */
pro.drawUnion = function (msg, session, next) {
    logger.debug('drawAwards playerId = %s, cardType = %s', session.get('playerId'), msg.cardType);
    var player = area.getPlayer(session.get('playerId')),
        manager = player.activityMgr;
    if (!manager) {
        return next(null, {code: Code.FAIL});
    }
    var activity = manager.getById(msg.actId);
    if (!activity) {
        return next(null, {code: Code.AREA.NO_SUCH_ACTIVITY});
    }

    var cardEndTick = player.weekCardEndTick,
        cardWelfareTick = player.weekCardWelfareTick,
        welfareString = "weekCardWelfareTick";
    if(Consts.ORDER_PRODUCT_TYPE.MONTH_CARD == msg.cardType){
        cardEndTick = player.monthCardEndTick;
        cardWelfareTick = player.monthCardWelfareTick;
        welfareString = "monthCardWelfareTick";
    }
    else if(Consts.ORDER_PRODUCT_TYPE.FOREVER_CARD == msg.cardType){
        cardEndTick = player.foreverCardEndTick;
        cardWelfareTick = player.foreverCardWelfareTick;
        welfareString = "foreverCardWelfareTick";
    }
    var now = new Date();

    //判断特权是否已经过期，永久卡不会过期
    if(Consts.ORDER_PRODUCT_TYPE.FOREVER_CARD != msg.cardType){
        if(now.getTime() > cardEndTick){
            return next(null, {code: Code.AREA.UNION_TIMEOUT});
        }
    }

    //判断今天是否已经领取过
    var welfareDate = new Date(cardWelfareTick);
    if(now.getDate() == welfareDate.getDate() && now.getMonth() == welfareDate.getMonth() && now.getFullYear() == welfareDate.getFullYear()){
        return next(null, {code: Code.AREA.UNION_HAVEGOT});
    }

    player.set(welfareString, now.getTime());
    //获取奖励
    var productData = dataApi.Recharge.getUnionCardByType(msg.cardType);
    if(productData == null){
        logger.error("can not find getUnionCardByType");
        return next(null, {code: Code.FAIL});
    }
    var drops = dropUtils.getDropItems(productData.gift);

    //activity.pushNew();

    return next(null, {code: Code.OK, drops:  player.applyDrops( drops,null,flow.ITEM_FLOW.INVIT_GAIN) });
}