/**
 * Created by kilua on 2016/7/24 0024.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo'),
    _ = require('underscore');

var Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts'),
    dataApi = require('../../../util/dataApi'),
    playerManager = require('../../../domain/world/playerManager'),
    scoreRankingList = require('../../../domain/world/scoreRankingList'),
    endlessMgr = require('../../../domain/world/endlessMgr'),
    divisionMgr = require('../../../domain/world/divisionMgr'),
    endlessPVPBoxDao = require('../../../dao/endlessPVPBoxDao');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

pro.loadingPercent = function (msg, session, next) {
    var player = playerManager.get().getPlayer(session.get('playerId'));
    player.updateLoadingPercent(msg.percent);
    next();
};
//单人得分报告
pro.singleReportScore = function (msg, session, next) {
    logger.debug('reportScore playerId = %s, score = %s, end = %s, curBattleId = %s', session.get('playerId'), msg.score, msg.end, msg.curBattleId);
    var player = playerManager.get().getPlayer(session.get('playerId'));

    //player.refreshEndlessSingleHighBarr(msg.endlessSingleHighBarr);
    player.areaRpc('endlessRemote', 'refreshEndlessSingleHighBarr', {
        playerId: player.id,
        endlessSingleHighBarr: msg.endlessSingleHighBarr
    }, function (errCode) {
        if (errCode != Code.OK) {
            logger.debug("refreshEndlessSingleHighBarr error.");
        }
    });
    if (player.singlePair) {
        // 战斗力作弊校验
        if (msg.end) {
            var miniData = playerMiniData.getInstance().getPlayerById(player.id);
            var power = miniData.highPower;
            var scoreAdd = 1;
            var self = this;
            pomelo.app.rpc.area.playerRemote.getPlayerEndlessBuff("*", {playerId: player.id}, function (err, res) {
                if (res) {
                    res.forEach(function (buffId) {
                        var buffData = dataApi.EndlessBuff.findById(buffId);
                        if (buffData && buffData.effectType === Consts.ENDLESS_BUFF_EFFECT_TYPE.POWER) {
                            power = power * (1 + buffData.effectNum);
                        }
                        if (buffData && buffData.effectType === Consts.ENDLESS_BUFF_EFFECT_TYPE.SCORE) {
                            scoreAdd += buffData.effectNum;
                        }
                    });
                }
                var fightCheckData = Math.ceil(dataApi.EndlessPowerCheck.getLimitScore(power));
                var scoreCheck = Math.ceil(msg.score / scoreAdd);
                if (fightCheckData == 0 || fightCheckData < scoreCheck) {
                    logger.error('战斗力验证失败!playerId = %s limitScore = %s score = %s', player.id, fightCheckData, msg.score);
                    // 记录更新玩家得分
                    player.singlePair.updateScore(player.id, 0, msg.end, msg.curBattleId);
                    return next(null, {code: Code.AREA.ENDLESS_SCORE_INVALID});
                }
                // 记录更新玩家得分
                player.singlePair.updateScore(player.id, msg.score, msg.end, msg.curBattleId);
            });
        } else {
            // 记录更新玩家得分
            player.singlePair.updateScore(player.id, msg.score, msg.end, msg.curBattleId);
        }

    }
    // 获取对手得分
    return next(null, {code: Code.OK});
}
/**
 *  无尽乱斗获得道具
 * @param msg
 * @param session
 * @param next
 */
pro.gainItem = function (msg, session, next) {
    var player = playerManager.get().getPlayer(session.get('playerId'));
    // 检查当前赛事
    if (!player.endlessPair) {
        logger.debug('gainItem plz match first!');
        return next(null, {code: Code.FAIL});
    }

    if (player.endlessPair.getLoadTimeout()) {
        return next(null, {code: Code.WORLD.ENDLESS_LOAD_TIMEOUT});
    }
    // 添加道具
    player.endlessPair.setMeleeItem(session.get('playerId'), msg.pos, msg.itemId);
    next(null, {code: Code.OK});
};
/**
 * 无尽乱斗使用道具
 * @param msg
 * @param session
 * @param next
 */
pro.useItem = function (msg, session, next) {
    var player = playerManager.get().getPlayer(session.get('playerId'));
    // 检查当前赛事
    if (!player.endlessPair) {
        logger.debug('gainItem plz match first!');
        return next(null, {code: Code.FAIL});
    }

    if (player.endlessPair.getLoadTimeout()) {
        return next(null, {code: Code.WORLD.ENDLESS_LOAD_TIMEOUT});
    }

    // 使用道具
    var itemId = player.endlessPair.useMeleeItem(session.get('playerId'), msg.pos);
    if (!itemId) {
        logger.error("useItem not exist playerid:%s,pos:%s", session.get('playerId'), msg.pos);
        return next(null, {code: Code.WORLD.ENDLESS_USEITEM_NOT_EXIST});
    }

    var otherPlayer = player.endlessPair.getOther(player.id)
    if(otherPlayer){
        otherPlayer.pushMsgToClient("endless.useItem",{itemId:itemId});
    }
    return next(null, {code: Code.OK});
};

/*
 *   多人无尽模式定时反馈当前得分
 * */
pro.reportScore = function (msg, session, next) {
    logger.debug('reportScore playerId = %s, score = %s, end = %s, curBattleId = %s', session.get('playerId'), msg.score, msg.end, msg.curBattleId);
    var player = playerManager.get().getPlayer(session.get('playerId'));
    // 检查当前赛事
    if (!player.endlessPair) {
        logger.debug('reportScore plz match first!');
        return next(null, {code: Code.FAIL});
    }

    if (player.endlessPair.getLoadTimeout()) {
        return next(null, {code: Code.WORLD.ENDLESS_LOAD_TIMEOUT});
    }
    //player.refreshEndlessSingleHighBarr(msg.endlessSingleHighBarr);
    player.areaRpc('endlessRemote', 'refreshEndlessSingleHighBarr', {
        playerId: player.id,
        endlessSingleHighBarr: msg.endlessSingleHighBarr
    }, function (errCode) {
        if (errCode != Code.OK) {
            logger.debug("refreshEndlessSingleHighBarr error.");
        }
    });
    // 记录更新玩家得分
    // player.endlessPair.updateScore(player.id, msg.score, msg.end, msg.curBattleId);
    var res = {},
        otherPlayer = player.endlessPair.getOther(player.id);
    res.code = Code.OK;
    res.otherScore = otherPlayer ? otherPlayer.getScore() : 0;
    res.otherEnd = otherPlayer && otherPlayer.isEnd() ? 1 : 0;
    if (!msg.end) {
        player.endlessPair.updateScore(player.id, msg.score, msg.end, msg.curBattleId);
        return next(null, res);
    } else {
        var miniData = playerMiniData.getInstance().getPlayerById(player.id);
        var power = miniData.highPower;
        var scoreAdd = 1;
        var self = this;
        pomelo.app.rpc.area.playerRemote.getPlayerEndlessBuff("*", {playerId: player.id}, function (err, rec) {
            if (rec) {
                rec.forEach(function (buffId) {
                    var buffData = dataApi.EndlessBuff.findById(buffId);
                    if (buffData && buffData.effectType === Consts.ENDLESS_BUFF_EFFECT_TYPE.POWER) {
                        power = power * (1 + buffData.effectNum);
                    }
                    if (buffData && buffData.effectType === Consts.ENDLESS_BUFF_EFFECT_TYPE.SCORE) {
                        scoreAdd += buffData.effectNum;
                    }
                });
            }
            var fightCheckData = Math.ceil(dataApi.EndlessPowerCheck.getLimitScore(power));
            var scoreCheck = Math.ceil(msg.score / scoreAdd);
            if (fightCheckData === 0 || fightCheckData < scoreCheck) {
                logger.error('战斗力验证失败!playerId = %s limitScore = %s score = %s', player.id, fightCheckData, msg.score);
                // 记录更新玩家得分
                player.endlessPair.updateScore(player.id, 0, msg.end, msg.curBattleId);
                return next(null, {code: Code.AREA.ENDLESS_SCORE_INVALID});
            }
            // 记录更新玩家得分
            player.endlessPair.updateScore(player.id, msg.score, msg.end, msg.curBattleId);
            // 下发己方的结算信息
            scoreRankingList.getScoreRankingList().update({
                id: player.id,
                playerId: player.id,
                score: msg.score,
                rankType: Consts.RANKING_TYPE.TOTAL
            });
            scoreRankingList.getWeekScoreRankingList().update({
                id: player.id,
                playerId: player.id,
                score: msg.score,
                rankType: Consts.RANKING_TYPE.WEEK
            });

            var curWeekRankRec = scoreRankingList.getWeekScoreRankingList().findById(player.id);
            if (curWeekRankRec) {
                res.curWeekRank = curWeekRankRec.rank;
            }
            // RPC 给与宝箱奖励并返回奖励
            var matchPlayer = player.endlessPair.getPlayerById(player.id);
            if (matchPlayer) {
                player.areaRpc('endlessRemote', 'saveEndlessPVPBox',matchPlayer.getPVPBoxData(player.endlessPair.occasionId),function(err,success){
                    if (!success) {
                        logger.error('reportScore save pvp box failed!');
                    }
                    return player.areaRpc('endlessRemote', 'openBox', {
                        playerId: player.id,
                        occasionId: player.endlessPair.occasionId,
                        score: matchPlayer.getScore()
                    }, function (errCode, awards, highScore, systemIdAwards, randomInfo) {
                        res.code = errCode;
                        res.awards = awards;
                        res.highScore = highScore;
                        res.systemIdAwards = systemIdAwards;
                        res.randomInfo = randomInfo;
                        player.setMatchPair();
                        return next(null, res);
                    });
                });
                // return endlessPVPBoxDao.save(matchPlayer.getPVPBoxData(player.endlessPair.occasionId), function (err, success) {
                //     if (!success) {
                //         logger.error('reportScore save pvp box failed!');
                //     }
                //     return player.areaRpc('endlessRemote', 'openBox', {
                //         playerId: player.id,
                //         occasionId: player.endlessPair.occasionId,
                //         score: matchPlayer.getScore()
                //     }, function (errCode, awards, highScore, systemIdAwards, randomInfo) {
                //         res.code = errCode;
                //         res.awards = awards;
                //         res.highScore = highScore;
                //         res.systemIdAwards = systemIdAwards;
                //         res.randomInfo = randomInfo;
                //         player.setMatchPair();
                //         return next(null, res);
                //     });
                // });

            }
        });


    }
// 获取对手得分
//     return next(null, res);
};

pro.testMakeAI = function (msg, session, next) {
    divisionMgr.get().doMakeAiRobotByDivision(1);
}

pro.getEndlessDynamics = function (msg, session, next) {
    next(null,endlessMgr.getInstance().getEndlessClientInfo());
}