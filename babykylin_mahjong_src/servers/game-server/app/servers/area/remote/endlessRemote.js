/**
 * Created by kilua on 2016/7/23 0023.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var area = require('../../../domain/area/area'),
    endlessOccasionDao = require('../../../dao/endlessOccasionDao'),
    Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts'),
    flow = require('../../../consts/flow'),
    dataApi = require('../../../util/dataApi'),
    dropUtils = require('../../../domain/area/dropUtils'),
    endlessPVPBoxDao = require('../../../dao/endlessPVPBoxDao');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

pro.doResult = function(args, cb)
{

};

pro.onReport = function (args, cb) {
    var playerId = args.playerId,
        curPlayer = area.getPlayer(playerId);
    logger.debug('onReport playerId = %s', args.playerId);
    if (curPlayer) {
        // 重新读取连胜和连败次数
        //endlessOccasionDao.getByPlayerIdAndOccasionId(args.playerId, args.occasionId, function (err, rec) {
            //if (rec) {
                curPlayer.occasionManager.updateResult(args.occasionId, args.maxWin||0, args.maxLose||0);
            //}
        //});
    }
    cb();
};

/*
 *   PVP开宝箱
 * */
pro.openBox = function (args, cb) {
    logger.debug('openBox args = %j', args);
    var player = area.getPlayer(args.playerId);
    if (!player) {
        return cb(Code.FAIL);
    }
    var orgHighScore = player.highScore;
    player.updateHighScore(args.score);
    if(!player.endlessPVPBoxMgr.hasBox()) return cb(Code.FAIL, [], orgHighScore);
    var box = player.endlessPVPBoxMgr.getBoxData();
    if (box.drew) {
        return cb(Code.AREA.ENDLESS_BOX_EVER_DREW, [], orgHighScore);
    }
    player.endlessPVPBoxMgr.setDrew();
    // 根据得分计算宝箱奖励
    var occasionData = dataApi.EndlessType.findById(box.occasionId);
    if (!occasionData) {
        return cb(Code.AREA.NO_SUCH_OCCASION, [], orgHighScore);
    }
    var smallerMax = dataApi.EndlessScoreBox.getSmallerMaxByScore(occasionData.scoreRewardId, box.score);
    if (!smallerMax) {
        logger.debug('openBox [EndlessScoreBox] data not found!scoreRewardId = %s, score = %s', occasionData.scoreRewardId, box.score);
        return cb(Code.OK, [], orgHighScore);
    }
    // 考虑购买的加成
    var dropDouble = player.activityMgr.getFightDropdDouble(Consts.FIGHT_TYPE.ENDLESS);
    var dropId = smallerMax.dropId,
        awards = [],
        addBoxDouble = box.boxDouble,
        num = (smallerMax.num * (1 + addBoxDouble) ) * dropDouble;
    _.range(num).forEach(function () {
        var drops = dropUtils.getDropItems(dropId);
        drops =  player.applyDrops(drops,null,flow.ITEM_FLOW.ENDLESS_OPEN_BOX);
        awards.push({awards: drops});
        //// 给与奖励
        //player.applyDrops(drops);
    });


    var dropIds = dataUtils.getDropsBySystemId(box.systemId);
    var dropsSystemIdAwards = dropUtils.getDropItemsByDropIndexs(dropIds);
    var systemIdAwards =  player.applyDrops(dropsSystemIdAwards,null,flow.ITEM_FLOW.ENDLESS_OPEN_BOX);
    var randomInfo = player.randomShop.doNewShop(box.systemId, player.oldEndlessSingleHighBarr);
    cb(Code.OK, awards, orgHighScore,systemIdAwards,randomInfo);

    // endlessPVPBoxDao.getByPlayerId(player.id, function (err, rec) {
    //     if (err) {
    //         return cb(Code.DB_ERROR, [], orgHighScore);
    //     }
    //     if (!rec) {
    //         logger.debug('openBox no record found!');
    //         return cb(Code.FAIL, [], orgHighScore);
    //     }
    //     if (rec.drew) {
    //         return cb(Code.AREA.ENDLESS_BOX_EVER_DREW, [], orgHighScore);
    //     }
    //     endlessPVPBoxDao.setDrew(player.id, function (err, success) {
    //         if (err) {
    //             return cb(Code.DB_ERROR, [], orgHighScore);
    //         }
    //         if (success) {
    //             // 根据得分计算宝箱奖励
    //             var occasionData = dataApi.EndlessType.findById(rec.occasionId);
    //             if (!occasionData) {
    //                 return cb(Code.AREA.NO_SUCH_OCCASION, [], orgHighScore);
    //             }
    //             var smallerMax = dataApi.EndlessScoreBox.getSmallerMaxByScore(occasionData.scoreRewardId, rec.score);
    //             if (!smallerMax) {
    //                 logger.debug('openBox [EndlessScoreBox] data not found!scoreRewardId = %s, score = %s', occasionData.scoreRewardId, rec.score);
    //                 return cb(Code.OK, [], orgHighScore);
    //             }
    //             // 考虑购买的加成
    //             var dropDouble = player.activityMgr.getFightDropdDouble(Consts.FIGHT_TYPE.ENDLESS);
    //             var dropId = smallerMax.dropId,
    //                 awards = [],
    //                 addBoxDouble = rec.boxDouble,
    //                 num = (smallerMax.num * (1 + addBoxDouble) ) * dropDouble;
    //             _.range(num).forEach(function () {
    //                 var drops = dropUtils.getDropItems(dropId);
    //                 drops =  player.applyDrops(drops);
    //                 awards.push({awards: drops});
    //                 //// 给与奖励
    //                 //player.applyDrops(drops);
    //             });
    //
    //
    //             var dropIds = dataUtils.getDropsBySystemId(rec.systemId);
    //             var dropsSystemIdAwards = dropUtils.getDropItemsByDropIndexs(dropIds);
    //             var systemIdAwards =  player.applyDrops(dropsSystemIdAwards);
    //             var randomInfo = player.randomShop.doNewShop(rec.systemId, player.oldEndlessSingleHighBarr);
    //             cb(Code.OK, awards, orgHighScore,systemIdAwards,randomInfo);
    //         } else {
    //             return cb(Code.AREA.ENDLESS_BOX_EVER_DREW, [], orgHighScore);
    //         }
    //     });
    // });
};


pro.refreshEndlessSingleHighBarr = function(args, cb){
    logger.debug('refreshEndlessSingleHighBarr args = %j', args);
    var player = area.getPlayer(args.playerId);
    if (!player) {
        return cb(Code.FAIL);
    }

    player.refreshEndlessSingleHighBarr(args.endlessSingleHighBarr);
    cb(Code.OK);
};

pro.updateDivisionPlayer = function(dec, cb) {
    this.app.get('sync').exec('divisionSync.save',  [dec.playerId,dec.isRobot].join('_'), dec);
    cb();
};


/**
 * 匹配失败返还消耗
 * @param playerId
 * @param cb
 * @returns {*}
 */
pro.giveBackCost = function (playerId,cb) {
    var player = area.getPlayer(playerId),
        occasionData = dataApi.EndlessType.findById(player ? player.endlessPVPoccasionId : 0);
    if (!occasionData) {
        logger.error("赛事存在 赛事ID：%d",player.endlessPVPoccasionId);
        return cb(Code.FAIL,null);
    }
    // 返回消耗
    player.setMoneyByType(Consts.MONEY_TYPE.ENERGY, player.getMoneyByType(Consts.MONEY_TYPE.ENERGY) + occasionData.useEnergy,flow.MONEY_FLOW_GAIN.ENDLESS_MATCH_GIVEBACK);
    player.setMoneyByType(occasionData.moneyType, player.getMoneyByType(occasionData.moneyType) + occasionData.moneyNum,flow.MONEY_FLOW_GAIN.ENDLESS_MATCH_GIVEBACK);
    player.endlessPVPEffectBuffIds.forEach(function (buff) {
        player.buffManager.add(buff);
    });
    // 记录已经返还
    player.endEndlessPVPMatch();
    cb(null,Code.OK);
};

pro.saveEndlessPVPBox = function(args,cb){
    var player = area.getPlayer(args.playerId);
    player.endlessPVPBoxMgr.saveBox(args);
    cb(null,Code.OK);
}

pro.saveMatchCount = function (args,cb) {
    this.app.get('sync').exec('globalEndlessSync.save',  [args.occasionId].join('_'), args);
    cb();
};

pro.clearMatchCount = function (args,cb) {
    this.app.get('sync').exec('globalEndlessSync.clearEndless',  [args.occasionId].join('_'), args);
    cb();
};