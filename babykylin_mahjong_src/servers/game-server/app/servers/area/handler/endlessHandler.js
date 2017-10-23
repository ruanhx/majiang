/**
 * Created by kilua on 2016/7/20 0020.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts'),
    flow = require('../../../consts/flow'),
    dataApi = require('../../../util/dataApi'),
    dropUtils = require('../../../domain/area/dropUtils'),
    dataUtils = require('../../../util/dataUtils'),
    //endlessReportDao = require('../../../dao/endlessReportDao'),
    endlessPVPBoxDao = require('../../../dao/endlessPVPBoxDao');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;



/*
 *   进入战斗
 * */
pro.fight = function (msg, session, next) {
    logger.debug('fight playerId = %s, occasionId = %s', session.get('playerId'), msg.occasionId);
    var player = area.getPlayer(session.get('playerId')),
        occasionData = dataApi.EndlessType.findById(msg.occasionId);
    var updateCnt = true;
    if (!occasionData) {
        logger.error("赛事存在 赛事ID：%d",msg.occasionId);
        return next(null, {code: Code.AREA.NO_SUCH_OCCASION});
    }
    if (!player.funcOpen(Consts.FUNCTION.ENDLESS_MODE)) {
        return next(null, {code: Code.AREA.FUNC_DISABLED});
    }
    var occasion = player.occasionManager.getById(occasionData.id);
    if (occasion && occasion.dailyCnt >= occasionData.dayTimes + occasion.dailyBuyCnt) {
        //console.log("~~~~~~~~~~~~~~~~~~~~~~~~~occasion && occasion.dailyCnt >= occasionData.dayTimes + occasion.dailyBuyCnt");
        if(msg.itemPos){
            //console.log("使用物品%j",msg);
            if(occasionData.type !== Consts.ENDLESS_MODE.DIVISION){
                //console.error("战役类型错误%j",msg);
                return next(null, {code: Code.AREA.NO_OCCASION_TIMES});
            }
            //使用物品
            if(!msg.itemPos){
                //console.error("参数错误%j",msg);
                return next(null, {code: Code.AREA.NO_OCCASION_TIMES});//参数错误
            }
            var item = player.bag.getItem(msg.itemPos);
            if(!item) {
                //console.error("物品不存在%j",msg);
                return next(null, {code: Code.AREA.NO_OCCASION_TIMES});//物品不存在
            }
            if(item.itemId !== dataUtils.getOptionValue("EndlessDivisionTicket",0)){
                //console.error("物品使用不正确%j",msg);
                return next(null, {code: Code.AREA.NO_OCCASION_TIMES});//物品使用不正确
            }
            if(!player.bag.isItemEnough(msg.itemPos,1)){
                //console.error("物品数量不够%j",msg);
                return next(null, {code: Code.AREA.NO_OCCASION_TIMES});//物品数量不够
            }
            player.bag.useItem(msg.itemPos, 1);
            updateCnt = false;
        }else{
            //console.log("~~~~~~~~~~~~~~~~~~~~~~~~~不使用物品 %j",msg);
            return next(null, {code: Code.AREA.NO_OCCASION_TIMES});
        }
    }
    if (player.energy < occasionData.useEnergy) {
        return next(null, {code: Code.AREA.LACK_ENERGY});
    }
    if (player.getMoneyByType(occasionData.moneyType) < occasionData.moneyNum) {
        return next(null, {code: Code.AREA.LACK_MONEY});
    }
    if (!player.bag.isHasPosition()) {
        return next(null, {code: Code.AREA.NOT_ENOUGH_BAG_SLOTS});
    }
    if(this.isTimeLimit(occasionData.id)){
        return next(null, {code: Code.AREA.ENDLESS_TIME_LIMIT});
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

    function processCost(player, occasionData) {
        player.setMoneyByType(Consts.MONEY_TYPE.ENERGY, player.getMoneyByType(Consts.MONEY_TYPE.ENERGY) - occasionData.useEnergy,flow.MONEY_FLOW_COST.ENDLESS_MATCH_COST);
        player.setMoneyByType(occasionData.moneyType, player.getMoneyByType(occasionData.moneyType) - occasionData.moneyNum,flow.MONEY_FLOW_COST.ENDLESS_MATCH_COST);
        var effectBuffIds = player.buffManager.decreaseAll();
        if (occasionData.type === Consts.ENDLESS_MODE.SINGLE || occasionData.type === Consts.ENDLESS_MODE.DIVISION) {
            player.startSingleEndlessFight(occasionData.id, effectBuffIds);
        } else {
            // TODO:修改成就完成条件
            player.missionMgr.progressUpdate( Consts.MISSION_CONDITION_TYPE.PK_CNT );
            player.startEndlessPVPMatch(occasionData.id, effectBuffIds);
        }
        player.occasionManager.add(occasionData.id);
        if(updateCnt){
            player.occasionManager.updateDailyCnt(occasionData.id);
        }
    }

    var res = {code: Code.OK};

    /*
     * 战前标记是否可以获得英雄
     * */

    player.buffManager.setIsCanGetHero( player.isCanAddDailyEndlessHero() );

    player.oldEndlessSingleHighBarr = player.endlessSingleHighBarr;//记录战斗开始的时候无尽最高关卡
    var self = this;
    if (occasionData.type !== Consts.ENDLESS_MODE.SINGLE && occasionData.type !== Consts.ENDLESS_MODE.DIVISION)//世界竞技
    {
        if (msg.fightPlayerId){
            // 触发匹配
            return self.app.rpc.world.endlessRemote.acceptBattle(session, {
                playerId: player.id,
                occasionId: msg.occasionId,
                fightPlayerId:msg.fightPlayerId,
                power: player.getPower(),
                name: player.playername,
                fightHeroId: player.getFightHeroId(),
                fightPetId: player.getFightPetId(),
                scorePer: player.getScoreAdd(),
                maxWin: occasion ? occasion.maxWin : 0,
                maxLose: occasion ? occasion.maxLose : 0,
                boxDouble: player.getEndlessBoxAddDouble(),
                totalCnt: occasion ? occasion.totalCnt :0
            }, function (err, code) {
                if (code === Code.WORLD.ENDLESS_MATCH_START) {
                    // 开始匹配，系统保证匹配期间即使下线，也能匹配到，所以这里就可以扣除消耗了
                    processCost(player, occasionData);
                }
                next(null, {code: code});
            });
        }

        // 触发匹配
        return this.app.rpc.world.endlessRemote.match(session, {
            playerId: player.id,
            occasionId: msg.occasionId,
            power: player.getPower(),
            name: player.playername,
            fightHeroId: player.getFightHeroId(),
            fightPetId: player.getFightPetId(),
            scorePer: player.getScoreAdd(),
            maxWin: occasion ? occasion.maxWin : 0,
            maxLose: occasion ? occasion.maxLose : 0,
            boxDouble: player.getEndlessBoxAddDouble(),
            totalCnt: occasion ? occasion.totalCnt :0
        }, function (err, code) {
            if (code === Code.WORLD.ENDLESS_MATCH_START) {
                // 开始匹配，系统保证匹配期间即使下线，也能匹配到，所以这里就可以扣除消耗了
                processCost(player, occasionData);
            }
            next(null, {code: code});
        });
    }
    else//单人模式
    {
        // 触发匹配
        return this.app.rpc.world.endlessRemote.singlePvp(session, {
            playerId: player.id,
            occasionId: msg.occasionId,
            boxDouble: player.getEndlessBoxAddDouble()
        }, function (err, code) {
            if (code === Code.WORLD.ENDLESS_SINGLE_START) {
                // 开始匹配，系统保证匹配期间即使下线，也能匹配到，所以这里就可以扣除消耗了
                processCost(player, occasionData);
            }

            return  next(null, {code: Code.OK});
        });
    }
    return next(null, res);
};


/*
 *   单人模式挑战结束，提交结算
 * */
pro.commit = function (msg, session, next) {
    logger.debug('commit playerId = %s, score = %s ,  endlessSingleOldWave = %s , systemId = %s', session.get('playerId'), msg.score,msg.endlessSingleOldWave,msg.systemId);
    var player = area.getPlayer(session.get('playerId'));
    if (!player.singleEndlessFighting) {
        return next(null, {code: Code.AREA.NO_SINGLE_ENDLESS_FIGHTING});
    }
    if (player.singleEndlessCommitted) {
        logger.debug('commit already!playerId = %s', player.id);
        return next(null, {code: Code.FAIL});
    }
    // 根据战斗力校验积分
    var power = player.getPower();
    var scoreAdd = 1;
    player.effectBuffIds.forEach(function (buffId) {
        var buffData = dataApi.EndlessBuff.findById(buffId);
        if (buffData && buffData.effectType === Consts.ENDLESS_BUFF_EFFECT_TYPE.POWER) {
            power = power * (1+buffData.effectNum);
        }
        if (buffData && buffData.effectType === Consts.ENDLESS_BUFF_EFFECT_TYPE.SCORE) {
            scoreAdd += buffData.effectNum;
        }
    });
    var fightCheckData = Math.ceil(dataApi.EndlessPowerCheck.getLimitScore(power));
    var scoreCheck = Math.ceil(msg.score / scoreAdd);
    if (fightCheckData==0||fightCheckData<scoreCheck){
        logger.error('战斗力验证失败!playerId = %s limitScore = %s score = %s', player.id,fightCheckData,msg.score);
        return next(null, {code: Code.AREA.ENDLESS_SCORE_INVALID});
    }

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

    var orgHighScore = player.highScore;
    var systemId = msg.systemId || 0;
    //player.updateHighScore(msg.score);
    player.refreshEndlessSingleOldWave(msg.endlessSingleOldWave ||0);
    player.dataStatisticManager.refreshDailyEndlessData(Consts.ENDLESS_STTE.SINGLE,0);
    var randomInfo = player.randomShop.doNewShop( systemId ,player.oldEndlessSingleHighBarr);

    var dropIds = dataUtils.getDropsBySystemId(systemId);
    var dropsSystemIdAwards = dropUtils.getDropItemsByDropIndexs(dropIds);
    logger.debug("触发段位逻辑--前置log msg：%j",msg);

    //段位判断逻辑
    if(msg.occasionId){//兼容旧版本
        logger.debug("触发段位逻辑 msg.divScore：%d",msg.divScore);
        var occasionData = dataApi.EndlessType.findById(msg.occasionId);
        if(occasionData.type === Consts.ENDLESS_MODE.DIVISION){
            player.divisionPersonMgr.updateDivScore(session,msg.divScore,msg.score);
            player.missionMgr.progressUpdate( Consts.MISSION_CONDITION_TYPE.FINISH_DIVISION );

        }
    }

    this.app.rpc.world.endlessRemote.updateScoreRankingList(session, {
        playerId: player.id,
        score: msg.score,
        noUpdate:true//有这个字段说明不没用更新排行榜
    }, function (res,totalRec) {
        if(totalRec){
            player.emit('onActEndlessRankChange',totalRec.rank||0);
        }
        // 根据得分计算宝箱奖励
        var occasionData = dataApi.EndlessType.findById(player.singleEndlessOccasionId);
        if (!occasionData) {
            return next(null, {code: Code.AREA.NO_SUCH_OCCASION});
        }
        var smallerMax = dataApi.EndlessScoreBox.getSmallerMaxByScore(occasionData.scoreRewardId, msg.score),
            response = {code: Code.OK, highScore: orgHighScore, weekRank: res.weekRank};
        if (!smallerMax) {
            response.randomInfo = randomInfo;
            response.systemIdAwards =  player.applyDrops(dropsSystemIdAwards,null,flow.ITEM_FLOW.ENDLESS_SINGLE);
            return next(null, response);
        }

        var dropDouble = player.activityMgr.getFightDropdDouble(Consts.FIGHT_TYPE.ENDLESS);

        // 考虑购买的加成
        var dropId = smallerMax.dropId,
            awards = [],
            addBoxDouble = player.getEndlessBoxAddDouble(player.effectBuffIds),
            num =( smallerMax.num * (1 + addBoxDouble) ) * dropDouble;
        // 为了允许再开一次宝箱，不能在这里结束
        //player.stopSingleEndlessFight();
        player.setSingleEndlessCommitted(true, msg.score);

        _.range(num).forEach(function () {
            var drops = player.buffManager.getAward( dropId , num);//by fisher  需要每次不一样
            awards.push({awards:  player.applyDrops(drops,null,flow.ITEM_FLOW.ENDLESS_SINGLE) });
        });
        response.awards = awards;
        response.activityDropDouble = dropDouble;
        response.randomInfo = randomInfo;
        response.systemIdAwards =  player.applyDrops(dropsSystemIdAwards,null,flow.ITEM_FLOW.ENDLESS_SINGLE);

        return next(null, response);
    });

};


/*
 *   无尽PVP开宝箱，上线时调用，以检查离线期间是否有宝箱要开
 * */
pro.openBox = function (msg, session, next) {
    logger.debug('openBox playerId = %s', session.get('playerId'));
    var player = area.getPlayer(session.get('playerId'));
    if(!player.endlessPVPBoxMgr.hasBox()) return next(null, {code: Code.FAIL});
    var box = player.endlessPVPBoxMgr.getBoxData();
    if(player.endlessPVPBoxMgr.isDrew()) return next(null, {code: Code.AREA.ENDLESS_BOX_EVER_DREW});
    player.endlessPVPBoxMgr.setDrew();
    // 附带的更新下历史最高得分
    player.updateHighScore(box.score);
    // 根据得分计算宝箱奖励
    var occasionData = dataApi.EndlessType.findById(box.occasionId);
    if (!occasionData) {
        return next(null, {code: Code.AREA.NO_SUCH_OCCASION});
    }
    var smallerMax = dataApi.EndlessScoreBox.getSmallerMaxByScore(occasionData.scoreRewardId, box.score);
    if (!smallerMax) {
        logger.debug('openBox [EndlessScoreBox] data not found!scoreRewardId = %s, score = %s', occasionData.scoreRewardId, box.score);
        return next(null, {code: Code.OK, awards: [], occasionId: box.occasionId});
    }
    var dropDouble = player.activityMgr.getFightDropdDouble(Consts.FIGHT_TYPE.ENDLESS);
    // 考虑购买的加成
    var dropId = smallerMax.dropId,
        awards = [],
        addBoxDouble = box.boxDouble,
        num = (smallerMax.num * (1 + addBoxDouble) ) * dropDouble;

    //var drops = player.buffManager.getAward( dropId , num);
    _.range(num).forEach(function () {
        var drops = player.buffManager.getAward( dropId , num);
        awards.push({awards:  player.applyDrops(drops,null,flow.ITEM_FLOW.ENDLESS_OPEN_BOX)});
    });

    var dropIds = dataUtils.getDropsBySystemId(box.systemId);
    var dropsSystemIdAwards = dropUtils.getDropItemsByDropIndexs(dropIds);
    var systemIdAwards =  player.applyDrops(dropsSystemIdAwards,null,flow.ITEM_FLOW.ENDLESS_OPEN_BOX);
    next(null, {code: Code.OK, awards: awards, occasionId: box.occasionId , activityDropDouble:dropDouble,systemIdAwards:systemIdAwards});

};

/*
* 再开一个宝箱信息包
* */
pro.reopenBox = function (msg, session, next) {
    logger.debug('reopenBox playerId = %s, occasionId = %s', session.get('playerId'), msg.occasionId);
    // 检查是否战斗中
    var occasionData = dataApi.EndlessType.findById(msg.occasionId);
    if (!occasionData) {
        return next(null, {code: Code.AREA.NO_SUCH_OCCASION});
    }
    var player = area.getPlayer(session.get('playerId'));
    if (occasionData.type === Consts.ENDLESS_MODE.SINGLE || occasionData.type === Consts.ENDLESS_MODE.DIVISION) {
        if (player.singleEndlessOccasionId !== msg.occasionId) {
            logger.debug('reopenBox not in occasion id = %s', msg.occasionId);
            return next(null, {code: Code.FAIL});
        }
        // 单人模式
        if (!player.singleEndlessFighting) {
            return next(null, {code: Code.AREA.NO_SINGLE_ENDLESS_FIGHTING});
        }
        if (!player.singleEndlessCommitted) {
            logger.debug('reopenBox not committed yet!');
            return next(null, {code: Code.AREA.SINGLE_ENDLESS_NOT_COMMITTED});
        }
        // 检查是否重开过
        if (player.singleReopenBoxCnt > 0) {
            logger.debug('reopenBox ever reopen already!');
            return next(null, {code: Code.AREA.ENDLESS_BOX_EVER_REOPEN});
        }
        // 检查钻石是否足够
        var smallerMax = dataApi.EndlessScoreBox.getSmallerMaxByScore(occasionData.scoreRewardId, player.singleEndlessScore);
        if (!smallerMax) {
            logger.debug('reopenBox [EndlessScoreBox] data not found!scoreRewardId = %s, score = %s', occasionData.scoreRewardId, player.singleEndlessScore);
            return next(null, {code: Code.OK});
        }
        if (player.diamondCnt < smallerMax.price) {
            return next(null, {code: Code.DIAMOND_NUM_NOT_ENOUGH});
        }
        // 扣除钻石
        var moneyType = Consts.MONEY_TYPE.DIAMOND;
        player.setMoneyByType(moneyType, player.getMoneyByType(moneyType) - smallerMax.price,flow.MONEY_FLOW_COST.ENDLESS_REOPEN_BOX);
        // 累计重开次数
        player.increaseReopenBoxCnt();
        player.stopSingleEndlessFight();
        // 给与掉落
        // 考虑购买的加成
        var dropDouble = player.activityMgr.getFightDropdDouble(Consts.FIGHT_TYPE.ENDLESS);
        var dropId = smallerMax.dropId,
            awards = [],
            addBoxDouble = player.getEndlessBoxAddDouble(player.effectBuffIds),
            num =( smallerMax.num * (1 + addBoxDouble) ) * dropDouble;

        //var drops = player.buffManager.getAward( dropId , num);
        _.range(num).forEach(function () {
            var drops = player.buffManager.getAward( dropId , num);
            awards.push({awards:  player.applyDrops(drops,null,flow.ITEM_FLOW.ENDLESS_REOPEN_BOX)});
        });
        // 下发掉落
        return next(null, {code: Code.OK, awards: awards});
    } else {
        // PVP模式
        // RPC检查状态,返回重开次数和得分
        var self = this;
        if(!player.endlessPVPBoxMgr.hasBox()) return next(null, {code: Code.FAIL});
        var box = player.endlessPVPBoxMgr.getBoxData();
        if (!!box && !!box.reopenCnt && box.reopenCnt > 0) {
            return next(null, {code: Code.AREA.ENDLESS_BOX_EVER_REOPEN});
        }
        // 检查钻石
        var score = (!!box && box.score) || 0,
            smallerMax = dataApi.EndlessScoreBox.getSmallerMaxByScore(occasionData.scoreRewardId, score);
        if (!smallerMax) {
            logger.debug('reopenBox [EndlessScoreBox] data not found!scoreRewardId = %s, score = %s', occasionData.scoreRewardId, score);
            return next(null, {code: Code.OK, awards: []});
        }
        if (player.diamondCnt < smallerMax.price) {
            return next(null, {code: Code.DIAMOND_NUM_NOT_ENOUGH});
        }
        player.endlessPVPBoxMgr.setReopenCnt();
        // 扣除钻石
        var moneyType = Consts.MONEY_TYPE.DIAMOND;
        player.setMoneyByType(moneyType, player.getMoneyByType(moneyType) - smallerMax.price,flow.MONEY_FLOW_COST.ENDLESS_REOPEN_BOX);
        // 给与掉落，考虑购买的加成
        var dropId = smallerMax.dropId,
            awards = [],
            //addBoxDouble = player.getEndlessBoxAddDouble(player.endlessPVPEffectBuffIds),
            num = smallerMax.num; //* (1 + addBoxDouble);

        // var drops = player.buffManager.getAward( dropId , num);
        _.range(num).forEach(function () {
            var drops = player.buffManager.getAward( dropId , num);
            awards.push({awards:  player.applyDrops(drops,null,flow.ITEM_FLOW.ENDLESS_REOPEN_BOX)});
        });
        // 下发掉落
        return next(null, {code: Code.OK, awards: awards});
    }
};

/*
 *   查看赛事
 * */
pro.viewOccasion = function (msg, session, next) {
    logger.debug('viewOccasion playerId = %s, mode = %s', session.get('playerId'), msg.mode);
    var occasionDatas = dataApi.EndlessType.findByIndex({type: msg.mode}),
        player = area.getPlayer(session.get('playerId'));
    if (!_.isArray(occasionDatas)) {
        occasionDatas = [occasionDatas];
    }
    var occasions = [];
    occasionDatas.forEach(function (occasionData) {
        var myOccasion = player.occasionManager.getById(occasionData.id),
            dailyCnt = myOccasion ? myOccasion.dailyCnt : 0;
        occasions.push({
            occasionId: occasionData.id,
            dailyCnt: dailyCnt,
            winAwards: dropUtils.getDropItems(occasionData.winDropId),
            presentAwards: dropUtils.getDropItems(occasionData.giveDropId)
        });
    });
    // 按id升序排列
    occasions.sort(function (a, b) {
        return a.occasionId - b.occasionId;
    });
    this.app.rpc.world.endlessRemote.getReportsCnt(session,{playerId:player.id,drew:0},function(cnt){
        return next(null, {code: Code.OK, mode: msg.mode, occasions: occasions, showReportRedSpot: (cnt > 0) ? 1 : 0});
    });
};

/*
 *   查看赛果
 * */
pro.viewReports = function (msg, session, next) {
    logger.debug('viewReports playerId = %s', session.get('playerId'));
    var player = area.getPlayer(session.get('playerId'));
    this.app.rpc.world.endlessRemote.getEndlessReport(session,player.id,function(reports){
            var clientReports = [];
            reports.forEach(function (report) {
                clientReports.push({
                    endlessId: report.endlessId,
                    result: report.result,
                    heroId: report.curHeroId,
                    otherHeroId: report.otherHeroId,
                    otherName: report.otherName,
                    score: report.score,
                    recTime: report.recTime,
                    drew: report.drew,
                    otherScore: report.otherScore,
                    otherPlayerId : report.otherPlayerId,
                    fightBfRank :  report.fightBfRank,
                    fightBfWeekRank :  report.fightBfWeekRank,
                    isDouble : report.isDouble
                });
            });
            clientReports.sort(function (a, b) {
                if (a.drew === b.drew) {
                    // 再按事件排序，新的在前
                    return b.recTime - a.recTime;
                } else {
                    // 先按已领取、为领取的顺序排序
                    return (a.drew - b.drew);
                }
            });
            return next(null, {code: Code.OK, reports: clientReports});
        //}
    });
};

/*
 *   领取赛果奖励
 * */
pro.drawAwards = function (msg, session, next) {
    logger.debug('drawAwards playerId = %s, endlessId = %s', session.get('playerId'), msg.endlessId);
    var player = area.getPlayer(session.get('playerId'));
    var self = this;
    self.app.rpc.world.endlessRemote.getEndlessReport(session,player.id,function(reports){
        var reportsByEndlessId = _.indexBy(reports, 'endlessId'),
            report = reportsByEndlessId[msg.endlessId];
        if (!report) {
            return next(null, {code: Code.AREA.NO_SUCH_ENDLESS_REPORT});
        }
        if (report.drew) {
            return next(null, {code: Code.AREA.ENDLESS_AWARDS_DREW});
        }
        self.app.rpc.world.endlessRemote.setDrew(session,{playerId:player.id,endlessId:report.endlessId}, function (success){
            if (success) {
                // 确认标志修改成功再给奖励
                var awards = player.applyEndlessReport(report);
                return next(null, {
                    code: Code.OK, presentAwards: awards.presentAwards, winAwards: awards.winAwards,
                    otherPresentAwards: awards.otherPresentAwards, otherWinAwards: awards.otherWinAwards
                });
            } else {
                logger.debug('drawAwards failed!');
                return next(null, {code: Code.AREA.ENDLESS_AWARDS_DREW});
            }
        });
    });
};
/*
 *   无尽模式中复活
 * */
pro.revive = function (msg, session, next) {
    logger.debug('revive playerId = %s, occasionId = %s', session.get('playerId'), msg.occasionId);
    var occasionData = dataApi.EndlessType.findById(msg.occasionId);
    if (!occasionData) {
        return next(null, {code: Code.AREA.NO_SUCH_OCCASION});
    }
    var player = area.getPlayer(session.get('playerId')),
        maxRevive = dataUtils.getOptionValue('Endless_ReliveTimes', 2);
    if (occasionData.type !== Consts.ENDLESS_MODE.SINGLE && occasionData.type !== Consts.ENDLESS_MODE.DIVISION) {
        var self = this;
        this.app.rpc.world.endlessRemote.getReviveCnt(session, {playerId: player.id}, function (errCode, reviveCnt) {
            if (errCode !== Code.OK) {
                return next(null, {code: errCode});
            }
            if (reviveCnt >= maxRevive) {
                return next(null, {code: Code.AREA.NO_ENDLESS_REVIVE_CNT});
            }
            var cost = dataUtils.getOptionListValueByIndex('Endless_ReliveCost', reviveCnt, '#');
            if (player.diamondCnt < cost) {
                return next(null, {code: Code.DIAMOND_NUM_NOT_ENOUGH});
            }
            self.app.rpc.world.endlessRemote.increaseReviveCnt(session, {playerId: player.id}, function (errCode) {
                if (errCode === Code.OK) {
                    player.setMoneyByType(Consts.MONEY_TYPE.DIAMOND, player.diamondCnt - cost,flow.MONEY_FLOW_COST.FIGHT_RESURRECTION);
                }
                return next(null, {code: errCode, reviveCnt: reviveCnt + 1});
            });
        });
    } else {
        // 单人模式
        if (!player.singleEndlessFighting) {
            return next(null, {code: Code.AREA.NO_SINGLE_ENDLESS_FIGHTING});
        }
        if (player.singleEndlessReviveCnt >= maxRevive) {
            return next(null, {code: Code.AREA.NO_ENDLESS_REVIVE_CNT});
        }
        var cost = dataUtils.getOptionListValueByIndex('Endless_ReliveCost', player.singleEndlessReviveCnt, '#');
        if (player.diamondCnt < cost) {
            return next(null, {code: Code.DIAMOND_NUM_NOT_ENOUGH});
        }
        player.increaseSingleEndlessReviveCnt();
        player.setMoneyByType(Consts.MONEY_TYPE.DIAMOND, player.diamondCnt - cost,flow.MONEY_FLOW_COST.FIGHT_RESURRECTION);
        return next(null, {code: Code.OK, reviveCnt: player.singleEndlessReviveCnt});
    }
};

/**
 * 获取段位模块的相关信息
 * @param msg
 * @param session
 * @param next
 */
pro.getDivisionInfo = function(msg, session, next){
    var player = area.getPlayer(session.get('playerId'));
    player.divisionPersonMgr.getDivisionInfo(session,function(opponentList,playerInfo){
        //logger.debug("获取段位模块的相关信息 playerInfo：%j",playerInfo);
        var rs = {code: Code.OK,opponents:opponentList,division:playerInfo.divisionId||1,divScore:playerInfo.divScore||0,highDivision:playerInfo.highDivision||1,refreshCnt:playerInfo.refreshCnt};
        //logger.debug("获取段位模块的相关信息 返回值：%j",rs);
        return next(null, rs);
    });
}

/**
 * 刷新段位对手对手
 * @param msg
 * @param session
 * @param next
 */
pro.refreshDivisionOpponent = function(msg, session, next){
    var player = area.getPlayer(session.get('playerId'));
    var cost = dataUtils.getOptionValue("EndlessDivisionRenewDiamond",1);
    if(msg.type == 1){
        cost = 0;
        if(!player.divisionPersonMgr.canFreeRefresh()){
            logger.debug("段位对手刷新次数已经用完");
            return next(null, {code: Code.FAIL});
        }
    }
    if (player.diamondCnt < cost) {
        return next(null, {code: Code.DIAMOND_NUM_NOT_ENOUGH});
    }
    player.divisionPersonMgr.refreshOpponentList(session,function(opponentList){
        if(cost!=0)
            player.setMoneyByType(Consts.MONEY_TYPE.DIAMOND, player.diamondCnt - cost,flow.MONEY_FLOW_COST.REFRESH_DIVISION_OPPONENT);
        return next(null, {code: Code.OK,opponents:opponentList,refreshCnt:player.divisionPersonMgr.getRefreshCnt()});
    });
}

pro.buyCount = function(msg, session, next){
    //logger.debug("收到无尽购买次数请求 buyCount");
    var player = area.getPlayer(session.get('playerId'));
    var occasionData = dataApi.EndlessType.findById(msg.occasionId);
    var occasion = player.occasionManager.getById(occasionData.id);
    if(occasion.dailyBuyCnt+1<=occasionData.buyTimes){
        var cost = 0;
        if(occasion.dailyBuyCnt+1 >= occasionData.buyPrice.length){
            cost = occasionData.buyPrice[occasionData.buyPrice.length-1];
        }else{
            cost = occasionData.buyPrice[occasion.dailyBuyCnt];
        }
        if(player.diamondCnt<cost){
            logger.debug("buyCount 没钱");
            //没钱
            return next(null, {code: Code.AREA.LACK_MONEY});
        }
        player.setMoneyByType(Consts.MONEY_TYPE.DIAMOND, player.diamondCnt - cost,flow.MONEY_FLOW_COST.DIVISION_BUY_CNT);
        occasion.setDailyBuyCnt(occasion.dailyBuyCnt+1);
    }else{
        logger.debug("buyCount 购买次数上限");
        //购买上限
        return next(null, {code: Code.AREA.BUY_COUNT_NO});
    }

    return next(null, {code: Code.OK});
}

pro.isTimeLimit = function( id ){
    var dateTime = new Date( Date.now() );
    var currTime = parseInt(dateTime.getHours()) + dateTime.getMinutes()/60;
    var data = dataApi.EndlessType.findById(id);
    if(data.type !=2){
        return false;
    }
    var timeRange = data.openTime.split('#');
    var tempRange = data.openLastTime.split('#');
    var tempTime = parseInt(tempRange[0])+tempRange[1]/60;
    var needTime = parseInt(timeRange[0])+timeRange[1]/60;
    var isLimit =currTime <needTime || currTime>= (needTime+tempTime);
    return isLimit;
};