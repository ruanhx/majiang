/**
 * Created by 卢家泉 on 2017/5/16 活动副本
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    dataApi = require('../../../util/dataApi'),
    dropUtils = require('../../../domain/area/dropUtils'),
    inviteManager = require('../../../domain/area/inviteManager'),
    utils = require('../../../util/utils'),
    Consts = require('../../../consts/consts'),
    flow = require('../../../consts/flow'),
    barrierManager = require('../../../domain/area/barrierManager');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

//获取活动副本基础信息
pro.getActivityBase = function(msg, session, next){
    //logger.debug("收到getActivityBase请求--");
    var player =  area.getPlayer(session.get('playerId'));
    var actGold = dataApi.ActivityCustom.canJoin(Consts.ACTIVITY_ECTYPE_TYPE.GOLD)?1:0;
    var actExp = dataApi.ActivityCustom.canJoin(Consts.ACTIVITY_ECTYPE_TYPE.EXP)?1:0;
    var actItem = dataApi.ActivityCustom.canJoin(Consts.ACTIVITY_ECTYPE_TYPE.ITEM)?1:0;
    return next(null, {code: Code.OK,actGold:actGold,actExp:actExp,actItem:actItem,nextGetTime:utils.getNextDayXHour(5)});
}

//获取活动副本详细信息
// pro.getActivityDetail = function(msg, session, next){
//     logger.debug("收到getActivityDetail请求--activityIds:",msg.activityIdList);
//     var player =  area.getPlayer(session.get('playerId'));
//
//     //获取挑战冷却时间
//     //获取挑战歷史星數
//     var passedActivityEctype={} ;
//     var detailList = [];
//     msg.activityIdList.forEach(function (activityId) {
//         logger.debug("forEach msg.activityIdList activityId=%d:",activityId);
//         passedActivityEctype = player.passedActivityEctypeManager.getPassedActivityEctype(activityId);
//         //根据活动id查找相应的活动副本信息
//         var activityCustom = dataApi.ActivityCustom.findById(activityId);
//         if(activityCustom){
//             // 检查前置关卡是否通过
//             var openCustomId = activityCustom.openCustomId;
//             var canEnter = 1;
//             if (openCustomId && !player.passedBarrierMgr.isPassed(openCustomId)) {
//                 canEnter = 0;
//             }
//             detailList.push(player.passedActivityEctypeManager.getClientInfo(activityId));
//         }
//     });
//
//
//     return next(null, {code: Code.OK,
//         detailList:detailList
//     });
// }

//进入活动副本
pro.activityEnter = function(msg, session, next){
    logger.debug("收到activityEnter请求--activityId:",msg.activityId);
    var player =  area.getPlayer(session.get('playerId'));
    
    //根据活动id查找相应的活动副本信息
    var activityCustom = dataApi.ActivityCustom.findById(msg.activityId);
    if(!activityCustom){
        next(null, {code: Code.AREA.INVALID_ACTIVITY_CUSTOM});
        return;
    }
    if(!dataApi.ActivityCustom.canJoin(activityCustom.activityType)){
        next(null, {code: Code.AREA.FAIL});
        return;
    }
    // 检查前置关卡是否通过
    var openCustomId = activityCustom.openCustomId;
    if (openCustomId && !player.passedBarrierMgr.isPassed(openCustomId)) {
        logger.debug('openCustomId is not passed = %s', openCustomId);
        next(null, {code: Code.AREA.LAST_BARRIER_NOT_PASSED});
        return;
    }
    //判断挑战次数够不够
    if(activityCustom.challengeAmount<=player.getDailyActivityCnt(activityCustom.activityType)){
        next(null, {code: Code.AREA.ACTIVITY_CUSTOM_CNT_NOT_ENOUGH});
        return;
    }
    //判断是否冷却中
    if(player.passedActivityEctypeManager.isCooling(msg.activityId)){
        next(null, {code: Code.AREA.ACTIVITY_CUSTOM_COOLING});
        return;
    }

    var barrierData = dataApi.Custom.findById(activityCustom.customId);
    // 检查体力是否足够
    if (barrierData.energy && player.energy < barrierData.energy) {
        next(null, {code: Code.AREA.LACK_ENERGY});
        return;
    }
    // 检查背包是否有足够空格
    if (!player.bag.isHasPosition()) {
        next(null, {code: Code.AREA.BAG_IS_FULL});
        return;
    }
    //
    var barrier = barrierManager.createBarrier(player, activityCustom.customId, barrierData);
    player.passedActivityEctypeManager.enter();
    return next(null, {code: Code.OK,barrier:barrier.getInfo()});
}

//扫荡活动副本
pro.activitySweep = function(msg, session, next){
    //logger.debug("收到activitySweep请求--activityId:",msg.activityId);
    var player =  area.getPlayer(session.get('playerId'));
    //根据活动id查找相应的活动副本信息
    var activityCustom = dataApi.ActivityCustom.findById(msg.activityId);
    if(!activityCustom){
        next(null, {code: Code.AREA.INVALID_ACTIVITY_CUSTOM});
        return;
    }
    //logger.debug("activitySweep请求通过activityCustom检测");
    if(!dataApi.ActivityCustom.canJoin(activityCustom.activityType)){
        next(null, {code: Code.AREA.FAIL});
        return;
    }
    //logger.debug("activitySweep请求通过canJoin检测");
    //判断挑战次数够不够
    if(activityCustom.challengeAmount<=player.getDailyActivityCnt(activityCustom.activityType)){
        next(null, {code: Code.AREA.ACTIVITY_CUSTOM_CNT_NOT_ENOUGH});
        return;
    }
    //logger.debug("activitySweep请求通过challengeAmount检测");
    //判断副本是否满足扫荡条件
    if(!player.passedActivityEctypeManager.canSweep(msg.activityId)){
        next(null, {code: Code.AREA.FAIL});
        return;
    }
    //logger.debug("activitySweep请求通过canSweep检测");
    // 检查背包是否有足够空格
    if (!player.bag.isHasPosition()) {
        next(null, {code: Code.AREA.BAG_IS_FULL});
        return;
    }
    //logger.debug("activitySweep请求通过bag.isHasPosition检测");
    //判断扫荡券是否足够
    if(player.sweepTickets===0){
        next(null, {code: Code.AREA.SWEEP_TICKET_NOT_ENOUGH});
        return;
    }
    player.emit("onActActEctypePass",activityCustom.activityDifficulty);
    //logger.debug("activitySweep请求通过sweepTickets检测");
    //累加挑战次数
    player.addDailyActivityCnt(activityCustom.activityType);
    //扣除扫荡券
    player.set('wipeTicket',player.wipeTicket - 1 || 0);
    //获取3星奖励
    var dropsItems = dropUtils.getDropItems( activityCustom.thirdLevelDrop );
    // 给与奖励
    var drops = player.applyDrops(dropsItems,null,flow.ITEM_FLOW.ACTIVITYECTYPE);
    //logger.debug("activitySweep请求通过所有检测");
    return next(null, {code: Code.OK, drops: drops,info:player.passedActivityEctypeManager.getClientInfo(msg.activityId)});
}

//退出活动副本
pro.activityOut = function(msg, session, next){
    //logger.debug("收到activityOut请求--activityId:",msg.activityId);
    var player =  area.getPlayer(session.get('playerId'));
    if(!player.passedActivityEctypeManager.inActivityEctype()){
        logger.debug("@@@@@@活动副本 状态不对");
        return next(null, {code: Code.FAIL});
    }
    if(msg.status === 1){
        //根据活动id查找相应的活动副本信息
        var activityCustom = dataApi.ActivityCustom.findById(msg.activityId);
        if(!activityCustom){
            return next(null, {code: Code.AREA.INVALID_ACTIVITY_CUSTOM});
        }
        var barrierData = dataApi.Custom.findById(activityCustom.customId);
        // var custom_passPower = dataUtils.getOptionValue("custom_passPower",0.5);
        // 通关战斗力校验
        // if(barrierData.powRec*custom_passPower>player.getPower()){
        //     // logger.error("通关战斗力校验失败 playerid:%s power:%s limitPower:%s",playerId,player.getPower(),barrierData.powRec*custom_passPower);
        //     return  next(null, {code: Code.AREA.ACTIVITY_ECTYPE_DATA_INVALID});
        // }

        //获取星奖励
        var dropsItems;
        if(1==msg.star){
            dropsItems = dropUtils.getDropItems( activityCustom.firstLevelDrop );
        }else if(2==msg.star){
            dropsItems = dropUtils.getDropItems( activityCustom.secondLevelDrop );
        }else if(3==msg.star){
            dropsItems = dropUtils.getDropItems( activityCustom.thirdLevelDrop );
        }else{
            logger.debug("@@@@@@活动副本 星星数未达到标准");
            return next(null, {code: Code.OK,info:player.passedActivityEctypeManager.getClientInfo(msg.activityId)});
        }
        player.emit("onActActEctypePass",activityCustom.activityDifficulty);
        //累加挑战次数
        player.addDailyActivityCnt(activityCustom.activityType);

        //扣除体力

        player.set('energy',player.energy - barrierData.energy || 0);
        // 给与奖励
        var drops = player.applyDrops(dropsItems,null,flow.ITEM_FLOW.ACTIVITYECTYPE);
        //设置关卡星值
        player.passedActivityEctypeManager.out(msg.activityId,msg.star,activityCustom.coldTime);
        logger.debug("@@@@@@活动副本 完成");
        return next(null, {code: Code.OK, drops: drops,info:player.passedActivityEctypeManager.getClientInfo(msg.activityId)});
    }else{
        logger.debug("@@@@@@活动副本 角色死亡");
    }
    return next(null, {code: Code.OK,info:player.passedActivityEctypeManager.getClientInfo(msg.activityId)});
}