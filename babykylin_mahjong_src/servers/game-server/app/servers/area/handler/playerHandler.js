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
    guidePrizeManager = require('../../../domain/area/guidePrizeManager'),
    playerShop = require('../../../domain/entity/playerShop'),
    randomShop = require('../../../domain/entity/randomShop'),
    playerRecharge = require('../../../domain/entity/playerRecharge'),
    activityManager = require('../../../domain/activity/activityManager'),
    publisher = require('../../../domain/activity/publisher'),
    Utils =  require('../../../util/utils'),
    inviteManager = require('../../../domain/area/inviteManager'),
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

/*
 *   上线时检查是否需要重置购买体力次数
 * */
function processBuyEnergyCntReset(player) {
    var trigger = pomelo.app.get('cronManager').getTriggerById(consts.AREA_CRON.RESET_BUY_ENERGY_CNT_CRON_ID);
    if (!trigger) {
        return;
    }
    var now = Date.now(),
        lastResetTime = player.resetBuyEnergyCntTime || player.createTime,
        nextResetTime = trigger.nextExcuteTime(lastResetTime);
    if (now >= nextResetTime) {
        player.resetBuyEnergyCount(now);
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
    // this.app.rpc.world.playerRemote.add(session,
    //     {
    //     id: session.get('playerId'),
    //     areaName: this.app.getServerId(),
    //     frontendId: session.frontendId,
    //     sessionId: session.id,
    //     username: session.get('MAC')
    //     },
    //     //--------------------
    //     function (err, errCode) {
    //     if (err) {
    //         return next(null, {code: Code.FAIL});
    //     }
    //     if (errCode !== Code.OK) {
    //         logger.error('enterScene world.playerRemote.add errCode %s', errCode);
    //         return next(null, {code: Code.FAIL});
    //     }

        playerDao.onUserLogon(playerId, function (err, success) {
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

            if (!!err) {
                console.log('setOnline error!');
                return;
            }
            if (!success) {
                console.log('enterScene setOnline failed!');
            }
        });
    // });
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
}
// 上线重置
function processOfflineReset(player) {
    player.refineResetMgr.processOfflineReset();
    player.buffManager.processOfflineReset();
    player.occasionManager.processOfflineReset();
    player.weekHighScoreMgr.processOfflineReset();
    player.missionMgr.processOfflineReset();
    player.dailyEndlessBoxToHeroCntManager.processOfflineReset();
    player.passedActivityEctypeManager.cleanDailyActivityEctypeOffline();
    player.catchTreasureManager.rankScoreResetOffLine();
    player.divisionPersonMgr.dailyCleanOffline();
    player.friendPersonMgr.cleanDailyOffline();
    player.trainMgr.dailyCleanOffline();
    player.refreshMgr.processOfflineReset();
    player.assistFightMgr.processOfflineReset();
    player.lastWeekHighScoreOfflineReset();

};

/**
 * 获取初始化英雄id列表
 * */
function getInitHeroList() {
    var roleIds = dataUtils.getOptionList(consts.CONFIG.INIT_HERO);
    return roleIds;
};
/*
 *   角色第一次登录时，初始化猎魔人
 * */
function initHero(player) {

    var roleIds = dataUtils.getOptionList(consts.CONFIG.INIT_HERO);
    //var heroes = [];
    //player.loadHeroBag(heroes);

    //不能添加重复的类型英雄
    var tempListType = [],haveErroHeroId = false;
    // 玩家选择的初始英雄
    roleIds.push(player.initHeroId);
    _.each(roleIds,function (id){
        var heroData = dataApi.HeroAttribute.findById(id);
        if(!!heroData){
            tempListType.push(heroData.roleType);
        }else{
            haveErroHeroId = true;
        }
    });

    //true表示roleType类型没有重复
    var isUniq = _.size( _.uniq( tempListType ) != _.size(roleIds )) ;
    if( haveErroHeroId || isUniq ){
        logger.error( 'CommonParameter.xlsx : init_Hero is error ' );
    }

    _.each(roleIds,function (id) {
        var heroData = dataApi.HeroAttribute.findById(id);

        if (!heroData) {
            return;
        }
        var index = player.addHero( heroData,1);
        //logger.error( 'index=%s ' + index);
        if (!index) {
            logger.error( 'initHero error index');
            return;
        }

        var roleType = heroData.roleType;
        if( consts.HERO_TYPE.HERO == roleType ){
            player.setCurFightHero(index);
        }
        else{
            player.setBrotherHeroPos( {type:roleType,pos:index} );
        }
    });

    // var roleIds = dataUtils.getOptionList(consts.CONFIG.INIT_HERO);
    // var roleId = getInitConfigId(roleIds);
    // var heroes = [];
    // player.loadHeroBag(heroes);
    //
    // if (!!roleId) {
    //     var heroData = dataApi.HeroAttribute.findById(roleId);
    //     if (!heroData) {
    //         return;
    //     }
    //     var index = player.addHero(heroData,1);
    //     if (!index) {
    //         return;
    //     }
    //     player.setCurFightHero(index);
    // }
}

/*
 *   初次登录时，初始化宠物
 * */
function initPet(player) {
    var peyIds = dataUtils.getOptionList(consts.CONFIG.INIT_PET);
    var petId = getInitConfigId(peyIds);
    var pets = [];
    player.loadPetBag(pets);

    if (!!petId) {
        var petData = dataApi.PetAttribute.findById(petId);
        if (!petData) {
            return;
        }
        var index = player.addPet(petData);
        if (!index) {
            return;
        }
        player.setCurFightPet(index);
    }
}

/*
 *   根据初始猎魔人或初始宠物配置，生成猎魔人或宠物id
 * */
function getInitConfigId(configIds) {
    var configId;

    if (!!configIds && configIds.length > 0) {
        if (configIds[0] === 0) {
            configId = configIds[1];
        }
        else {
            var random = Math.random() * (configIds.length - 1);
            var index = Math.ceil(random);
            configId = configIds[index];
        }
    }
    return configId;
}

/*
 *   重置关卡攻打次数
 * */
pro.resetBarrierAtkCnt = function (msg, session, next) {
    var player = area.getPlayer(session.get('playerId')),
        barrier = player.passedBarrierMgr.getPassedBarrier(msg.barrierId),
        barrierData = dataApi.Custom.findById(msg.barrierId);
    if (!barrierData) {
        return next(null, {code: Code.AREA.INVALID_BARRIER});
    }
    if (!barrier) {
        return next(null, {code: Code.AREA.BARRIER_NOT_PASSED});
    }
    if (barrierData.customType === consts.BARRIER_TYPE.BOSS) {
        if (barrier.resetTimes >= dataUtils.getOptionValue(consts.CONFIG.RESET_BARRIER_MAX, 0)) {
            return next(null, {code: Code.AREA.REACH_BARRIER_RESET_MAX});
        }
    }
    var cost = dataUtils.getOptionListValueByIndex(consts.CONFIG.RESET_BARRIER_PRICE, barrier.resetTimes);
    if (player.diamondCnt < cost) {
        return next(null, {code: Code.DIAMOND_NUM_NOT_ENOUGH});
    }

    player.setMoneyByType(consts.MONEY_TYPE.DIAMOND,player.diamondCnt - cost,flow.MONEY_FLOW_COST.RESET_BARROER_CNT);
    //player.setDiamond(player.diamondCnt - cost);
    player.resetBarrier(msg.barrierId);
    next(null, {
        code: Code.OK, barrierId: msg.barrierId, dailyTimes: barrier.dailyTimes,
        resetTimes: barrier.resetTimes, cost: cost
    });
};

pro.createBarrier = function (msg, session, next) {
    var self = this;
    var playerId = session.get('playerId');
    var barrierId = msg.barrierId;
    var player = area.getPlayer(playerId);
    var barrierData = dataApi.Custom.findById(barrierId);

    var newBarrierId = player.passedBarrierMgr.getNewBarrierId(consts.CHAPTER_TYPE.NORMAL);
    logger.debug('createBarrier playerId = %s, barrierId = %s', playerId, barrierId);
    if (!barrierData) {
        next(null, {code: Code.AREA.INVALID_BARRIER});
        return;
    }

    var chapterId = barrierData.chapterId;

    var isOpenChapter = player.unlockChapterMgr.isUnlocked(chapterId);
    // 章节未解锁
    if ( !isOpenChapter ) {
        return next(null, {code: Code.AREA.CHAPTER_UNLOCKED});
    }

    var passRec = player.passedBarrierMgr.getPassedBarrier(barrierId);
    if (passRec && passRec.dailyTimes >= barrierData.dailyTimes) {
        return next(null, {code: Code.AREA.REACH_ATK_MAX});
    }
    // 检查前置关卡是否通过
    var lastBarrierId = dataUtils.getPreBarrier(barrierId);
    if (lastBarrierId && !player.passedBarrierMgr.isPassed(lastBarrierId)) {
        logger.debug('LastBarrier is not passed = %s', lastBarrierId);
        next(null, {code: Code.AREA.LAST_BARRIER_NOT_PASSED});
        return;
    }
    // 检查体力是否足够
    if (barrierData.energy && player.energy < barrierData.energy) {
        next(null, {code: Code.AREA.LACK_ENERGY});
        return;
    }
    // 检查玩家是否足够邀请助战
    if (msg.assistFightPlayerId){
        var moneyType = dataApi.CommonParameter.getOptionValue('assistFightPriceType', 1);
        var haveMoney = player.getMoneyByType(moneyType);
        var assistRecord = player.assistFightMgr.getAssistRecord(msg.assistFightPlayerId);
        var cost = assistRecord.getPrice();
        if (cost>haveMoney){
            next(null, {code: Code.DIAMOND_NUM_NOT_ENOUGH});
            return;
        }
    }


    // 检查背包是否有足够空格
    if (!player.bag.isHasPosition()) {
        next(null, {code: Code.AREA.BAG_IS_FULL});next(null, {code: Code.AREA.BAG_IS_FULL});
        return;
    }

    var barrierDropList = dropUtils.getDropItems(barrierData.drop);
    //barrierDropList = dropUtils.getDropItems(barrierData.drop);
    barrierDropList.push(dropUtils.makeGoldDrop(barrierData.dropmoney));
    barrierDropList.push(dropUtils.makeMoneyDrop(consts.MONEY_TYPE.KEY, dataUtils.getOptionValue('Custom_DropKeyNum')));

    var dropDouble = player.activityMgr.getFightDropdDouble( consts.FIGHT_TYPE.BARRIER );
    var passTime = passRec? passRec.passTime : 0;
    barrierManager.destroyBarrier(player);
    var barrier = barrierManager.createBarrier(player, barrierId, barrierData,barrierDropList,dropDouble,passTime);
    if (barrier) {
        var chapterDiffType = dataUtils.getChapterDiffTypeByBarrierId( barrier.barrierId );
        player.dataStatisticManager.refreshNewBarrier(chapterDiffType,barrier.barrierId );
        next(null, {code: Code.OK, barrier: barrier.getInfo(), drops: barrierDropList ,activityDropDouble:dropDouble, bestPassTime:passTime});
        return;
    } else {
        next(null, {code: Code.FAIL});
        return;
    }
    // pomelo.app.rpc.world.rankListRemote.getRank(session, {
    //     type : Consts.RANKING_TYPE.BARRIER,
    //     playerId: playerId,
    //     barrierId: barrierId
    // }, function (myRank) {
    //     myRank = myRank || {};
    //     var passTime = myRank.score || 0;
    //     barrierManager.destroyBarrier(player);
    //     var barrier = barrierManager.createBarrier(player, barrierId, barrierData,barrierDropList,dropDouble,passTime);
    //     if (barrier) {
    //         var chapterDiffType = dataUtils.getChapterDiffTypeByBarrierId( barrier.barrierId );
    //         player.dataStatisticManager.refreshNewBarrier(chapterDiffType,barrier.barrierId );
    //         next(null, {code: Code.OK, barrier: barrier.getInfo(), drops: barrierDropList ,activityDropDouble:dropDouble, bestPassTime:passTime});
    //         return;
    //     } else {
    //         next(null, {code: Code.FAIL});
    //         return;
    //     }
    // });


};
//关卡结算
pro.exitBarrier = function (msg, session, next) {
    var playerId = session.get('playerId'),
        player = area.getPlayer(playerId),
        barrier = barrierManager.getBarrier(player.id);

    if (!barrier){
        return  next(null, {code: Code.AREA.INVALID_BARRIER});
    }

    if(barrier.isPassed === 1){
        next(null, {code: Code.OK, drops: barrier.barrierDropList,activityDropDouble:barrier.dropDouble });
        return;
    }

    var oldBarrierId = player.passedBarrierMgr.getNewBarrierId(consts.CHAPTER_TYPE.NORMAL);
    var isPass = player.passedBarrierMgr.isPassed(barrier.barrierId);

    var passRec = player.passedBarrierMgr.getPassedBarrier( barrier.barrierId);
    var chapterDiffType = dataUtils.getChapterDiffTypeByBarrierId( barrier.barrierId );
    var promoteCnt = passRec ? passRec.promoteCnt : 0;
    var barrierData = dataApi.Custom.findById(barrier.barrierId);
    //屏蔽活动副本提交
    if(barrierData.customType === 4){
        logger.error("exitBarrier error player :%s barrierData.customType == 4",playerId);
        return  next(null, {code: Code.AREA.INVALID_BARRIER});
    }
    if ( msg.status === 1 ) {

        var passTimeLimit = dataUtils.getOptionValue("Custom_passTime",10);
        // 通关时间校验
        if (passTimeLimit*1000>msg.passTime){
            logger.error("通关时间校验失败 playerid:%s msg.passTime:%s limitTime:%s",playerId,msg.passTime,passTimeLimit*1000);
            return  next(null, {code: Code.AREA.BARRIER_DATA_INVALID});
        }


        var custom_passPower = dataUtils.getOptionValue("custom_passPower",0.5);
        // 通关战斗力校验
        var power = player.getPower();
        var replacePower = dataApi.CustomRoleReplace.getAllPowerByKey(barrier.barrierId);
        if(barrier.isPassed!=1 && replacePower){
            power = replacePower;
        }
        if(barrierData.powRec*custom_passPower>power){
            logger.error("通关战斗力校验失败 playerid:%s power:%s limitPower:%s",playerId,player.getPower(),barrierData.powRec*custom_passPower);
            return  next(null, {code: Code.AREA.BARRIER_DATA_INVALID});
        }

        //关卡进度促销相关
        if(promoteCnt < 1){//这次只做1次
            if(barrierData.shopIndex != 0){
                var dropIds = [];
                var activitygoodDataList = dataApi.ActivityGoods.findByIndex({id: barrierData.shopIndex});
                if(activitygoodDataList.length > 0){
                    for(var key in activitygoodDataList){
                        var itemData = dataApi.Items.findById(activitygoodDataList[key].typeId);
                        if(itemData){
                            var tmpData = {};//[dropid, priceOld，price，priceType]
                            tmpData.dropId = itemData.value;
                            tmpData.priceOld = activitygoodDataList[key].priceOld;
                            tmpData.price = activitygoodDataList[key].price;
                            tmpData.priceType = activitygoodDataList[key].priceType;
                            dropIds.push(tmpData);
                        }
                    }
                }
                promoteCnt = promoteCnt + 1;
                var chapterId = dataUtils.getChapterIdByBarrierId( barrier.barrierId );
                player.barrierPromoteMgr.addPromote(chapterId,dropIds);
                //player.set('barrierPromoteDropIds',dropIds);
                //player.set('barrierPromoteEndTick',new Date().getTime()+dataUtils.getOptionValue("Custom_ShopLiveTime")*3600000);
            }
        }

        if (passRec && passRec.dailyTimes >= barrierData.dailyTimes) {
            return   next(null, {code: Code.AREA.REACH_ATK_MAX});
        }
        // 检查体力是否足够
        if (barrierData.energy && player.energy < barrierData.energy) {
            return  next(null, {code: Code.AREA.LACK_ENERGY});

        }
        if (barrierData) {
            player.set('energy', player.energy - barrierData.energy || 0);
            logger.debug('exitBarrier dropDouble = %s', barrier.dropDouble);
            barrier.barrierDropList = player.applyDrops(barrier.barrierDropList,barrier.dropDouble,flow.ITEM_FLOW.EXIT_BARRIER);
        }
        // 通过标记 防止二次发奖
        var ISPASSED = 1;
        // 胜利，更新星级
        player.resetBarrierAfterExit(playerId, barrier.barrierId, msg.status > 0 ? msg.star : 0, Date.now() - barrier.startTick, barrier.reviveCnt,
            msg.power, msg.superSkillCnt, msg.jumpCnt, msg.jumpSkillCnt,promoteCnt,msg.passTime);

        barrier.isPassed = ISPASSED;

        if (msg.passTime<barrier.passTime||barrier.passTime==0){
            // 更新关卡排行榜
            pomelo.app.rpc.world.rankListRemote.updateBarrierRankingList(session, {
                type : Consts.RANKING_TYPE.BARRIER,
                playerId: playerId,
                score: msg.passTime,
                barrierId: barrier.barrierId
            }, function (res) {});
        }

        player.onBarrierSettlement( barrier.barrierId );

        if( chapterDiffType == consts.CHAPTER_TYPE.NORMAL )
        {
            player.missionMgr.progressUpdate( consts.MISSION_CONDITION_TYPE.PASS_GENERAL_BARRIER_CNT,consts.MISSION_PROGRESS_VALUE_TYPE.MATH_MAX ,barrier.barrierId,[{type:consts.MAIL_PARAM_TYPE.CONFIG_VALUE,value:barrierData.customName}]);
            player.missionMgr.progressUpdate( consts.MISSION_CONDITION_TYPE.GENERAL_BARRIER_CNT );
            //if(oldBarrierId<barrier.barrierId){
                player.trainMgr.groupUp(barrier.barrierId);
           // }
        }
        else if( chapterDiffType == consts.CHAPTER_TYPE.DIFFL )
        {

            player.missionMgr.progressUpdate( consts.MISSION_CONDITION_TYPE.PASS_ELTE_CNT,consts.MISSION_PROGRESS_VALUE_TYPE.MATH_MAX ,barrier.barrierId,[{type:consts.MAIL_PARAM_TYPE.CONFIG_VALUE,value:barrierData.customName}]);
            player.missionMgr.progressUpdate( consts.MISSION_CONDITION_TYPE.ELITE_BARRIER_CNT );
        }
        player.missionMgr.progressUpdate( consts.MISSION_CONDITION_TYPE.BARRIER_START_CNT,consts.MISSION_PROGRESS_VALUE_TYPE.TOTAL_VALUE,player.passedBarrierMgr.getTotalStarCnt());

        player.passedBarrierMgr.updateNewBarrierId(chapterDiffType,barrier.barrierId);
        //TODO 单独活动推送
        player.activityMgr.publish(publisher.publish(pomelo.app.get('opFlags'), common.getServerDay()));//刷一下活动列表--因为活动涉及到了通关关卡
        inviteManager.OnPlayerCharge(player, barrier.barrierId,oldBarrierId, player.buyGetDiamond);

        // 助战消耗
        if (msg.assistFightPlayerId){
            var moneyType = dataApi.CommonParameter.getOptionValue('assistFightPriceType', 1);
            var haveMoney = player.getMoneyByType(moneyType);
            var assistRecord = player.assistFightMgr.getAssistRecord(msg.assistFightPlayerId);
            var cost = assistRecord.getPrice();
            player.setMoneyByType(moneyType,haveMoney-cost,flow.MONEY_FLOW_COST.ASSIST_FIGHT);
            // 更新助战信息
            player.assistFightMgr.update(msg.assistFightPlayerId);
        }

        // 通关邮件
        if( isPass == false){
            var mails = Utils.parseParams(barrierData.mailId,"#");
            //尝试发送邮件
            async.eachSeries(mails,function (mailID,callback) {
                var sysMail = dataApi.SysEamil.findById(mailID);
                if (sysMail){
                    var mail = {title:sysMail.title, info:sysMail.text, sender:sysMail.name, drop:sysMail.dropId};
                    pomelo.app.rpc.world.mailRemote.CreateMailNew.toServer("*",playerId, mail, function(){
                        callback();
                    });
                }
            },function(err){

            });
        }

        if ( player.funcOpen(consts.FUNCTION.RAND_BOSS) ) {
            var chanceTrigger= barrierData.chanceTrigger;
            //首次触发百分百随机
            if( isPass == false   ){
                var funcData = dataApi.FunctionOpen.findById(consts.FUNCTION.RAND_BOSS);
                if(funcData.custom ==barrier.barrierId ){
                    chanceTrigger = 1;
                }
            }
            // chanceTrigger =1;
            if( chanceTrigger>0 ){
                var oldRandBoss =  player.passedBarrierMgr.getRandBoss();
                if(!oldRandBoss.isHaveBoss()){
                    var tmpRandNum = Math.random();
                    if( tmpRandNum <= chanceTrigger ){
                        //randBossRecordDao.getRecordByPlayerId(playerId,function(err,randBossRecord){//这里是异步回调，所以每个if后面要加上else来返回
                        var randBoss = player.passedBarrierMgr.newCreateRandBoss(barrierData);
                        randBossRecordDao.getWinCntByWeek(player.id,randBoss.randomBossId,function (err,thisWeekWinCnt, lastWeekWinCnt) {
                            /*var winCnt = 0;
                            for(var i = 0;i < randBossRecord.length ; i ++){
                                if( randBossRecord[i].randomBossId == randBoss.randomBossId){
                                    winCnt += 1;
                                }
                            }
                             randBoss.setWin(winCnt);
                            */
                            var lastWeekCnt = Math.floor(lastWeekWinCnt * dataUtils.getOptionValue('RandomBossResetParameter ',0.5));
                            randBoss.setWin(thisWeekWinCnt + (lastWeekCnt > 0 ? lastWeekCnt : 1));

                            randBossDao.deleteRandBossByPlayerId(playerId,function(){});
                            player.emit('saveBarrierRandBoss', randBoss.getData());
                            return next(null, {code: Code.OK, drops: barrier.barrierDropList,activityDropDouble:barrier.dropDouble,barrierRandBoss:randBoss.getClientInfo() });
                        });
                    }
                    else{
                        next(null, {code: Code.OK, drops: barrier.barrierDropList,activityDropDouble:barrier.dropDouble });
                    }
                }
                else{
                    next(null, {code: Code.OK, drops: barrier.barrierDropList,activityDropDouble:barrier.dropDouble });
                }
            }
            else{
                next(null, {code: Code.OK, drops: barrier.barrierDropList,activityDropDouble:barrier.dropDouble });
            }
        }
        else{
            next(null, {code: Code.OK, drops: barrier.barrierDropList,activityDropDouble:barrier.dropDouble });
        }
    }
    else{
        player.resetBarrierAfterExit(playerId, barrier.barrierId, 0, Date.now() - barrier.startTick, barrier.reviveCnt,
            msg.power, msg.superSkillCnt, msg.jumpCnt, msg.jumpSkillCnt,promoteCnt,msg.passTime);
        next(null, {code: Code.OK, drops: barrier.barrierDropList,activityDropDouble:barrier.dropDouble });
    }

    //
    // if( chapterDiffType == consts.CHAPTER_TYPE.NORMAL )
    // {
    //     player.missionMgr.progressUpdate( consts.MISSION_CONDITION_TYPE.GENERAL_BARRIER_CNT );
    // }
    // else if( chapterDiffType == consts.CHAPTER_TYPE.DIFFL )
    // {
    //     player.missionMgr.progressUpdate( consts.MISSION_CONDITION_TYPE.ELITE_BARRIER_CNT );
    // }

};

pro.setCurFightHero = function (msg, session, next) {
    var playerId = session.get('playerId');
    var player = area.getPlayer(playerId);

    var type = msg.type;
    if( consts.HERO_TYPE.HERO== type )
    {
        if (player.setCurFightHero(msg.pos)) {
            next(null, {code: Code.OK, curHero: player.curHero.getClientInfo()});
        } else {
            next(null, {code: Code.AREA.HERO_NOT_EXIST});
        }
    }
    else{
        logger.debug('setCurFightHero playerId = %s, type = %s, pos = %s', playerId, msg.type, msg.pos );

        if( msg.type == null || msg.pos ==null )
        {
            return  next(null, { code: Code.AREA.HERO_NOT_EXIST });
        }
        var player = area.getPlayer(playerId);
        player.setCurrFightBrotherHero( msg.type,msg.pos,next );
    }
    var curDress = [];//当前穿戴
    curDress.push(player.heroBag.getItemByPos(player.curHeroPos));
    _.each(player.curBrotherHeros,function(brother){
        curDress.push(player.heroBag.getItemByPos(brother.pos));
    });
    player.emit('onActHeroLevelUp' ,curDress);
    player.emit('onActHeroBreak' ,curDress);
    player.emit('onActHeroGrade' ,curDress);
};
//
//
// //设置出战英雄的兄弟
// pro.setCurFightHeroBrother = function (msg , session ,next ) {
//     var playerId = session.get('playerId');
//
//     logger.debug('setCurFightHeroBrother playerId = %s, type = %s, pos = %s', playerId, msg.type, msg.pos );
//
//     if( msg.type == null || msg.pos ==null )
//     {
//         return  next(null, { code: Code.AREA.HERO_NOT_EXIST });
//     }
//     var player = area.getPlayer(playerId);
//     player.setCurrFightBrotherHero( msg.type,msg.pos,next );
// };

pro.buyEnergy = function (msg, session, next) {
    var playerId = session.get('playerId');
    var player = area.getPlayer(playerId);
    if (player.buyEnergyCnt >= dataUtils.getOptionValue(consts.CONFIG.BUY_ENERGY_MAX, 0)) {
        return next(null, {code: Code.AREA.REACH_BUY_ENERGY_MAX});
    }
    var cost = dataUtils.getOptionListValueByIndex(consts.CONFIG.ENERGY_PRICE, player.buyEnergyCnt);
    //原价
    var originalPrice = cost;
    var energyDiscount = player.activityMgr.energyDiscount();

    cost = cost * energyDiscount;
    if (player.diamondCnt < cost) {
        return next(null, {code: Code.DIAMOND_NUM_NOT_ENOUGH});
    }
    if (player.energy >= consts.MAX_ENERGY) {
        next(null, {code: Code.AREA.REACH_MAX_ENERGY});
        return;
    }
    //player.setDiamond(player.diamondCnt - cost);
    player.setMoneyByType(consts.MONEY_TYPE.DIAMOND,player.diamondCnt - cost,flow.MONEY_FLOW_COST.ENERGY_BUY);

    player.set('buyEnergyCnt', player.buyEnergyCnt + 1);
    player.set('energy', Math.min(consts.MAX_ENERGY, player.energy + dataUtils.getOptionValue(consts.CONFIG.ENERGY_BUY_UNIT, 0) ));

    logger.debug('buyEnergy playerId = %s, originalPrice = %s, energyDiscount = %s', playerId,originalPrice,energyDiscount);

    player.missionMgr.progressUpdate(consts.MISSION_CONDITION_TYPE.BUY_XX_ENERGY,consts.MISSION_PROGRESS_VALUE_TYPE.ADD_VALUE);
    next(null, {code: Code.OK, cost: originalPrice ,discount : energyDiscount });
};

/*
 *   解锁章节
 * */
pro.unlockChapter = function (msg, session, next) {
    logger.debug('unlockChapter playerId = %s, chapterId = %s', session.get('playerId'), msg.chapterId);
    var player = area.getPlayer(session.get('playerId')),
        chapterData = dataApi.Chapter.findById(msg.chapterId);
    if (!chapterData) {
        logger.debug('unlockChapter chapter data not found!');
        return next(null, {code: Code.FAIL});
    }
    // 是否已解锁
    if (player.unlockChapterMgr.isUnlocked(msg.chapterId)) {
        return next(null, {code: Code.AREA.CHAPTER_UNLOCKED});
    }
    // 是否可以解锁
    if (!player.passedBarrierMgr.canUnlockChapter(msg.chapterId)) {
        return next(null, {code: Code.AREA.PRE_CHAPTER_NOT_PASSED});
    }
    if (player.keyCount < chapterData.unlockKeyCount) {
        return next(null, {code: Code.AREA.LACK_KEY});
    }
    player.set('keyCount', player.keyCount - chapterData.unlockKeyCount);
    player.unlockChapterMgr.unlock(msg.chapterId);
    // 章节解锁邮件
    var mails = Utils.parseParams(chapterData.mailId,"#");
    //尝试发送邮件
    async.eachSeries(mails,function (mailID,callback) {
        var sysMail = dataApi.SysEamil.findById(mailID);
        if (sysMail){
            var mail = {title:sysMail.title, info:sysMail.text, sender:sysMail.name, drop:sysMail.dropId};
            pomelo.app.rpc.world.mailRemote.CreateMailNew.toServer("*",session.get('playerId'), mail, function(){
                callback();
            });
        }
    },function(err){

    });
    next(null, {code: Code.OK, cost: chapterData.unlockKeyCount});
};

/*
 *   扫荡
 * */
pro.wipe = function (msg, session, next) {
    logger.debug('wipe playerId = %s, barrierId = %s', session.get('playerId'), msg.barrierId);
    var playerId = session.get('playerId');
    var player = area.getPlayer(playerId);
    if (!player.passedBarrierMgr.isPassed(dataUtils.getOptionValue(consts.CONFIG.WIPE_OPEN_BARRIER, 1))) {
        return next(null, {code: Code.AREA.FUNC_DISABLED});
    }
    // 检查背包是否有足够空格
    if (!player.bag.isHasPosition()) {
        return next(null, {code: Code.AREA.BAG_IS_FULL});
    }
    var barrierData = dataApi.Custom.findById(msg.barrierId);
    if (!barrierData) {
        return next(null, {code: Code.AREA.INVALID_BARRIER});
    }
    var passRec = player.passedBarrierMgr.getPassedBarrier(msg.barrierId);
    if (passRec && passRec.dailyTimes >= barrierData.dailyTimes) {
        return next(null, {code: Code.AREA.REACH_ATK_MAX});
    }
    // 检查体力是否足够
    if (barrierData.energy && player.energy < barrierData.energy) {
        return next(null, {code: Code.AREA.LACK_ENERGY});
    }
    if (player.wipeTicket < 1) {
        return next(null, {code: Code.AREA.LACK_WIPE_TICKET});
    }

    var dropDouble = player.activityMgr.getFightDropdDouble( consts.FIGHT_TYPE.BARRIER );
    player.set('energy', player.energy - barrierData.energy);
    player.set('wipeTicket', player.wipeTicket - 1);
    player.resetBarrierAfterExit(player.id, msg.barrierId, 1);
    var dropItems = dropUtils.getDropItems(barrierData.drop);
    dropItems.push(dropUtils.makeGoldDrop(barrierData.dropmoney));
    dropItems.push(dropUtils.makeMoneyDrop(consts.MONEY_TYPE.KEY, dataUtils.getOptionValue('Custom_DropKeyNum')));
    dropItems=  player.applyDrops(dropItems,dropDouble,flow.ITEM_FLOW.BARRIER_WIPE);

    player.onBarrierSettlement(msg.barrierId);
    //doBarrierSettlement

    var chapterDiffType = dataUtils.getChapterDiffTypeByBarrierId( msg.barrierId );
    if( chapterDiffType == consts.CHAPTER_TYPE.NORMAL )
    {
        player.missionMgr.progressUpdate( consts.MISSION_CONDITION_TYPE.GENERAL_BARRIER_CNT );
    }
    else if( chapterDiffType == consts.CHAPTER_TYPE.DIFFL )
    {
        player.missionMgr.progressUpdate( consts.MISSION_CONDITION_TYPE.ELITE_BARRIER_CNT );
    }
    player.passedBarrierMgr.updateNewBarrierId(chapterDiffType,msg.barrierId);

    // [138853]【服务端】扫荡增加可触发随机BOSS
    if ( player.funcOpen(consts.FUNCTION.RAND_BOSS) ) {
        var chanceTrigger= barrierData.chanceTrigger;
        // chanceTrigger =1;
        if( chanceTrigger>0 ){
            var oldRandBoss =  player.passedBarrierMgr.getRandBoss();
            if(!oldRandBoss.isHaveBoss()){
                var tmpRandNum = Math.random();
                if( tmpRandNum <= chanceTrigger ){
                    //randBossRecordDao.getRecordByPlayerId(playerId,function(err,randBossRecord){//这里是异步回调，所以每个if后面要加上else来返回
                    var randBoss = player.passedBarrierMgr.newCreateRandBoss(barrierData);
                    randBossRecordDao.getWinCntByWeek(player.id,randBoss.randomBossId,function (err,thisWeekWinCnt, lastWeekWinCnt) {
                         /*var winCnt = 0;
                         for(var i = 0;i < randBossRecord.length ; i ++){
                             if( randBossRecord[i].randomBossId == randBoss.randomBossId){
                                winCnt += 1;
                             }
                         }
                         randBoss.setWin(winCnt);
                         */
                        var lastWeekCnt = Math.floor(lastWeekWinCnt * dataUtils.getOptionValue('RandomBossResetParameter ',0.5));
                        randBoss.setWin(thisWeekWinCnt + (lastWeekCnt > 0 ? lastWeekCnt : 1));

                        randBossDao.deleteRandBossByPlayerId(playerId,function(){});
                        player.emit('saveBarrierRandBoss', randBoss.getData());
                        return next(null, {code: Code.OK, drops: dropItems,activityDropDouble:dropDouble,barrierRandBoss:randBoss.getClientInfo() });
                    });
                }
                else{
                    return next(null, {code: Code.OK, drops: dropItems,activityDropDouble:dropDouble});
                }
            }
            else{
                return next(null, {code: Code.OK, drops: dropItems,activityDropDouble:dropDouble});
            }
        }
        else{
            return next(null, {code: Code.OK, drops: dropItems,activityDropDouble:dropDouble});
        }
    }
    else{
        return next(null, {code: Code.OK, drops: dropItems,activityDropDouble:dropDouble});
    }

};
// 使用三星卷
pro.threeStar = function (msg, session, next) {
    var playerId = session.get('playerId'),
        player = area.getPlayer(playerId),
        items = msg.items || [],
        itemMsg = items[0],
        item = player.bag.getItem(itemMsg.pos);
    
    if (itemMsg.count < 1) {
        return next(null, {code: Code.AREA.FAIL});
    }

    // 当前关卡未通关
    if (!player.passedBarrierMgr.isPassed(msg.barrierId)) {
        return next(null, {code: Code.AREA.BARRIER_NOT_PASSED});
    }
    // 当前pos 道具不存在
    if (!item) {
        logger.error("playerHandler threeStar item no exist playerid = %s, pos=%s, count = %s", playerId, itemMsg.pos, itemMsg.count);
        return next(null, {code: Code.AREA.ITEM_NOT_EXIST});
    }
    var needItemId = dataUtils.getOptionValue("SansungSecuritieUse", 0);
    // 客户端提交的道具不对
    if (item.itemId != needItemId) {
        logger.error("playerHandler threeStar item no exist playerid = %s, pos=%s, count = %s", playerId, itemMsg.pos, itemMsg.count);
        return next(null, {code: Code.AREA.THREE_STAR_ITEM_ERROR});
    }

    // 判断数量是否足够
    if (!player.bag.isItemEnough(itemMsg.pos, itemMsg.count)) {
        logger.error("playerHandler threeStar item no Enough playerid = %s, pos=%s, count = %s", playerId, itemMsg.pos, itemMsg.count);
        return next(null, {code: Code.AREA.ITEM_NOT_ENOUGH});
    }

    // 消耗道具
    player.bag.useItem(itemMsg.pos, itemMsg.count);
    // 通关设为3星并推送
    player.passedBarrierMgr.forcePassed(msg.barrierId, 3);
    // 更新成就
    player.missionMgr.progressUpdate( consts.MISSION_CONDITION_TYPE.BARRIER_START_CNT,consts.MISSION_PROGRESS_VALUE_TYPE.TOTAL_VALUE,player.passedBarrierMgr.getTotalStarCnt() );

    return next(null, {code: Code.OK});
};

/*
 *   购买扫荡券
 * */
pro.buyWipeTicket = function (msg, session, next) {
    logger.debug('buyWipeTicket playerId = %s', session.get('playerId'));
    var player = area.getPlayer(session.get('playerId')),
        price = dataUtils.getOptionValue(consts.CONFIG.WIPE_TICKET_PRICE, Number.POSITIVE_INFINITY);
    if (player.diamondCnt < price) {
        return next(null, {code: Code.DIAMOND_NUM_NOT_ENOUGH});
    }
    player.setDiamond(player.diamondCnt - price);
    player.set('wipeTicket', player.wipeTicket + 1);
    next(null, {code: Code.OK, cost: price});
};

function getTotalStarsByChapterId(player, chapterId) {
    var chapterData = dataApi.Chapter.findById(chapterId);
    if (!chapterData) {
        return 0;
    }
    return _.reduce(chapterData.barriers, function (memo, barrierId) {
        var rec = player.passedBarrierMgr.getPassedBarrier(barrierId);
        if (rec) {
            return memo + rec.star;
        }
        return memo;
    }, 0);
}

/*
 *   领取章节星级宝箱
 * */
pro.drawChapterStarAwards = function (msg, session, next) {
    logger.debug('drawChapterStarAwards playerId = %s, chapterId = %s, starCondId = %s', session.get('playerId'),
        msg.chapterId, msg.starCondId);
    var player = area.getPlayer(session.get('playerId')),
        totalStars = getTotalStarsByChapterId(player, msg.chapterId),
        reqStars = dataApi.Chapter.getReqStarsByChapterIdAndCondId(msg.chapterId, msg.starCondId);
    if (totalStars < reqStars) {
        logger.debug('drawChapterStarAwards totalStars(%s) < reqStars(%s)', totalStars, reqStars);
        return next(null, {code: Code.AREA.LACK_CHAPTER_STARS});
    }
    if (player.unlockChapterMgr.isDrew(msg.chapterId, msg.starCondId)) {
        return next(null, {code: Code.AREA.CHAPTER_STAR_AWARD_DREW});
    }
    var dropIdx = dataApi.Chapter.getStarDropByChapterIdAndCondId(msg.chapterId, msg.starCondId),
        drops = dropUtils.getDropItems(dropIdx);
    player.unlockChapterMgr.setDrew(msg.chapterId, msg.starCondId);
    drops = player.applyDrops(drops,null,flow.ITEM_FLOW.DRAW_CHAPTER_STAR_AWARD);
    next(null, {code: Code.OK, drops: drops});
};

pro.buyTime = function (msg, session, next) {
    logger.debug('buyTime playerId = %s', session.get('playerId'));
    var player = area.getPlayer(session.get('playerId')),
        curBarrier = barrierManager.getBarrier(session.get('playerId'));
    if (!curBarrier) {
        logger.debug('buyTime not in barrier!');
        return next(null, {code: Code.FAIL});
    }
    if (curBarrier.buyTimeCount >= dataUtils.getOptionValue(consts.CONFIG.BUY_TIME_MAX, 0)) {
        return next(null, {code: Code.AREA.REACH_BUY_TIME_MAX});
    }
    var cost = dataUtils.getOptionListValueByIndex(consts.CONFIG.BUY_TIME_COST, curBarrier.buyTimeCount);
    if (player.diamondCnt < cost) {
        return next(null, {code: Code.DIAMOND_NUM_NOT_ENOUGH});
    }
   // player.setDiamond(player.diamondCnt - cost);
    player.setMoneyByType(consts.MONEY_TYPE.DIAMOND,player.diamondCnt - cost,flow.MONEY_FLOW_COST.FIGHT_BUY_TIME);
    curBarrier.doBuyTime();
    next(null, {code: Code.OK, cost: cost, buyTimeCount: curBarrier.buyTimeCount});
};

//=================================================取名字===============================================================
/*
 *   检查名字长度
 * */
function playerNameLenValid(name) {
    var nameLen = Utils.getLengthInBytes(name);
    return ( nameLen >= consts.PLAYER_NAME_LEN_RANGE.MIN && nameLen <= consts.PLAYER_NAME_LEN_RANGE.MAX);
}

function containsDirtyWord(name) {
    var dirtyWords = dataApi.DirtyWords.all(),
        dirtyWord;
    var len  =_.size(dirtyWords);

    var findValue= _.find( dirtyWords , function (rec) {
        dirtyWord = rec.dirtyWord;
        if (name.indexOf(dirtyWord) >= 0) {
            logger.debug('containsDirtyWord %s', dirtyWord);
            return true;
        }
    });
    return !_.isUndefined( findValue );
}
/*
 *   创建名字
 * */
pro.createPlayerName = function (msg, session, next) {
    logger.debug('createPlayerName playerId = %s, name = %s', session.get('playerId'), msg.name);
    var player = area.getPlayer(session.get('playerId'));
    // if ( player.nameCreated ) {
    //     logger.debug('createPlayerName created before!');
    //     next(null, {code: Code.FAIL});
    //     return;
    // }
    if ( !msg.name ) {
        logger.debug('createPlayerName empty name not allowed!');
        next(null, {code: Code.FAIL});
        return;
    }
    if( player.setNameCnt != 0 ){
        next(null, {code: Code.PLAYER_NAME.NAME_EXIST});
        return;
    }
    if (!playerNameLenValid(msg.name)) {
        next(null, {code: Code.AREA.NAME_LENGTH_OUT_OF_RANGE});
        return;
    }
    // if (containsDirtyWord(msg.name)) {
    //     next(null, {code: Code.AREA.DIRTY_NAME});
    //     return;
    // }
    pomelo.app.rpc.world.playerRemote.updatePlayerName(session,{playername:msg.name,playerId:session.get('playerId')},function (err,res) {
        if(res!=Code.OK){
            next(null, {code: Code.AREA.NAME_CONFLICT});
            return;
        }
        var cnt = player.setNameCnt+1;
        player.set('setNameCnt',cnt);
        player.set('playername',msg.name);
        next(null, {code: Code.OK});
    });

    // playerDao.playerExistByName( msg.name, function (err, exist) {
    //     if (err) {
    //         next(null, {code: Code.DB_ERROR});
    //     } else {
    //         if (exist) {
    //             next(null, {code: Code.AREA.NAME_CONFLICT});
    //         } else {
    //             // 立即保存，仍然有可能重复
    //             playerDao.createPlayerName( player.id, msg.name, function (err, success) {
    //                 if (err) {
    //                     return next(null, {code: Code.DB_ERROR});
    //                 }
    //                 if (success) {
    //                     //player.playername = msg.name;//set('name', msg.name);
    //                     //player.nameCreated = 1;
    //                     var cnt = player.setNameCnt+1;
    //                     player.set('setNameCnt',cnt);
    //                     player.set('playername',msg.name);
    //                     next(null, {code: Code.OK});
    //                 } else {
    //                     logger.debug('createPlayerName failed!');
    //                     return next(null, {code: Code.FAIL});
    //                 }
    //             });
    //         }
    //     }
    // });
};
/**
 * 获得好友的所有boss
 * */
pro.getAllFriendsBoss = function ( msg, session, next ) {
    var playerId = session.get('playerId');
    var player = area.getPlayer(playerId);
    var randBossList = [];
    randBossList.push(player.passedBarrierMgr.randBoss.getClientInfo());
    var assistCount = player.refreshMgr.assistRandBossCount;
    var playerRandBossCoolTime = player.refreshMgr.playerRandBossCoolTime;
    var assistRandBossCoolTime = player.refreshMgr.assistRandBossCoolTime;
    pomelo.app.rpc.world.friendsRemote.getFriendIdList(session,playerId,function (err,result) {
        var friendsBoss = [];
        _.each(result,function (friendId) {
            var boss = pomelo.app.get('randomBossMgr').getFriendBoss(friendId);
            if (boss){
                friendsBoss.push(boss);
            }
        });

        friendsBoss.forEach(function (randBoss) {
            if (randBoss.hasShare>=1){
                randBossList.push(randBoss.getClientInfo());
            }
        });
        return next(null, {code: Code.OK,barrierRandBoss:randBossList,assistRandBossCount:assistCount,playerRandBossCoolTime:playerRandBossCoolTime,assistRandBossCoolTime:assistRandBossCoolTime});
    });
};

function checkCoolTime(coolTime) {
   return  coolTime > 0 && coolTime > Date.now();
}
/**
 * 攻打随机boss
 * */
pro.atkRandBoss = function ( msg, session, next ) {
    var playerID = msg.friendId ? msg.friendId : session.get('playerId');

    var player = area.getPlayer(session.get('playerId'));
    var randomBossId = msg.randomBossId;

    var randBoss = player.passedBarrierMgr.randBoss;
    if (msg.friendId){
        var limitCount = dataApi.CommonParameter.getOptionValue('assistRandBossAtkCount', 5);
        // 助战每日限制次数
        if (player.refreshMgr.assistRandBossCount >=limitCount){
            return next(null, {code: Code.RANDBOSS.DAILY_COUNT_LIMIT});
        }
        randBoss = pomelo.app.get('randomBossMgr').getFriendBoss(msg.friendId);
    }
    //boss不存在
    if(!randBoss){
        return next(null, {code: Code.RANDBOSS.NOT_FOUND});
    }

    if(!randBoss.isHaveBoss()){
        return next(null, {code: Code.RANDBOSS.NOT_FOUND});
    }
    // 检查冷却 区分好友的冷却和自己的冷却
    if (msg.friendId){
        if (checkCoolTime(player.refreshMgr.assistRandBossCoolTime)){
            return next(null, {code: Code.RANDBOSS.COOLING});
        }
    }else {
        if (checkCoolTime(player.refreshMgr.playerRandBossCoolTime)){
            return next(null, {code: Code.RANDBOSS.COOLING});
        }
    }
    // if(randBoss.isCooling()){
    //     return next(null, {code: Code.RANDBOSS.COOLING});
    // }
    if(randBoss.isDisappear()){
        return next(null, {code: Code.RANDBOSS.DISAPPEAR});
    }
    if(!msg.friendId&&!randBoss.isChallengeTicketEnough()){
        return next(null, {code: Code.AREA.LACK_ENERGY});
    }
    randBoss.enterAtkRandBossTime = Date.now();
    if (msg.friendId){
        randBoss.friendId = session.get('playerId');
    }else {
        player.set('challengeTicket', player.getMoneyByType(consts.MONEY_TYPE.CHALLENGE_TICKET) - randBoss.getNeedChallengeTicket() || 0);
    }
    // randBossRecordDao.getWinCntByWeek(playerID,randomBossId,function (err,thisWeekWinCnt, lastWeekWinCnt) {
    //     var lastWeekCnt = Math.floor(lastWeekWinCnt * dataUtils.getOptionValue('RandomBossResetParameter ',0.5));
    //     randBoss.setWin(thisWeekWinCnt + (lastWeekCnt > 0 ? lastWeekCnt : 1));
    //     return next(null, {code: Code.OK,barrierRandBoss:randBoss.getClientInfo()});
    // });
    // randBoss.setWin(randBoss.winCnt + (randBoss.lastWeekCnt > 0 ? randBoss.lastWeekCnt : 1));
    return next(null, {code: Code.OK,barrierRandBoss:randBoss.getClientInfo()});
};

pro.sendMail = function (playerId, mailId, dropId, count, infoParams) {
    var sysMail = dataApi.SysEamil.findById(mailId);
    //logger.debug("@@@@@ sysMail：%j",sysMail);
    if (sysMail) {
        //发送邮件
        var mail = {title: sysMail.title, info: sysMail.text, sender: sysMail.name, drop: dropId, infoParams: infoParams};
        var _count = count ? count : 1;
        var capacity = dataUtils.getOptionValue('mailUnReadExpired', 7);
        // _.each(mail, function (entry) {
        // 计算掉落
        // 掉落按次序分组
        var dropIdxList = Utils.parseParams(mail.drop);
        var barrierDropList = [];
        dropIdxList.forEach(function (dropIdx) {
            var drops = dropUtils.getDropItemsByCount(dropIdx, _count);
            //barrierDropList.push(drops);
            barrierDropList = _.union(barrierDropList, drops);
        });
        mail.drops = barrierDropList;
        //logger.debug("生成邮件~~@~~mail.drop:%d, mail.drops:%j", mail.drop, mail.drops);
        // mail.items = JSON.stringify(mail.drops);

        if (mail.life == null) {
            mail.life = capacity * 24 * 60 * 60; // 7天
        }

        mail.addTime = Date.now();
        mail.delTime = Date.now() + mail.life * 1000;
        mail.playerId = playerId;
        // });
        pomelo.app.rpc.world.mailRemote.CreateMailByCustom("*", playerId, mail,JSON.stringify(mail.drops), function () {
        });
    }
};

function getFriendsName(friendList) {
    var names = "";
    async.each(friendList,function (friendId,callback) {
        var player = area.getPlayer(friendId);
        if (player){
            if(names.length == 0){
                names = player.playername;
            }else {
                names += "," + player.playername ;
            }
            callback();
        }else {
            pomelo.app.rpc.world.playerRemote.getMiniData('*', {playerId: friendId}, function (err, res) {
                if (res.miniData) {
                    names = [names,res.miniData.playername].join(",");
                }
                callback();
            });
        }
    },function (err) {

    });
    return names;
}

/**
 * 退出随机boss
 * */
pro.exitRandBoss = function (msg, session, next) {
    var player       =  area.getPlayer(session.get('playerId'));
    //当前打掉的血
    var currHp       =  msg.currHp;
    var randomBossId =  msg.randomBossId;
    var randBoss;
    if (msg.friendId){
        randBoss = pomelo.app.get('randomBossMgr').getFriendBoss(msg.friendId);
    }else {
        randBoss = player.passedBarrierMgr.randBoss;
    }

    // if(!randBoss.enterAtkRandBossTime){
    //     return next(null,{code: Code.RANDBOSS.NOT_SEND_ATKBOSS});
    // }
    if(randomBossId!=randBoss.randomBossId){
        return next(null,{code: Code.RANDBOSS.NOT_FOUND});
    }
    if(null==currHp || (currHp!=null && currHp>100000)){
        return next(null,{code: Code.RANDBOSS.HP_ERROR});
    }

    //boss还剩的血
    var oldHp   =  randBoss.getHp();

    //剩下的血
    var tmpHp = oldHp - currHp;
    tmpHp = tmpHp<0 ? 0:tmpHp;
    currHp = Math.min(oldHp,currHp);
    // if(tmpHp<0){
    //     return next(null,{code: Code.RANDBOSS.HP_ILLEGAL});
    // }
    // 提交的时候boss已經死亡
    if(oldHp == 0) {
        // 助战好友boss
        if (msg.friendId) {
            // var dieAward = randBoss.sendShareDieAward(player);
            var awards = randBoss.sendShareParticipateAward(player);
            var assistKillAward = dataApi.CommonParameter.getOptionValue('AssistKillAward', 0);
            this.sendMail(session.get('playerId'), assistKillAward, randBoss.data.killAward, 1, JSON.stringify([{
                type: consts.MAIL_PARAM_TYPE.CONFIG_VALUE,
                value: randBoss.data.BossName
            }]));
            return next(null, {
                code: Code.OK,
                barrierRandBoss: randBoss.getClientInfo(),
                // dieDrops: dieAward,
                drops: awards.drops,
                dropsCnt: awards.dropsCnt
            });

        }
        // 发现者攻打boss
        else {
            // boss死亡
            // var dieAward = randBoss.sendDieAward(player);
            // var awards = randBoss.sendAward(player, currHp / 100000);
            player.set('challengeTicket', player.getMoneyByType(consts.MONEY_TYPE.CHALLENGE_TICKET) + randBoss.getNeedChallengeTicket());
            return next(null, {
                code:Code.RANDBOSS.HAS_KILLED
            });

        }
    }

    if (msg.friendId) {
        randBoss.updateFriendList(session.get('playerId'));
        player.refreshMgr.refreshAssitRandBoss();
        randBoss.refresh(tmpHp, randBoss.getAtk() + 1, currHp, session.get('playerId'));
    } else {
        randBoss.refresh(tmpHp, randBoss.getAtk() + 1);
    }

    randBoss.enterAtkRandBossTime = null;

    var self = this;
    if (msg.friendId) {
        if (tmpHp <= 0) {
            randBossRecordDao.insert(randBoss.getData(), function (err, res) {
                if (err) {
                    return next(null, {code: Code.FAIL});
                } else {
                    // var dieAward = randBoss.sendShareDieAward(player);
                    var awards = randBoss.sendShareParticipateAward(player);
                    var damage = Math.ceil(randBoss.friendAtkHp / 1000);
                    var count = randBoss.getAwardCount(randBoss.friendAtkHp / 100000);
                    //   发现者的伤害奖励
                    var shareInjuredAward = dataApi.CommonParameter.getOptionValue('ShareInjuredAward', 0);
                    self.sendMail(msg.friendId, shareInjuredAward, randBoss.data.singleDrop, count,
                        JSON.stringify([{type:consts.MAIL_PARAM_TYPE.CONFIG_VALUE,value:randBoss.data.BossName},{type:consts.MAIL_PARAM_TYPE.TRUE_VALUE,value:damage}]));
                    //   发现者的击杀奖励
                    var shareKillAward = dataApi.CommonParameter.getOptionValue('ShareKillAward', 0);
                    var friendNames = getFriendsName(randBoss.friendList);

                    self.sendMail(msg.friendId, shareKillAward, randBoss.data.allDrop,1,
                        JSON.stringify([{type:consts.MAIL_PARAM_TYPE.CONFIG_VALUE,value:randBoss.data.BossName},{type:consts.MAIL_PARAM_TYPE.TRUE_VALUE,value:friendNames}]));
                    //    参与者击杀奖励
                    randBoss.friendList.forEach(function (friendId) {
                        // if (friendId != session.get('playerId')) {
                            var assistKillAward = dataApi.CommonParameter.getOptionValue('AssistKillAward', 0);
                            self.sendMail(friendId, assistKillAward, randBoss.data.killAward,1,JSON.stringify([{type:consts.MAIL_PARAM_TYPE.CONFIG_VALUE,value:randBoss.data.BossName}]));
                        // }
                    });
                    player.emit("onActKillRandomBoss");
                    return next(null, {
                        code: Code.OK,
                        barrierRandBoss: randBoss.getClientInfo(),
                        // dieDrops: dieAward,
                        drops: awards.drops,
                        dropsCnt: awards.dropsCnt
                    });
                }
            });
        } else {
            var awards = randBoss.sendShareParticipateAward(player);
            return next(null, {
                code: Code.OK,
                barrierRandBoss: randBoss.getClientInfo(),
                drops: awards.drops,
                dropsCnt: awards.dropsCnt
            });
        }
    }else {
        if( tmpHp <= 0){
            randBossRecordDao.insert(randBoss.getData(),function (err,res) {
                if(err){
                    return next( null , {code:Code.FAIL});
                }else {
                    var dieAward = randBoss.sendDieAward(player);
                    var awards = randBoss.sendAward(player, currHp / 100000);

                    //   发现者的伤害奖励
                    if (randBoss.friendAtkHp>0){
                        var shareInjuredAward = dataApi.CommonParameter.getOptionValue('ShareInjuredAward', 0);
                        var count = randBoss.getAwardCount(randBoss.friendAtkHp / 100000);
                        self.sendMail(session.get('playerId'), shareInjuredAward, randBoss.data.singleDrop, count,
                            JSON.stringify([{type:consts.MAIL_PARAM_TYPE.CONFIG_VALUE,value:randBoss.data.BossName},{type:consts.MAIL_PARAM_TYPE.TRUE_VALUE,value:randBoss.friendAtkHp}]));
                    }

                    //    参与者击杀奖励
                    randBoss.friendList.forEach(function (friendId) {
                        if (friendId != session.get('playerId')) {
                            var assistKillAward = dataApi.CommonParameter.getOptionValue('AssistKillAward', 0);
                            self.sendMail(friendId, assistKillAward, randBoss.data.killAward,1,JSON.stringify([{type:consts.MAIL_PARAM_TYPE.CONFIG_VALUE,value:randBoss.data.BossName}]));
                        }
                    });

                    player.emit("onActKillRandomBoss");
                    return next( null, {
                        code: Code.OK,
                        barrierRandBoss:randBoss.getClientInfo(),
                        dieDrops:dieAward,
                        drops:awards.drops,
                        dropsCnt:awards.dropsCnt
                    });
                }
            })
        }else{
            var awards = randBoss.sendAward(player,currHp/100000);
            // player.set('challengeTicket', player.getMoneyByType(consts.MONEY_TYPE.CHALLENGE_TICKET) - randBoss.getNeedChallengeTicket() || 0);
            return next( null, {
                code: Code.OK,
                barrierRandBoss:randBoss.getClientInfo(),
                drops:awards.drops,
                dropsCnt:awards.dropsCnt
            });
        }
    }

};

//购买关卡商店物品
pro.buyBarrierPromote = function(msg, session, next){
    var player =  area.getPlayer(session.get('playerId'));
    var dropId = msg.dropId;
    var promote = player.barrierPromoteMgr.getPromote(msg.chapterId||0);
    if(!promote) return next(null, {code: Code.AREA.BARRIERPROMOTE_WITHOUT});
    var now =new Date();
    if(now.getTime() > promote.barrierPromoteEndTick || promote.drew===1){//已经过时了
        return next(null, {code: Code.AREA.BARRIERPROMOTE_TIMEOUT});
    }

    var barrierPromoteDropId = null;//[dropid, priceOld，price，priceType]
    for(var key in promote.barrierPromoteDropIds){
        if(dropId === promote.barrierPromoteDropIds[key].dropId){
            barrierPromoteDropId = promote.barrierPromoteDropIds[key];
            break;
        }
    }

    if(barrierPromoteDropId === null){
        return next(null, {code: Code.AREA.BARRIERPROMOTE_WITHOUT});
    }

    //判断货币是否足够
    if(!player.isEnoughSomeTypeMoney(barrierPromoteDropId.priceType,barrierPromoteDropId.price)){
        return next(null, {code: Code.AREA.LACK_MONEY});
    }

    player.barrierPromoteMgr.setDrew(msg.chapterId||0,1);
    var currDiamond = player.getMoneyByType( barrierPromoteDropId.priceType);
    player.setMoneyByType(barrierPromoteDropId.priceType,currDiamond - barrierPromoteDropId.price,flow.MONEY_FLOW_COST.BARRIERPROMOTE_BUY,msg.dropId);//这里采集掉落ID，策划商量过
    var drops = dropUtils.getDropItems(barrierPromoteDropId.dropId);
    return next(null, {code: Code.OK, drops:player.applyDrops(drops,null,flow.ITEM_FLOW.BUY_BARRIER_PROMOTE)});
}

//去除new标签
pro.removeBagNewFlag = function(msg, session, next){
    var player =  area.getPlayer(session.get('playerId'));
    if(msg.type === consts.BAG_TYPE.HERO){
        if(msg.slot instanceof Array){
            for(var i=0;i<msg.slot.length ;i++){
                player.heroBag.clearNew(msg.slot[i]);
            }
        }else{
            return next(null, {code: Code.FAIL});
        }
    }else if(msg.type === consts.BAG_TYPE.EQUIP){
        if(msg.slot instanceof Array){
            for(var i=0;i<msg.slot.length ;i++){
                player.equipBag.clearNew(msg.slot[i]);
            }
        }else{
            return next(null, {code: Code.FAIL});
        }
    }else{
        return next(null, {code: Code.FAIL});
    }
    return next(null, {code: Code.OK});
};
/**
 * 分享boss
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 */
pro.shareRandBoss = function (msg, session, next) {
    var player = area.getPlayer(session.get('playerId'));
    var randomBossId = msg.randomBossId;

    var randBoss = player.passedBarrierMgr.randBoss;

    //boss不存在
    if(!randBoss){
        return next(null, {code: Code.RANDBOSS.NOT_FOUND});
    }
    if(!randBoss.isHaveBoss()){
        return next(null, {code: Code.RANDBOSS.NOT_FOUND});
    }
    // 攻击一次才能分享
    if(randBoss.atkCnt<1){
        return next(null, {code: Code.RANDBOSS.CANT_SHARE});
    }

    // 攻击一次才能分享
    if(randBoss.hasShare==1){
        return next(null, {code: Code.RANDBOSS.HAS_SHARE});
    }

    randBoss.share();
    return next(null, {code: Code.OK});
};

/**
 * 可选包
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 */
pro.optionGift = function (msg, session, next) {
    //msg.giftItemId,msg.giftItems,msg.useItemId,msg.useItems
    var player = area.getPlayer(session.get('playerId'));

    function isItemsValid(items) {
        var itemsByPos = _.groupBy(items, 'pos');
        return _.every(itemsByPos, function (itemList) {
            return itemList.length === 1;
        });
    }

    function isSameItem(items,itemId){
        var tItem ;
        return _.every(items,function(item){
            tItem = player.bag.getItem(item.pos);
            if(!tItem) return false;
            return tItem.itemId === itemId;
        });
    }

    function enoughItem(items){
        var tItem ;
        return _.every(items,function(item){
            tItem = player.bag.getItem(item.pos);
            if(!tItem) return false;
            return (tItem.itemCount >= item.count);
        });
    }

    if(!(isItemsValid(msg.giftItems))){
        logger.error("参数形式非法1，msg=%j",msg);
        return next(null, {code: Code.FAIL});
    }else if(msg.useItemId !== 0){
        if(!isItemsValid(msg.useItems)){
            logger.error("参数形式非法2，msg=%j",msg);
            return next(null, {code: Code.FAIL});
        }
    }

    if(!(isSameItem(msg.giftItems,msg.giftItemId))){
        logger.error("消耗的物品id不一致1，msg=%j", msg);
        return next(null, {code: Code.FAIL});
    }else if(msg.useItemId !== 0){
        if(!isSameItem(msg.useItems,msg.useItemId)){
            logger.error("消耗的物品id不一致2，msg=%j", msg);
            return next(null, {code: Code.FAIL});
        }
    }

    if(!(enoughItem(msg.giftItems,msg.giftItemId))){
        logger.error("没有足够物品消耗1，msg=%j", msg);
        return next(null, {code: Code.FAIL});

    }else if(msg.useItemId !== 0){
        if(!enoughItem(msg.useItems,msg.useItemId)){
            logger.error("没有足够物品消耗2，msg=%j", msg);
            return next(null, {code: Code.FAIL});
        }
    }

    var itemData = dataApi.Items.findById(msg.giftItemId);
    if(!itemData){
        logger.error("配置表找不到，msg.giftItemId=%j",msg.giftItemId);
        return next(null, {code: Code.FAIL});
    }

    if(itemData.value !== msg.useItemId){
        logger.error("额外消耗的id不一致，msg=%j",msg);
        return next(null, {code: Code.FAIL});
    }
    var useItemTotalCnt = _.reduce(msg.useItems, function (memo, uItem){
        return memo + uItem.count;
    },0);
    var useGiftTotalCnt = _.reduce(msg.giftItems, function (memo, uItem){
        return memo + uItem.count;
    },0);
    if(msg.useItemId !== 0){
        if(useItemTotalCnt !== useGiftTotalCnt){
            logger.error("消耗数量不一致，msg=%j",msg);
            return next(null, {code: Code.FAIL});
        }
    }
    if(player.isBagFullVague()){
        return next(null, {code: Code.AREA.SOMEONE_BAG_FULL});
    }
    _.each(msg.giftItems,function(giftItem){
        player.bag.useItem(giftItem.pos, giftItem.count);
    });
    _.each(msg.useItems,function(useItem){
        player.bag.useItem(useItem.pos, useItem.count);
    });

    var dropId = utils.parseParams(itemData.factor, '#')[msg.index];
    var dropsItems = dropUtils.getDropItemsByCount(dropId,useGiftTotalCnt);
    var drops = player.applyDrops(dropsItems,null,flow.ITEM_FLOW.OPTION_GIFT);
    logger.debug("可选包掉落：dropId：%j,dropsItems:%j",dropId,dropsItems);
    return next(null, {code: Code.OK,drops:drops});
}
/**
 * 金币宝箱
 * @param msg
 * @param session
 * @param next
 */
pro.goldBox = function (msg, session, next) {
    var player = area.getPlayer(session.get('playerId'));
    var randList = dataUtils.getOptionList("MultipleCrit","#");
    var weigthList = dataUtils.getOptionList("CriticalStrikeChance","#");
    var requiredCostData = dataApi.RequiredCost.findById(player.moneyChangeCnt+1);
    var countLimit = dataUtils.getOptionValue("OpenNmuber",3);
    var needMoney = requiredCostData.diamondCost;

    if(!needMoney){
        return next(null, {code: Code.FAIL});
    }

    if(player.diamondCnt < needMoney){//钻石是否足够
        return next(null, {code: Code.DIAMOND_NUM_NOT_ENOUGH});
    }
    // 兑换次数不足
    if(player.moneyChangeCnt>countLimit){
        return next(null, {code: Code.AREA.GOLD_BOX_CNT_LIMIT});
    }

    // 暴击值
    var randomValue = dataUtils.getRandomValueByWeight(randList,weigthList);
    var newBarrierId =player.passedBarrierMgr.getNewBarrierId(consts.BARRIER_TYPE.NORMAL);
    var barrierData = dataApi.Custom.findById(newBarrierId);
    // 根据当前通关最新关卡获得金币
    var goldExchange = barrierData.goldExchange;
    var realGold = goldExchange * randomValue;
    // 钻石消耗
    player.setMoneyByType(consts.MONEY_TYPE.DIAMOND,player.diamondCnt-needMoney,flow.MONEY_FLOW_COST.GOLD_BOX_COST);
    //
    player.setMoneyByType(consts.MONEY_TYPE.GOLD,player.goldCnt+realGold,flow.MONEY_FLOW_GAIN.GOLD_BOX_GAIN);

    player.set('moneyChangeCnt',player.moneyChangeCnt+1);

    next(null,{code: Code.OK,luckyRewardRate:randomValue,buyTime:player.moneyChangeCnt});
}