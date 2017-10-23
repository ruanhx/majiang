/**
 * Created by kilua on 2016/7/23 0023.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var world = require('../../../domain/world/world'),
    Code = require('../../../../shared/code'),
    Consts=require('../../../consts/consts'),
    playerManager = require('../../../domain/world/playerManager'),
    matchTarget =  require('../../../domain/world/matchTarget'),
    divisionMgr = require('../../../domain/world/divisionMgr').get(),
    endlessReport = require('../../../domain/world/endlessReport').get(),
    scoreRankingList = require('../../../domain/world/scoreRankingList');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

pro.match = function (args, cb) {
    logger.debug('match args = %j', args);
    var matchQueue = world.getEndlessMatchQueueByOccasionId(args.occasionId);
    if (!matchQueue) {
        logger.error("world matchQueue err args.occasionId:%d",args.occasionId);
        return cb(null, Code.WORLD.NO_SUCH_OCCASION);
    }
    var player = playerManager.get().getPlayer(args.playerId);
    if (!player) {
        logger.debug('match player.id = %s already offline!', args.playerId);
        return cb(null, Code.FAIL);
    }
    if (!matchQueue.match(player, args)) {
        return cb(null, Code.WORLD.ALREADY_IN_MATCH_QUEUE);
    }
    // 开始匹配
    return cb(null, Code.WORLD.ENDLESS_MATCH_START);
};
// 玩家应战
pro.acceptBattle = function (args, cb) {
    // logger.debug('match args = %j', args);
    var matchQueue = world.getEndlessMatchQueueByOccasionId(args.occasionId);
    if (!matchQueue) {
        logger.error("world matchQueue err args.occasionId:%d",args.occasionId);
        return cb(null, Code.WORLD.NO_SUCH_OCCASION);
    }
    var player = playerManager.get().getPlayer(args.playerId);
    if (!player) {
        logger.debug('match player.id = %s already offline!', args.playerId);
        return cb(null, Code.FAIL);
    }

    var code =  matchQueue.acceptFight(args);

    return cb(null, code);
};

pro.singlePvp = function (args, cb) {
    logger.debug('singlePvp args = %j', args);

    var player = playerManager.get().getPlayer(args.playerId);
    if (!player) {
        logger.debug('match player.id = %s already offline!', args.playerId);
        return cb(null, Code.FAIL);
    }
    player.boxDouble = args.boxDouble;
    var target = matchTarget.createSinglePair(player,args.occasionId);
    player.setSinglePvp(target);
    // 开始单人模式
    return cb(null, Code.WORLD.ENDLESS_SINGLE_START);
};

pro.reMoveSinglePvp= function (args,cb) {
    logger.debug('singlePvp args = %j', args);
    var player = playerManager.get().getPlayer(args.playerId);
    if (!player) {
        logger.debug('match player.id = %s already offline!', args.playerId);
        return cb(null, Code.FAIL);
    }
    player.setSinglePvp();
    return cb(null, Code.OK);
}
/*
 *   查询复活次数
 * */
pro.getReviveCnt = function (args, cb) {
    logger.debug('getReviveCnt playerId = %s', args.playerId);
    var player = playerManager.get().getPlayer(args.playerId);
    if (!player) {
        return cb(Code.FAIL);
    }
    if (!player.endlessPair) {
        return cb(Code.WORLD.NO_ENDLESS_FIGHTING);
    }
    var matchPlayer = player.endlessPair.getPlayerById(args.playerId);
    if (matchPlayer) {
        return cb(Code.OK, matchPlayer.getReviveCnt());
    }
    logger.debug('getReviveCnt no match player found!playerId = %s', args.playerId);
    return cb(Code.FAIL);
};

/*
 *   累计复活次数
 * */
pro.increaseReviveCnt = function (args, cb) {
    logger.debug('increaseReviveCnt playerId = %s', args.playerId);
    var player = playerManager.get().getPlayer(args.playerId);
    if (!player) {
        return cb(Code.FAIL);
    }
    if (!player.endlessPair) {
        return cb(Code.WORLD.NO_ENDLESS_FIGHTING);
    }
    var matchPlayer = player.endlessPair.getPlayerById(args.playerId);
    if (matchPlayer) {
        matchPlayer.increaseReviveCnt();
        return cb(Code.OK);
    }
    logger.debug('increaseReviveCnt no match player found!playerId = %s', args.playerId);
    return next(null, Code.FAIL);
};

/*
 *   更新排行榜
 * */
pro.updateScoreRankingList = function (args, cb) {
    logger.debug('updateScoreRankingList playerId = %s, occasionId = %s', args.playerId, args.occasionId);

    if(!args.noUpdate){
        logger.error('无尽更新排行榜');
        scoreRankingList.getScoreRankingList().update({id: args.playerId, playerId: args.playerId, score: args.score,rankType:Consts.RANKING_TYPE.TOTAL});
        scoreRankingList.getWeekScoreRankingList().update({id: args.playerId, playerId: args.playerId, score: args.score,rankType:Consts.RANKING_TYPE.WEEK});
    }

    var res = {},
        totalRec = scoreRankingList.getScoreRankingList().findById(args.playerId),
        weekRec = scoreRankingList.getWeekScoreRankingList().findById(args.playerId);
    //if (totalRec) {
    //    res.highScore = totalRec.score;
    //}

    //刷新周榜
    if (weekRec) {
        res.weekRank = weekRec.rank;
        var player = playerManager.get().getPlayer(args.playerId);
        if(player )
        {
            player.setSinglePvp();
        }
    }
    return cb(res,totalRec);
};

/*
 *   获取重开宝箱信息
 * */
pro.getReopenBoxInfo = function (args, cb) {
    logger.debug('getReopenBoxInfo playerId = %s, occasionId = %s', args.playerId, args.occasionId);
    var player = playerManager.get().getPlayer(args.playerId);
    if (!player) {
        return cb(Code.FAIL);
    }
    if (!player.endlessPair) {
        return cb(Code.WORLD.NO_ENDLESS_FIGHTING);
    }
    if (player.endlessPair.occasionId !== args.occasionId) {
        logger.debug('getReopenBoxInfo occasionId not match!');
        return cb(Code.FAIL);
    }
    var matchPlayer = player.endlessPair.getPlayerById(args.playerId);
    if (matchPlayer) {
        return cb(Code.OK, {reopenCnt: matchPlayer.getReopenBoxCnt(), score: matchPlayer.getScore()});
    }
    logger.debug('getReopenBoxInfo matchPlayer not found!');
    return cb(Code.FAIL);
};

/*
 *   累计重开宝箱次数
 * */
pro.increaseReopenBoxCnt = function (args, cb) {
    logger.debug('increaseReopenBoxCnt playerId = %s, occasionId = %s', args.playerId, args.occasionId);
    var player = playerManager.get().getPlayer(args.playerId);
    if (!player) {
        return cb(Code.FAIL);
    }
    if (!player.endlessPair) {
        return cb(Code.WORLD.NO_ENDLESS_FIGHTING);
    }
    if (player.endlessPair.occasionId !== args.occasionId) {
        logger.debug('increaseReopenBoxCnt occasionId not match!');
        return cb(Code.FAIL);
    }
    var matchPlayer = player.endlessPair.getPlayerById(args.playerId);
    if (matchPlayer) {
        matchPlayer.increaseReopenBoxCnt();
        return cb(Code.OK, matchPlayer.getReopenBoxCnt());
    }
    logger.debug('increaseReopenBoxCnt matchPlayer not found!');
    return cb(Code.FAIL);
};

/**
 * 报告段位积分
 * @param args
 * @param cb
 */
pro.reportDivisionScore = function(args , cb){
    cb(divisionMgr.reportScore(args.playerId , args.hScore ,args.hPower , args.heroId, args.name, args.divScore,args.surpassCnt,args.baseDivScore));
}

/**
 * 获取随机对手列表
 * @param args
 * @param cb
 */
pro.getDivisionOpponents = function(args,cb){
    cb(divisionMgr.refreshOpponents(args.playerId , args.hScore ,args.hPower));
}

pro.getDivisionPlayerInfo = function(args,cb){
    var info = divisionMgr.getPlayerInfo(args.playerId);
    //logger.debug("getDivisionPlayerInfo 获取角色段位信息 ：%j",info);
    cb(info||{});
}

/**
 *
 * @param playerId
 * @param cb
 */
pro.getEndlessReport = function(playerId,cb){
    endlessReport.getEndlessReportVOList(playerId,function(list){
        cb(list);
    })
}

/**
 *
 * @param playerId
 * @param cb
 */
pro.getEndlessOccasion = function(playerId,cb){
    endlessReport.getEndlessOccasionVOMap(playerId,function(rs){
        cb(null,_.values(rs));
    });
}

/**
 *
 * @param data
 * @param cb
 */
pro.syncEndlessOccasion = function(data,cb){
    endlessReport.syncEndlessOccasion(data);
    cb();
}

/**
 *
 * @param args
 * @param cb
 */
pro.setDrew = function(args,cb){
    endlessReport.getEndlessReport(args.playerId,args.endlessId,function(report){
        if(!report) return cb(false);
        if(report.drew !== 0) return cb(false);
        report.drew = 1;
        report.isDirty = 1;
        return cb(true);
    });
}

/**
 *
 * @param args
 * @param cb
 */
pro.getReportsCnt = function(args,cb){
    endlessReport.getEndlessReportVOList(args.playerId,function(reports){
        var cnt = 0;
        _.each(reports,function(r){
            if(r.drew === args.drew){
                cnt++;
            }
        });
        cb(cnt);
    });
}