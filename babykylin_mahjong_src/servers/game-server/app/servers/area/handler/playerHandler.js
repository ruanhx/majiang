/**
 * Created by lishaoshen on 2015/10/05.
 */

var pomelo = require('pomelo'),
    async = require('async'),
    logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var area = require('../../../domain/area/area'),
    barrierManager = require('../../../domain/area/barrierManager'),
    Code = require('../../../../shared/code'),
    playerDao = require('../../../dao/playerDao'),
    dataApi = require('../../../util/dataApi'),
    dataUtils = require('../../../util/dataUtils'),
    utils = require('../../../util/utils'),
    dropUtils = require('../../../domain/area/dropUtils'),
    consts = require('../../../consts/consts'),
    flow = require('../../../consts/flow'),
    publisher = require('../../../domain/activity/publisher'),
    Utils =  require('../../../util/utils'),
    randBossRecordDao = require('../../../dao/randBossRecordDao'),
    common = require('../../../util/common'),
    randBossDao = require('../../../dao/randBossDao'),
    friendsDao = require('../../../dao/friendsDao');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

/*
 *   结算离线应发放体力
 * */
function processOfflineEnergy(player) {
    var trigger = pomelo.app.get('cronManager').getTriggerById(consts.AREA_CRON.DISPATCH_ENERGY_CRON_ID),
        nextExecuteTime,
        now = Date.now(),
        resultEnergy, dispatchCnt = 0;
    if (!trigger) {
        return;
    }
    nextExecuteTime = trigger.nextExcuteTime(player.dispatchEnergyTime);
    logger.debug('processOfflineEnergy dispatchEnergyTime = %s', new Date(player.dispatchEnergyTime).toTimeString());
    while (nextExecuteTime < now) {
        ++dispatchCnt;
        if (player.isEnergyFull()) {
            logger.debug('processOfflineEnergy player %s energy full!', player.id);
            break;
        }
        // 发放一次
        resultEnergy = Math.min(player.maxEnergy, player.energy + dispatchCnt * dataUtils.getOptionValue('Sys_StrengthRenewNum', 1));
        if (resultEnergy >= player.maxEnergy) {
            break;
        }
        nextExecuteTime = trigger.nextExcuteTime(nextExecuteTime);
    }
    if (dispatchCnt > 0) {
        player.set('dispatchEnergyTime', now);
        if (!!resultEnergy) {
            player.dispatchEnergy(resultEnergy - player.energy);
            logger.debug('processOfflineEnergy energy %s', resultEnergy);
        }
    }
}

pro.enterScene = function (msg, session, next) {
    var playerId = session.get('playerId'), player,self = this;
    logger.debug('enterScene playerId = %s', playerId);
    if (!playerId) {
        console.log('enterScene request entry or create player first!');
        return next(null, {code: Code.FAIL});
    }

    var language = msg.language || dataUtils.getLanguage();
    var isReconnect = msg.isReconnect;
    logger.error("#### %j",this.app.rpc);
    this.app.rpc.world.playerRemote.add(session,
        {
        id: session.get('playerId'),
        areaName: this.app.getServerId(),
        frontendId: session.frontendId,
        sessionId: session.id,
        username: session.get('MAC')
        },
        //--------------------
        function (err, errCode) {
        if (err) {
            return next(null, {code: Code.FAIL});
        }
        if (errCode !== Code.OK) {
            logger.error('enterScene world.playerRemote.add errCode %s', errCode);
            return next(null, {code: Code.FAIL});
        }

        // playerDao.onUserLogon(playerId, function (err, success) {
            playerDao.getPlayerAllInfo(playerId, function (err, allInfo) {
                if (!!err || !allInfo) {
                    console.log('get player info failed');
                    next(null, {code: Code.DB_ERROR});
                    return;
                }
                // 注意:检查是否已有实例，须放在异步读取数据库后，否则会拦不住
                // 如果已在线，也应该在当前这个area上，这里将进行替换
                if ((player = area.getPlayer(playerId)))
                {
                    logger.info('enterScene player already online!playerId = %s', playerId);
                    if (player.leaveTimer)
                    {
                        player.clearLeaveTimer();
                        player.sessionId = session.id;
                        player.setFrontendId(session.frontendId);
                        player.setSession(session);
                        // player.setLanguage( language );
                        next(null, {code: Code.OK, curPlayer: player.getClientInfo()});
                    }
                    //需要T人
                    else
                    {
                        var oldSessionId = player.sessionId;
                        // 替换前端信息
                        player.sessionId = session.id;
                        // player.setLanguage( language );
                        player.setFrontendId(session.frontendId);
                        next(null, {code: Code.OK, curPlayer: player.getClientInfo()});
                        // 踢掉旧连接
                        self.app.get('localSessionService').kickBySid(session.frontendId, oldSessionId);
                    }
                    return;
                }

                allInfo.language = language;
                createPlayer(session, allInfo,isReconnect, next);

            });

        //     if (!!err) {
        //         console.log('setOnline error!');
        //         return;
        //     }
        //     if (!success) {
        //         console.log('enterScene setOnline failed!');
        //     }
        // });
    });
};

function createPlayer(session, allData,isReconnect, next) {
    var dbPlayer = allData.player,
        player;
    dbPlayer.frontendId = session.frontendId;
    dbPlayer.sessionId = session.id;
    player = area.addPlayer(dbPlayer);


    // if(isReconnect && isReconnect == 1){//是断线重连的
    //     //if(true){
    //     //恢复战斗
    //     if(allData.offlineFightRecord != null && allData.offlineFightRecord.length > 0){
    //         var record = allData.offlineFightRecord[0];
    //         var recordDetail = JSON.parse(record.detail);
    //         if(record.type == consts.OFFLINE_FIGHT_TYPE.BARRIER) {//关卡战斗
    //             var barrierData = dataApi.Custom.findById(recordDetail.barrierId);
    //             var barrier = barrierManager.createBarrier(player, recordDetail.barrierId, barrierData, recordDetail.barrierDropList, recordDetail.activityDropDouble);
    //             barrier.buyTimeCount = recordDetail.buyTimeCount;
    //             barrier.reviveCnt = recordDetail.reviveCnt;
    //         }
    //         else if(record.type == consts.OFFLINE_FIGHT_TYPE.RANDBOSS){//随机boss
    //             var randBoss = player.passedBarrierMgr.randBoss;
    //             if(randBoss){
    //                 randBoss.enterAtkRandBossTime = recordDetail.enterAtkRandBossTime;
    //                 randBoss.setWin(recordDetail.winCnt);
    //             }
    //         }else if(record.type == consts.OFFLINE_FIGHT_TYPE.ENDLESS){
    //             player.singleEndlessOccasionId =  recordDetail.singleEndlessOccasionId;
    //             player.effectBuffIds = recordDetail.effectBuffIds;
    //             player.singleEndlessFighting = recordDetail.singleEndlessFighting;
    //             player.singleEndlessReviveCnt = recordDetail.singleEndlessReviveCnt;
    //             player.singleEndlessCommitted = recordDetail.singleEndlessCommitted;
    //             player.singleReopenBoxCnt = recordDetail.singleReopenBoxCnt;
    //             player.occasionManager.add(player.singleEndlessOccasionId);
    //         }
    //     }
    //
    //     next(null, {code: Code.OK,curPlayer: player.getClientInfo()});
    // }else{
        //logger.debug("******登录时返回角色信息：%j",player.getClientInfo().heroBag);
        next(null, {code: Code.OK, curPlayer: player.getClientInfo()});
    // }
};


pro.getUserStatus = function (msg, session, next) {
    var player = area.getPlayer(session.get('playerId'));
    // player.pushMsg('player.updateGem',{code: Code.OK,gems:20});

    next(null, {code: Code.OK,gems:player.gem});
};