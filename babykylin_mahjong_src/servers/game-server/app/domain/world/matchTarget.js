/**
 * Created by kilua on 2016/7/24 0024.
 * 匹配成功的对手
 */

var util = require('util'),
    pomelo = require('pomelo');
    EventEmitter = require('events').EventEmitter;

var _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename),
    uuid = require('node-uuid');

var playerManager = require('./playerManager'),
    playerMiniData = require('./playerMiniData'),
    dataUtils = require('../../util/dataUtils'),
    dataApi = require('../../util/dataApi'),
    dropUtils = require('../area/dropUtils'),
    ai = require('./ai'),
    Code = require('../../../shared/code'),
    Consts = require('../../consts/consts'),
    endlessPVPBoxSync = require('../../dao/mapping/endlessPVPBoxSync'),
    endlessReport = require('./endlessReport').get(),
    scoreRankingList = require('../world/scoreRankingList'),
    endlessPVPBoxDao = require('../../dao/endlessPVPBoxDao');

var MatchBase = function (opts, endlessId, occasionId) {
    EventEmitter.call(this);
    this.endlessId = endlessId;
    this.playerId = opts.playerId;
    this.name = opts.name;
    this.fightHeroId = opts.fightHeroId;
    this.fightPetId = opts.fightPetId || 0;
    this.power = opts.power;
    this.scorePer = opts.scorePer;
    this.occasionId = occasionId;
    // 乱斗道具
    this.meleeItem = {};
    this.score = 0;
    this.systemId = 0;
    this.end = false;
};

util.inherits(MatchBase, EventEmitter);

var pro = MatchBase.prototype;

//是否为机器人
pro.isRobot = function () {
    return !this.playerId;
};

pro.isEnd = function () {
    return this.end;
};
/**
 *  使用乱斗道具
 * @param pos 道具的位置
 */
pro.useMeleeItem = function (pos) {
    var item = this.meleeItem[pos];
    if(!item){
        return null;
    }
    delete this.meleeItem[pos];
    return item;
};
/**
 * 设置乱斗道具
 * @param pos
 * @param itemId
 */
pro.setMeleeItem = function (pos,itemId) {
    this.meleeItem[pos] = itemId;
};

pro.setEnd = function (end) {
    this.end = end;
    this.endTime = Date.now();
    this.emit('end', this);
};

pro.forceEnd = function () {
    this.setEnd(true);
};

pro.getInfo = function () {
    return {
        playerId: this.playerId,
        name: this.name,
        fightHeroId: this.fightHeroId,
        fightPetId: this.fightPetId,
        power: this.power,
        scorePer: this.scorePer
    };
};

pro.getEndlessLoadingPercent = function () {
    return this.endlessLoadingPercent || 0;
};

pro.updateLoadingPercent = function (percent) {
    this.endlessLoadingPercent = percent;
    this.emit('onLoadingPercentChanged', this);
};

pro.pushMsgToClient = function (route, msg) {
    // 子类实现
    console.warn('pushMsgToClient not implemented yet!');
};

pro.destroy = function () {
    // 子类实现
};

pro.updateScore = function (score,systemId) {
    this.score = score;
    this.systemId = systemId || 0;
    console.log('updateScore playerId = %s, score = %s', this.playerId, this.score);
};

pro.getScore = function () {
    return this.score;
};

pro.getSystemId = function () {
    return this.systemId;
};

pro.getScorePer = function () {
    return this.scorePer;
};

pro.getFinalScore = function (playerScore) {
    return this.score;
};

var MatchRobot = function (opts, endlessId, occasionId) {
    MatchBase.call(this, opts, endlessId, occasionId);
    this.isAIAdvantage = opts.isAIAdvantage;
    this.result = opts.result;
    this.failBattleId = opts.failBattleId;
    this.familyName = opts.familyName;
    var self = this;
    this.loadingTimer = setTimeout(function () {
        clearTimeout(self.loadingTimer);
        self.loadingTimer = null;
        console.log('robot loading finish!');
        self.updateLoadingPercent(100);
    }, dataUtils.getOptionValue('Endless_AiLoadingTime', 1) * 1000);
    this.on('startBattle', this.onStartBattle.bind(this));
};

util.inherits(MatchRobot, MatchBase);

MatchRobot.prototype.getIsAIAdvantage = function () {
    return this.isAIAdvantage;
};

MatchRobot.prototype.setEndTimer = function () {
    // 在确定AI积分超过玩家后，随机（5秒~15秒）后结束，这期间，AI的分数继续刷。
    var endTimeRange = dataUtils.getRangeOption('Endless_GoodAiEndTime'),
        self = this;
    this.endTimer = setTimeout(function () {
        clearTimeout(self.endTimer);
        self.endTimer = null;
        self.setEnd(true);
    }, _.random(endTimeRange.low * 1000, endTimeRange.high * 1000));
};


/*
 *   计算AI得分
 * */
MatchRobot.prototype.getRndScore = function (otherPlayerScore) {
    var scorePercentRange, score, guaranteeRange;
    if (this.isAIAdvantage) {
        scorePercentRange = dataUtils.getRangeOption('Endless_GoodAiScoreRange01');
        guaranteeRange = dataUtils.getRangeOption('Endless_GoodAiScoreRange02');
    } else {
        scorePercentRange = dataUtils.getRangeOption('Endless_BadAiScoreRange01');
        guaranteeRange = dataUtils.getRangeOption('Endless_BadAiScoreRange02');
    }
    score = _.random(Math.ceil(scorePercentRange.low * otherPlayerScore), Math.ceil(scorePercentRange.high * otherPlayerScore));
    if (score < this.getScore()) {
        //上次得分 + 随机（100，300）*（1+AI得分加成比例 ）
        return this.getScore() + _.random(guaranteeRange.low, guaranteeRange.high) * (1 + this.getScorePer());
    }
    return score;
};

//MatchRobot.prototype.setEnd = function (end) {
//    MatchBase.prototype.setEnd.call(this, end);
//    if (end && this.updateScoreTimer) {
//        // 结束的同时停止更新得分的定时器
//        clearTimeout(this.updateScoreTimer);
//        this.updateScoreTimer = null;
//    }
//};

MatchRobot.prototype.onStartBattle = function () {
    // AI的得分刷新时间点为：上次刷新后2~4秒随机
    //var self = this,
    //    timeRange = dataUtils.getRangeOption('Endless_AiScoreAddTime');
    //this.updateScoreTimer = setTimeout(function updateCb() {
    //    clearTimeout(self.updateScoreTimer);
    //    self.updateScoreTimer = null;
    //    // 刷新得分
    //    self.emit('updateScore', self);
    //    self.updateScoreTimer = setTimeout(updateCb, _.random(timeRange.low * 1000, timeRange.high * 1000))
    //}, _.random(timeRange.low * 1000, timeRange.high * 1000));
};

MatchRobot.prototype.destroy = function () {
    if (this.loadingTimer) {
        clearTimeout(this.loadingTimer);
        this.loadingTimer = null;
    }
    if (this.updateScoreTimer) {
        clearTimeout(this.updateScoreTimer);
        this.updateScoreTimer = null;
    }
    if (this.endTimer) {
        clearTimeout(this.endTimer);
        this.endTimer = null;
    }
};

MatchRobot.prototype.pushMsgToClient = function (route, msg) {
    console.log('pushMsgToClient simulate send msg route = %s, msg = %j', route, msg);
    if (route === 'endless.startBattle') {
        this.emit('startBattle');
    }
};

MatchRobot.prototype.getInfo = function () {
    var info = MatchBase.prototype.getInfo.call(this);
    info.result = this.result ? 1 : 0;
    info.failBattleId = this.failBattleId;
    info.isRobot = 1;
    info.familyName = this.familyName;
    return info;
};

/*
 *   AI预期赢的情况下，修正AI最终得分
 * */
MatchRobot.prototype.getFinalScore = function (playerScore) {
    if (!this.result) {
        // 玩家输
        if (this.score < playerScore) {
            var rangeOp = dataUtils.getRangeOption('Endless_WinAiScore02');
            return Math.ceil(playerScore * (Math.random() * (rangeOp.high - (rangeOp.low)) + rangeOp.low));
        }
    }
    return this.score;
};

var MatchPlayer = function (opts, endlessId, occasionId) {
    MatchBase.call(this, opts, endlessId, occasionId);
    this.reviveCnt = 0;
    this.reopenBoxCnt = 0;
    this.boxDouble = opts.boxDouble;
    var curPlayer = playerManager.get().getPlayer(this.playerId);
    if (!curPlayer) {
        this.forceEnd();
    }
};

util.inherits(MatchPlayer, MatchBase);

MatchPlayer.prototype.getReopenBoxCnt = function () {
    return this.reopenBoxCnt;
};

MatchPlayer.prototype.increaseReopenBoxCnt = function () {
    this.reopenBoxCnt += 1;
    this.pushMsgToClient('endless.updateReopenBoxCnt', {reopenBoxCnt: this.reopenBoxCnt});
};

MatchPlayer.prototype.getReviveCnt = function () {
    return this.reviveCnt;
};

MatchPlayer.prototype.increaseReviveCnt = function () {
    this.reviveCnt += 1;
    this.pushMsgToClient('endless.updateReviveCnt', {reviveCnt: this.reviveCnt});
};

MatchPlayer.prototype.getInfo = function () {
    var info = MatchBase.prototype.getInfo.call(this);
    info.reviveCnt = this.reviveCnt;
    return info;
};

MatchPlayer.prototype.destroy = function () {
    // 子类实现
};

MatchPlayer.prototype.pushMsgToClient = function (route, msg) {
    var curPlayer = playerManager.get().getPlayer(this.playerId);
    // 下线再上的，没有endlessPair，不推送给他
    if (curPlayer && (!!curPlayer.endlessPair || route === 'endless.matchSuccess'|| route === 'endless.evaluate')) {
        // 在线，则推送，不在线直接忽略
        curPlayer.pushMsgToClient(route, msg);
    }
};

MatchPlayer.prototype.leave = function () {
    this.forceEnd();
};

pro.forceEnd = function () {
    this.setEnd(true);
    // 战斗验证
    // 根据战斗力校验积分
        var miniData = playerMiniData.getInstance().getPlayerById(this.playerId);
        var power = miniData.highPower;
        var scoreAdd = 1;
        var self = this;
        pomelo.app.rpc.area.playerRemote.getPlayerEndlessBuff("*",{playerId:this.playerId},function (err,res) {
            if(res){
                res.forEach(function (buffId) {
                    var buffData = dataApi.EndlessBuff.findById(buffId);
                    Consts.ENDLESS_BUFF_EFFECT_TYPE.AWARD
                    if (buffData && buffData.effectType === Consts.ENDLESS_BUFF_EFFECT_TYPE.POWER) {
                        power = power * (1+buffData.effectNum);
                    }
                    if (buffData && buffData.effectType === Consts.ENDLESS_BUFF_EFFECT_TYPE.SCORE) {
                        scoreAdd += buffData.effectNum;
                    }
                });
            }
            var fightCheckData = Math.ceil(dataApi.EndlessPowerCheck.getLimitScore(power));
            var scoreCheck = Math.ceil(self.getScore() / scoreAdd);
            if (fightCheckData==0||fightCheckData<scoreCheck){
                logger.error('战斗力验证失败!playerId = %s limitScore = %s score = %s', self.playerId,fightCheckData,self.getScore());
                return ;
            }

            scoreRankingList.getScoreRankingList().update({
                id: self.playerId,
                playerId: self.playerId,
                score: self.getScore(),
                rankType:Consts.RANKING_TYPE.TOTAL
            });
            scoreRankingList.getWeekScoreRankingList().update({
                id: self.playerId,
                playerId: self.playerId,
                score: self.getScore(),
                rankType:Consts.RANKING_TYPE.WEEK
            });
        });


    var savePVPBoxData = this.getPVPBoxData(this.occasionId);
    //endlessPVPBoxDao.save(savePVPBoxData, null);
    var player = playerManager.get().getPlayer(self.playerId);
    if(player){
        player.areaRpc('endlessRemote', 'saveEndlessPVPBox',savePVPBoxData,function(err,success){});
    }else {
        endlessPVPBoxSync.save(pomelo.app.get('dbclient'),savePVPBoxData, function () {

        });
    }
};

MatchPlayer.prototype.getPVPBoxData = function (occasionId) {
    return {
        endlessId: this.endlessId,
        playerId: this.playerId,
        occasionId: occasionId,
        score: this.getScore(),
        drew: 0,
        reopenCnt: 0,
        boxDouble: this.boxDouble,
        systemId : this.getSystemId()
    };
};

var createMatchTarget = function (targetInfo, endlessId, occasionId) {
    var target;
    if (targetInfo.playerId) {
        target = new MatchPlayer(targetInfo, endlessId, occasionId);
    } else {
        target = new MatchRobot(targetInfo, endlessId, occasionId);
    }
    return target;
};

var MatchPair = function (a, b, occasionId) {
    this.endlessId = uuid.v1();
    var playerA = createMatchTarget(a, this.endlessId, occasionId),
        playerB = createMatchTarget(b, this.endlessId, occasionId);
    this.players = [playerA, playerB];
    this.playersById = {};
    this.playersById[playerA.playerId] = playerA;
    this.playersById[playerB.playerId] = playerB;
    this.occasionId = occasionId;
    this.evaluated = false;
    this.isLoadTimeout = false;
    this.fightBfRank = a.fightBfRank || 0;
    // 无尽前几次和机器人战斗不记录连胜
    this.isRobotFight = a.isRobotFight || 0;
    this.fightBfWeekRank = a.fightBfWeekRank || 0;
    var self = this;
    this.players.forEach(function (player) {
        player.on('onLoadingPercentChanged', self.onLoadingPercentChanged.bind(self));
        player.on('updateScore', self.onUpdateScore.bind(self));
        player.on('end', self.onEnd.bind(self));
        player.on('UseItem',self.setUseItemTimer.bind(self));
        player.on('clearUseItem',self.clearUseItemTimer.bind(self));
        // 推送匹配成功消息
        self.notifyOther(player, 'endless.matchSuccess', {target: player.getInfo(),code:Code.OK});

        // playerManager.broadcast('chat.acceptEndlessBattle',{playerId:player.id});
    });

    // loading 超时
    this.loadingTimer = setTimeout(function () {
        clearTimeout(self.loadingTimer);
        self.loadingTimer = null;
        // 未都加载完成，直接结算
        if (!self.isAllLoadingFinished()) {
            logger.debug(' loading 超时 loading ');
            // 结算
            self.forceEnd();
        }
    }, dataUtils.getOptionValue('Endless_LoadingOverTime', 30) * 1000);
};

MatchPair.prototype.getPlayerById = function (playerId) {
    return this.playersById[playerId];
};

MatchPair.prototype.clearUseItemTimer = function () {
    clearInterval(this.useItemTimer);
};

MatchPair.prototype.setUseItemTimer = function (robot) {

    var endless_AiInterval = dataUtils.getOptionValue('Endless_AiInterval',20);
    var self = this;
    this.useItemTimer = setInterval(function () {
        var otherPlayer = self.getOther(0);
        var data = dataApi.BlockItem.getRandItem();
        if(data&&otherPlayer){
            otherPlayer.pushMsgToClient("endless.useItem",{itemId:data.id});
        }
    },  endless_AiInterval* 1000);
};
/*
* 标记为此次匹配超时（不记具体是哪个玩家导致加载失败）
* */
MatchPair.prototype.setLoadTimeout = function () {
    this.isLoadTimeout = true;
};
/*
*   
* */
MatchPair.prototype.getLoadTimeout = function () {
   return this.isLoadTimeout;
};

/**
 *  获取乱斗道具
 * @param pos 道具的位置
 */
MatchPair.prototype.useMeleeItem = function (playerId, pos) {
    var player = this.playersById[playerId];
    var item = null;
    if (player){
        item = player.useMeleeItem(pos);
    }
    return item;
};
/**
 * 设置乱斗道具
 * @param pos
 * @param itemId
 */
MatchPair.prototype.setMeleeItem = function (playerId,pos,itemId) {
    var player = this.playersById[playerId];
    if(!player){
        logger.error("MatchPair.setMeleeItem error playerID:%s",playerId);
        return;
    }
    player.setMeleeItem(pos,itemId);
};

MatchPair.prototype.doEvaluate = function () {
    var player = this.players[0],
        otherPlayer = this.players[1];
    if (player.isEnd() && otherPlayer.isEnd() && !this.evaluated) {
        this.evaluated = true;
        // 结算
        var result;
        if (player.isRobot()) {
            // 机器人没有playerId
            result = !this.getResultByPlayerId(otherPlayer) ? 1 : 0;
            player.emit('clearUseItem',player);
        } else {
            result = this.getResultByPlayerId(player) ? 1 : 0;
        }
        // 将赛果写入数据库
        var self = this;
        var isDoubleTime =  dropUtils.isDoubleTime(self.occasionId);
        endlessReport.upsertReport({
            endlessId : self.endlessId,
            playerId : player.playerId || 0,
            result : result,
            occasionId : self.occasionId,
            otherPlayerId : otherPlayer.playerId || 0,
            otherName : otherPlayer.name,
            curHeroId : player.fightHeroId,
            otherHeroId :  otherPlayer.fightHeroId,
            score : player.getFinalScore(otherPlayer.score),
            otherScore : otherPlayer.getFinalScore(player.score),
            fightBfRank : self.fightBfRank || 0,
            fightBfWeekRank : self.fightBfWeekRank|| 0,
            curName : player.name,
            isRobotFight :self.isRobotFight|| 0,
            isDouble :isDoubleTime
        },function(){
                    // endlessReportDao.upsertReport累加了连胜和连败次数，通知area进行重新读取连胜和连败次数
                    var curAreaClient = playerManager.get().getPlayer(player.playerId),
                        otherPlayerClient = playerManager.get().getPlayer(otherPlayer.playerId);
                    if (curAreaClient) {
                        endlessReport.getByPlayerIdAndOccasionId(player.playerId,self.occasionId,function(rec){
                            if(rec) {
                                endlessReport.getEndlessReport(player.playerId, self.endlessId, function (report) {
                                    if (report) {
                                        curAreaClient.areaRpc('endlessRemote', 'onReport', {
                                            playerId: player.playerId,
                                            occasionId: self.occasionId,
                                            maxWin: rec ? 0 : rec.maxWin,
                                            maxLose: rec ? 0 : rec.maxLose,
                                        }, function () {
                                        });
                                    }
                                });
                            }
                        });
                    }
                    if (otherPlayerClient) {
                        endlessReport.getByPlayerIdAndOccasionId(otherPlayer.playerId,self.occasionId,function(rec){
                            if(rec){
                                endlessReport.getEndlessReport(otherPlayer.playerId,self.endlessId,function(report){
                                    if(report) {
                                        otherPlayerClient.areaRpc('endlessRemote', 'onReport', {
                                            playerId: otherPlayer.playerId,
                                            occasionId: self.occasionId,
                                            maxWin:rec ? 0 : rec.maxWin,
                                            maxLose:rec ? 0 : rec.maxLose,
                                        }, function () {
                                        });
                                    }
                                });
                            }
                        });
                    }
                    // 推送结算通知
                    var occasionData = dataApi.EndlessType.findById(self.occasionId),
                        winAwards, presentAwards;
                    if (occasionData) {
                        winAwards = dropUtils.getDropItems(occasionData.winDropId);
                        var count = 1;
                        if(isDoubleTime){
                            count = occasionData.cupAddRate;
                        }
                        presentAwards = dropUtils.getDropItemsByCount(occasionData.giveDropId,count)
                    }
                    if (result) {
                       // logger.debug('playerId = %s , otherPlayer = %s ',player.playerId,otherPlayer.playerId);
                        player.pushMsgToClient('endless.evaluate', {
                            endlessId: self.endlessId,
                            result: result,
                            otherScore: otherPlayer.score,
                            winAwards: winAwards || [],
                            presentAwards: presentAwards || [],
                            otherPresentAwards: presentAwards || []
                        });
                        otherPlayer.pushMsgToClient('endless.evaluate', {
                            endlessId: self.endlessId,
                            result: !result ? 1 : 0,
                            otherScore: player.score,
                            presentAwards: presentAwards || [],
                            otherWinAwards: winAwards || [],
                            otherPresentAwards: presentAwards || []
                        });
                    } else {
                        player.pushMsgToClient('endless.evaluate', {
                            endlessId: self.endlessId,
                            result: result,
                            otherScore: otherPlayer.score,
                            presentAwards: presentAwards || [],
                            otherWinAwards: winAwards || [],
                            otherPresentAwards: presentAwards || []
                        });
                        otherPlayer.pushMsgToClient('endless.evaluate', {
                            endlessId: self.endlessId,
                            result: !result ? 1 : 0,
                            otherScore: player.score,
                            winAwards: winAwards || [],
                            presentAwards: presentAwards || [],
                            otherPresentAwards: presentAwards || []
                        });
                    }
            });
    }
};

MatchPair.prototype.onEnd = function (player) {
    var otherPlayer = this.getOther(player.playerId);
    if (otherPlayer && otherPlayer.isRobot() && !otherPlayer.isEnd()) {
        if (otherPlayer.result) {
            //如果玩家结束战斗，则预期失败的AI同时结束战斗。
            otherPlayer.setEnd(true);
        } else {
            // 如果本次AI是赢的，则最终服务器要延时10~30秒后
            var timeRange = dataUtils.getRangeOption('Endless_WinAiEndTime');
            setTimeout(function () {
                // AI胜利的话，修正AI分数
                var finalScore = otherPlayer.getFinalScore(player.score);
                //console.log('###updateScore finalScore = %s, player.score = %s', finalScore, player.score);
                otherPlayer.updateScore(finalScore);
                otherPlayer.setEnd(true);
            }, _.random(timeRange.low, timeRange.high));
        }
        otherPlayer.emit('clearUseItem',otherPlayer);
    }
    player.emit('clearUseItem',otherPlayer);
    this.doEvaluate();
};

/*
 *   计算比赛结果
 * */
MatchPair.prototype.getResultByPlayerId = function (curPlayer) {
    var isBothPlayer = _.every(this.players, function (player) {
        return !player.isRobot();
    });
    var otherPlayer = this.getOther(curPlayer.playerId);
    if (isBothPlayer) {
        // 最终战斗胜负，以玩家两者的得分进行对比
        if (otherPlayer.score === curPlayer.score) {
            // 得分相等，则先结束挑战的玩家胜
            return (curPlayer.endTime < otherPlayer.endTime);
        }
        return (curPlayer.score > otherPlayer.score);
    } else {
        if (otherPlayer.isRobot()) {
            return otherPlayer.result&&curPlayer.score!=0;
        } else {
            return !(curPlayer.result&&otherPlayer.score!=0);
        }
    }
};

MatchPair.prototype.getOther = function (playerId) {
    var i;
    for (i = 0; i < this.players.length; ++i) {
        if (this.players[i].playerId !== playerId) {
            return this.players[i];
        }
    }
    return null;
};

MatchPair.prototype.onUpdateScore = function (robot) {
    var otherPlayer = this.getOther(robot.playerId);
    if (otherPlayer) {
        robot.updateScore(robot.getRndScore(otherPlayer.getScore()));
        if (robot.getIsAIAdvantage() && robot.getScore() > otherPlayer.getScore()) {
            // 玩家结束挑战后，AI继续刷新得分
            // 在确定AI积分超过玩家后，随机（5秒~15秒）后结束，这期间，AI的分数继续刷。
            robot.setEndTimer();
        }
    }
};

/*
 *   玩家更新得分，机器人不调用此接口
 * */
MatchPair.prototype.updateScore = function (playerId, score, end, curBattleId) {
    var player = this.playersById[playerId];
    if (player) {
        // 缓存，等对方来取
        player.updateScore(score,curBattleId);
        //  对手如果是机器人，更新其得分
        var otherPlayer = this.getOther(player.playerId);
        if (otherPlayer && otherPlayer.isRobot() && !otherPlayer.isEnd()) {
            otherPlayer.updateScore(ai.getRobotCurScore(otherPlayer.result, score, otherPlayer.score));
            // 判断机器人是否需要提前退出
            //logger.debug('###curBattleId = %s, failBattleId = %s', curBattleId, otherPlayer.failBattleId);
            if (curBattleId === otherPlayer.failBattleId) {
                otherPlayer.setEnd(true);
            }
        }
        if (end) {
            player.setEnd(end);
        }
    }
};

/*
 *   查看对方当前得分，机器人不调用此接口
 * */
MatchPair.prototype.getOtherScore = function (playerId) {
    var player = this.playersById[playerId];
    if (player) {
        var otherPlayer = this.getOther(player.playerId);
        if (otherPlayer) {
            return otherPlayer.score;
        }
    }
    return 0;
};

MatchPair.prototype.updateLoadingPercent = function (playerId, percent) {
    var player = this.playersById[playerId];
    if (player) {
        player.updateLoadingPercent(percent);
    }
};

/*
 *   通知其他人
 * */
MatchPair.prototype.notifyOther = function (curPlayer, route, msg) {
    _.each(this.players, function (player) {
        if (player.playerId !== curPlayer.playerId) {
            player.pushMsgToClient(route, msg);
        }
    });
};

MatchPair.prototype.getLoadingFinishedCnt = function () {
    var players = this.players || [];
    return _.reduce(players, function (memo, player) {
        return memo + (player.getEndlessLoadingPercent() === 100 ? 1 : 0);
    }, 0);
};


MatchPair.prototype.isAllLoadingFinished = function () {
    var players = this.players || [];
    return (this.getLoadingFinishedCnt() >= players.length);
};

/*
 *   成员加载进度监控
 * */
MatchPair.prototype.onLoadingPercentChanged = function (curPlayer) {
    var percent = curPlayer.getEndlessLoadingPercent();
    this.notifyOther(curPlayer, 'endless.onLoading', {
        playerId: curPlayer.playerId,
        percent: percent,
        tick: Date.now()
    });
    // 检查加载进度
    if (percent < 100) {
        return;
    }
    if (this.isAllLoadingFinished()) {
        var self = this;
        this.players.forEach(function (player) {
            player.pushMsgToClient('endless.startBattle', {endlessId: self.endlessId});
            if(player.isRobot()){
                player.emit('UseItem',player);
            }
        });
    }
};

MatchPair.prototype.destroy = function () {
    if (this.loadingTimer) {
        clearTimeout(this.loadingTimer);
    }
    this.players.forEach(function (player) {
        player.destroy();
    });
};

MatchPair.prototype.forceEnd = function () {
    if (this.loadingTimer) {
        clearTimeout(this.loadingTimer);
        this.loadingTimer = null;
    }
    var self = this;
    var setTimeout = true;
    this.players.forEach(function (player) {
        if(player.getEndlessLoadingPercent() === 100){//已经加载完成的。
            player.pushMsgToClient('endless.startBattle', {endlessId: self.endlessId});
            setTimeout = false;
        }
        else{
            if (!player.isEnd()) {
                player.setEnd(true);
            }
        }
    });

    if(setTimeout){
        self.setLoadTimeout();
    }
};

var exp = module.exports = {};

exp.createMatchPair = function (a, b, occasionId) {
    return new MatchPair(a, b, occasionId);
};

//====================================================================================================================================================================
var SinglePair = function (a, occasionId )
{
    this.endlessId = uuid.v1();
    a.playerId = a.id;
    var playerA = createMatchTarget(a, this.endlessId, occasionId);
    this.players = [playerA];
    this.playersById = {};
    this.playersById[a.id] = playerA;
    this.occasionId = occasionId;
    this.evaluated = false;
    var self = this;
}

/*
 *   玩家更新得分
 * */
SinglePair.prototype.updateScore = function ( playerId, score, end, curBattleId ) {
    var player = this.playersById[playerId];
    if (player) {
        // 缓存，等对方来取
        player.updateScore(score,curBattleId);
        if (end) {
            player.setEnd(end);
        }
    }
};

SinglePair.prototype.getPlayerById = function (playerId) {
    return this.playersById[playerId];
};

//单人
exp.createSinglePair=function(a,occasionId)
{
    return new SinglePair(a,occasionId);
};


