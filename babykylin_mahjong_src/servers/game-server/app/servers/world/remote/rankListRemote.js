/**
 * Created by rhx on 2016/7/23 0023.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var world = require('../../../domain/world/world'),
    Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts'),
    playerManager = require('../../../domain/world/playerManager'),
    rankListManager = require('../../../domain/world/rankListManager'),
    divisionRankingList = require('../../../domain/world/rankList/divisionRankingList').getModle(),
    starRankingList = require('../../../domain/world/rankList/starRankingList').getModle(),
    scoreRankingList = require('../../../domain/world/scoreRankingList'),
    powerRankingList = require('../../../domain/world/rankList/powerRankingList').getModle(),
    barrierRankingList = require('../../../domain/world/rankList/barrierRankingList').getModle(),
    barrierScoreRankingList = require('../../../domain/world/rankList/barrierScoreRankingList').getModle();

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;


// 其他排行榜统一在这边写
/*
 *   更新段位排行榜
 * */
pro.updateDivisionRankingList = function (args, cb) {
    // logger.debug('updateDivisionRankingList playerId = %s, occasionId = %s', args.playerId);
    divisionRankingList.update({
        id: args.playerId,
        playerId: args.playerId,
        type: args.type,
        score: args.score,
        rankType: Consts.RANKING_TYPE.DIVISION
    });
    //logger.debug('~~updateCatchRankingList = %j', catchRankingList.getCatchRankingList());
    var res = {};
    return cb(res);
};
/*
 *   更新关卡排行榜
 * */
pro.updateBarrierRankingList = function (args, cb) {
    logger.debug('updateBarrierRankingList playerId = %s', args.playerId);
    barrierRankingList.update({
        id: [args.playerId, args.barrierId].join("_"),
        playerId: args.playerId,
        type: args.type,
        score: args.score,
        barrierId: args.barrierId,
        rankType: Consts.RANKING_TYPE.BARRIER
    });
    //logger.debug('~~updateCatchRankingList = %j', catchRankingList.getCatchRankingList());
    var res = {};
    return cb(res);
};
/**
 *  更新星级排行榜
 * @param args
 * @param cb
 * @returns {*}
 */
pro.updateStarRankingList = function (args, cb) {
    starRankingList.update({
        id: args.playerId,
        playerId: args.playerId,
        type: args.type,
        score: args.score,
        lastUpdateTime:Date.now(),
        rankType: Consts.RANKING_TYPE.STAR
    });
    //logger.debug('~~updateCatchRankingList = %j', catchRankingList.getCatchRankingList());
    var res = {};
    return cb(res);
};

pro.updatePowerRankingList = function (args, cb) {
    powerRankingList.update({
        id: args.playerId,
        playerId: args.playerId,
        type: args.type,
        score: args.score,
        lastUpdateTime:Date.now(),
        rankType: Consts.RANKING_TYPE.STAR
    });
    //logger.debug('~~updateCatchRankingList = %j', catchRankingList.getCatchRankingList());
    var res = {};
    return cb(res);
};

pro.getRank = function (args, cb) {
    var rankClass = rankListManager.getInstance().getRankByType(args.type);
    if (!rankClass){
        logger.error("rankingListHandler type error playerId = %s type=%s ",session.get('playerId'),args.type);
        return next(null, {code: Code.WORLD.RANKLIST_ERROR_TYPE});
    }
    // 检索自己的排名
    var myRank = rankClass.findById([args.playerId,args.barrierId].join("_"));

    return cb(myRank);
};
/**
 * 发送关卡积分排名奖励
 * @param args
 * @param cb
 * @returns {*}
 */
pro.sendBarrierScoreAward = function (args, cb) {
    barrierScoreRankingList.dispatchAwards();
    return cb(null,Code.OK);
};

/**
 * 发送关卡积分排名奖励
 * @param args
 * @param cb
 * @returns {*}
 */
pro.sendStarRankAward = function (args, cb) {
    starRankingList.dispatchAwards();
    return cb(null,Code.OK);
};
/**
 * 发送战力排名奖励
 * @param args
 * @param cb
 * @returns {*}
 */
pro.sendPowerRankAward = function (args, cb) {
    powerRankingList.dispatchAwards();
    return cb(null,Code.OK);
};

pro.sendEndlessScoreRankAward = function (args, cb) {
    scoreRankingList.getScoreRankingList().dispatchAwards(Consts.RANKING_TYPE.ENDLESSSCORE);
    return cb(null,Code.OK);
};