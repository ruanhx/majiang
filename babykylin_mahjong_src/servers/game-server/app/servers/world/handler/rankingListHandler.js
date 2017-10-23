/**
 * Created by kilua on 2016/7/4 0004.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore'),
    async = require('async');

var Code = require('../../../../shared/code'),
    scoreRankingList = require('../../../domain/world/scoreRankingList'),
    catchRankingList = require('../../../domain/world/rankList/catchRankingList'),
    scoreRankingListDao = require('../../../dao/scoreRankingListDao'),
    scoreRankingAwardDao = require('../../../dao/scoreRankingAwardDao'),
    weekScoreRankingListDao = require('../../../dao/weekScoreRankingListDao'),
    weekScoreRankingAwardDao = require('../../../dao/weekScoreRankingAwardDao'),
    barrierRankListDao = require('../../../dao/barrierRankListDao'),
    catchRankingListDao = require('../../../dao/catchRankingListDao'),
    catchRankingAwardDao = require('../../../dao/catchRankingAwardDao'),
    rankListManager = require('../../../domain/world/rankListManager').getInstance(),
    playerMiniData = require('../../../domain/world/playerMiniData'),
    divisionMgr = require('../../../domain/world/divisionMgr'),
    rankListDao = require('../../../dao/rankListDao'),
    dataUtils = require('../../../util/dataUtils'),
    Consts = require('../../../consts/consts'),
    dataApi = require('../../../util/dataApi'),
    dropUtils = require('../../../domain/area/dropUtils');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

/*
 *   获取总榜
 * */
pro.getScoreList = function (msg, session, next) {
    //logger.debug('getScoreList playerId = %s', session.get('playerId'));
    var rankingList = scoreRankingList.getScoreRankingList().getRangeInfo(dataUtils.getOptionValue('Endless_RankDisplayNum', 10), 1);
    async.each(rankingList,function (rec,callback) {
        var playerInfo = playerMiniData.getInstance().getPlayerById(rec.playerId);
        var divisionInfo = divisionMgr.get().getPlayerInfo(rec.playerId) || {};
        if (playerInfo) {
            rec.name = playerInfo.playername;
            rec.headPicId = playerInfo.headPicId;
            rec.heroId = playerInfo.heroId;
            rec.division = divisionInfo.divisionId;
            rank = rec.rank;
            drew = rec.drew;
            callback();
        }else {
            scoreRankingListDao.getPlayerRankingInfo([rec.playerId], function (err, info) {
                if (!err&&info.length>0){
                    rec.name = info[0].playername;
                    rec.headPicId = info[0].headPicId;
                    rec.heroId = info[0].heroId;
                    rec.division = divisionInfo.divisionId;
                }
                callback();
            });
        }
    },function (err) {
        if (!err){
            // 检索自己的排名
            var myRank = scoreRankingList.getScoreRankingList().findById(session.get('playerId'));
            return next(null, {
                code: Code.OK,
                rankingList: rankingList,
                myRank: myRank ? myRank.rank : 0,
                type: msg.type,
                myScore: myRank ? myRank.score : 0,
            });
        }
        // logger("makeClientInfo id:%s e:%s",id,err);
    });
};

/*
 *   获取周榜
 * */
pro.getWeekScoreList = function (msg, session, next) {
    //logger.debug('getWeekScoreList playerId = %s', session.get('playerId'));
    var rankingList = scoreRankingList.getWeekScoreRankingList().getRangeInfo(dataUtils.getOptionValue('Endless_RankDisplayNum'), 1);
    //logger.debug("获取周榜数据 %j", rankingList);
    async.each(rankingList,function (rec,callback) {
        var playerInfo = playerMiniData.getInstance().getPlayerById(rec.playerId);
        if (playerInfo) {
            rec.name = playerInfo.playername;
            rec.headPicId = playerInfo.headPicId;
            rec.heroId = playerInfo.heroId;
            rank = rec.rank;
            drew = rec.drew;
            callback();
        }else {
            scoreRankingListDao.getPlayerRankingInfo([rec.playerId], function (err, info) {
                if (!err&&info.length>0){
                    rec.name = info[0].playername;
                    rec.headPicId = info[0].headPicId;
                    rec.heroId = info[0].heroId;
                }
                callback();
            });
        }
    },function (err) {
        if (!err){
            // 检索自己的排名
            var myRank = scoreRankingList.getWeekScoreRankingList().findById(session.get('playerId'));
            return next(null, {
                code: Code.OK,
                rankingList: rankingList,
                myRank: myRank ? myRank.rank : 0,
                type: msg.type,
                myScore: myRank ? myRank.score : 0,
            });
        }
        // logger("makeClientInfo id:%s e:%s",id,err);
    });

};

/*
 *   获取抓宝排行榜
 * */
pro.getCatchList = function (msg, session, next) {
    //logger.debug('getCatchList playerId = %s', session.get('playerId'));
    var rankingList = catchRankingList.getCatchRankingList().getRangeInfo(dataUtils.getOptionValue('Endless_RankDisplayNum'), 1);
    //logger.debug("获取抓宝排行榜 %j", rankingList);
    catchRankingListDao.getPlayerRankingInfo(_.pluck(rankingList, 'playerId'), function (err, infoList) {
        var playerInfoById = _.indexBy(infoList, 'id');
        var rank, drew;
        rankingList.forEach(function (rec) {
            var playerInfo = playerInfoById[rec.playerId];
            if (playerInfo) {
                rec.name = playerInfo.playername;
                rec.headPicId = playerInfo.headPicId;
                rec.heroId = playerInfo.heroId;
                rank = rec.rank;
                drew = rec.drew;
            }
        });
        // 检索自己的排名
        var myRank = catchRankingList.getCatchRankingList().findById(session.get('playerId'));
        return next(null, {
            code: Code.OK,
            rankingList: rankingList,
            myRank: myRank ? myRank.rank : 0,
            awardRank: rank,
            awardDrew: drew
        });

    });
};

function makeClientInfo(rankingList, rankClass, id, next, msg) {
    var rank, drew;
    async.each(rankingList,function (rec,callback) {
        var playerInfo = playerMiniData.getInstance().getPlayerById(rec.playerId);
        if (playerInfo) {
            rec.name = playerInfo.playername;
            rec.headPicId = playerInfo.headPicId;
            rec.heroId = playerInfo.heroId;
            rank = rec.rank;
            drew = rec.drew;
            callback();
        }else {
            rankListDao.getPlayerRankingInfo(rec.playerId, function (err, info) {
                if (!err){
                    rec.name = info.playername;
                    rec.headPicId = info.headPicId;
                    rec.heroId = info.heroId;
                }
                callback();
            });
        }
    },function (err) {
        if (!err){
            // 检索自己的排名
            var myRank = rankClass.findById(id);
            return next(null, {
                code: Code.OK,
                rankingList: rankingList,
                myRank: myRank ? myRank.rank : 0,
                awardRank: rank,
                awardDrew: drew,
                type: msg.type,
                myScore: myRank ? myRank.score : 0,
            });
        }
        logger("makeClientInfo id:%s e:%s",id,err);
    });
    // rankingList.forEach(function (rec) {
    //
    //     var playerInfo = playerMiniData.getInstance().getPlayerById(rec.playerId);
    //     if (playerInfo) {
    //         rec.name = playerInfo.playername;
    //         rec.headPicId = playerInfo.headPicId;
    //         rec.heroId = playerInfo.heroId;
    //         rank = rec.rank;
    //         drew = rec.drew;
    //     }
    // });

}
pro.getBarrierRankList = function (msg, session, next) {
    // 根据类型获取排行榜
    var rankClass = rankListManager.getRankByType(msg.type);
    if (!rankClass) {
        logger.error("rankingListHandler type error playerId = %s type=%s ", session.get('playerId'), msg.type);
        return next(null, {code: Code.WORLD.RANKLIST_ERROR_TYPE});
    }
    var rankingList = rankClass.getRangeInfo(dataUtils.getOptionValue('Endless_RankDisplayNum'), 1, msg.barrierId);
    return makeClientInfo(rankingList, rankClass, [session.get('playerId'),msg.barrierId].join("_"), next, msg);
};

/*
 *   获取排行榜 以后统一使用根据类型这个获取排行榜
 * */
pro.getRankList = function (msg, session, next) {

    if (msg.type == Consts.RANKING_TYPE.BARRIER) {
        this.getBarrierRankList(msg, session, next);
        return;
    }

    // 根据类型获取排行榜
    var rankClass = rankListManager.getRankByType(msg.type);
    if (!rankClass) {
        logger.error("rankingListHandler type error playerId = %s type=%s ", session.get('playerId'), msg.type);
        return next(null, {code: Code.WORLD.RANKLIST_ERROR_TYPE});
    }
    var rankingList = rankClass.getRangeInfo(dataUtils.getOptionValue('Endless_RankDisplayNum'), 1);
    var id;
    if (msg.type == Consts.RANKING_TYPE.BARRIER){
        id = [session.get('playerId'),msg.barrierId].join("_");
    }else {
        id = session.get('playerId');
    }
    return makeClientInfo(rankingList, rankClass, id, next, msg);
};

/*
 *   预览总/周榜奖励
 * */
pro.previewAwards = function (msg, session, next) {
    //logger.debug('previewAwards playerId = %s, type = %s', session.get('playerId'), msg.type);
    var typeAwards = dataApi.EndlessRankReward.findByIndex({id: msg.type}),
        res = [];
    typeAwards.forEach(function (awardData) {
        res.push({rank: awardData.rank, awards: dropUtils.getDropItems(awardData.dropId)});
    });
    return next(null, {code: Code.OK, type: msg.type, awards: res});
};