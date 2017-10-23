/**
 * Created by kilua on 2016/7/5 0005.
 */

var util = require('util');

var logger = require('pomelo-logger').getLogger(__filename),
    async = require('async'),
    _ = require('underscore');

var RankingList = require('./rankingList').RankingList,
    RankRecord = require('./rankingList').RankRecord,
    dataUtils = require('../../util/dataUtils'),
    dataApi = require('../../util/dataApi'),
    playerManager = require('./playerManager'),
    playerMiniData = require('./playerMiniData'),
    Consts = require('../../consts/consts');
    weekScoreRankingAwardDao = require('../../dao/weekScoreRankingAwardDao'),
    weekScoreRankingListDao = require('../../dao/weekScoreRankingListDao'),
    scoreRankingAwardDao = require('../../dao/scoreRankingAwardDao'),
    mailRemote = require('../../servers/world/remote/mailRemote'),
    pomelo = require('pomelo'),
    endlessMgr = require('./endlessMgr');
    scoreRankingListDao = require('../../dao/scoreRankingListDao');

/*
 *   默认排序函数，按id升序排列
 * */
function sortByScoreDescThenPlayerIdAsc(a, b) {
    if (a.score === b.score) {
        return a.id - b.id;
    }
    return b.score - a.score;
}

var ScoreRankRecord = function (opts) {
    opts = opts || {};
    RankRecord.call(this, opts);
    this.score = opts.score;
};

util.inherits(ScoreRankRecord, RankRecord);

ScoreRankRecord.prototype.update = function (rec) {
    if (rec.score > this.score) {
        this.score = rec.score;
    }
};

ScoreRankRecord.prototype.getData = function () {
    return {playerId: this.id, score: this.score};
};


ScoreRankRecord.prototype.getClientInfo = function () {
    return {playerId: this.id, score: this.score, rank: this.rank};
};

var ScoreRankingList = function (opts) {
    opts.sortBy = sortByScoreDescThenPlayerIdAsc;
    RankingList.call(this, opts);
};

util.inherits(ScoreRankingList, RankingList);

var pro = ScoreRankingList.prototype;

pro.endlessDynamics = function (oldRank,orgRec) {
    var rankLimit = dataUtils.getOptionValue('Endless_TrendsRankCondition',50);
    if ((orgRec.rank < oldRank && orgRec.rank <= rankLimit) || (oldRank == 0 && orgRec.rank <= rankLimit)) {
        var miniData = playerMiniData.getInstance().getPlayerById(orgRec.id);
        var playerName = miniData ? miniData.playername : "";
        endlessMgr.getInstance().addPlayerDynamics({playername:playerName,score:orgRec.score,rank:orgRec.rank});
    }
}

/*
 * 设置排行类型
 * **/
pro.setRankType=function(rankType ){
    //基类实现
};

pro.loadRec = function (dbRankingRec) {
    dbRankingRec = dbRankingRec || {};
    dbRankingRec.id = dbRankingRec.playerId;
    return new ScoreRankRecord(dbRankingRec);
};

/*
 *   排名变更事件处理
 * */
pro.onRankChange = function (rec, orgRank) {
    scoreRankingListDao.getPlayerRankingInfo([rec.id], function (err, playerInfoList) {
        var playerInfoById = _.indexBy(playerInfoList, 'id'),
            playerInfo = playerInfoById[rec.id],
            clientInfo = rec.getClientInfo();
        if (playerInfo) {
            clientInfo.name = playerInfo.playername;
            clientInfo.headPicId = playerInfo.headPicId;
            clientInfo.heroId = playerInfo.heroId;
        }

        if (rec.rank <= dataUtils.getOptionValue('Endless_RankDisplayNum', 10)) {
            // 广播在线玩家
            //this.emit('broadcast', rec);
            playerManager.get().broadcast('scoreRankingList.update', clientInfo);
        } else {
            // 通知该玩家自己
            var player = playerManager.get().getPlayer(rec.playerId);
            if (player) {
                player.pushMsgToClient('scoreRankingList.update', clientInfo);
            }
        }
    });
};

// 更新数据
pro.updateAndAdd = function (orgRec) {
    scoreRankingListDao.updateAndAdd(orgRec);

    // pomelo.app.rpc.area.playerRemote.progressMission('*', args, function () {
    //
    // });
};

pro.sendRollingMsg = function (orgRec) {
    var args ={};
    // args.playerId = orgRec.id;
    // var player = playerManager.get().getPlayer(orgRec.id);
    var player = playerMiniData.getInstance().getPlayerById(orgRec.id);
    args.playerName = player? player.playername : "";
    var listTemp = dataApi.Mission.getDataGroup(Consts.MISSION_CONDITION_TYPE.ENDLESS_RANK_TEN,Consts.MISSION_TYPE.ROLLING_MSG,32);
    if (!listTemp){
        return;
    }
    if(listTemp.length<=0){
        return;
    }
    if (!listTemp[0].textInformation){
        return;
    }
    args.content = listTemp[0].textInformation;
    args.value = [{type:Consts.MAIL_PARAM_TYPE.TRUE_VALUE,value:orgRec.rank}];
    playerManager.get().rollingMessage({info:args,type:0});
};

//通过邮件发送排行奖励
pro.dispatchAwards = function (type) {
    //logger.debug("发送总榜排行榜奖励邮件");
    var mr = new mailRemote(pomelo.app);
    var awardRecs = this.getData();
    var mailId, sysMail, mail, mailDrop;
    async.eachSeries(awardRecs,function(awardRec,callback){
        mailId = dataApi.EndlessRankReward.getMailIdByTypeAndRank(type, awardRec.rank);
        //logger.debug("@@@@@ mailId：%d",mailId);
        sysMail = dataApi.SysEamil.findById(mailId);
        //logger.debug("@@@@@ sysMail：%j",sysMail);
        if (sysMail) {
            //发送邮件
            mail = {title: sysMail.title, info: sysMail.text, sender: sysMail.name, drop: sysMail.dropId,
                infoParams:JSON.stringify([{type:Consts.MAIL_PARAM_TYPE.TRUE_VALUE,value:awardRec.rank}])};
            mr.CreateMailNew(awardRec.playerId, mail, function (err) {
                callback();
            });
        }
    },function (err) {

    });
};

// pro.dispatchAwards = function () {
//     var awardRecs = this.getData();
//     scoreRankingAwardDao.dispatch(awardRecs, function (err, success) {
//         logger.info('dispatchAwards %s!', success ? 'success' : 'fail');
//         // 推送在线且获得奖励的玩家
//         awardRecs.forEach(function (awardRec) {
//             playerManager.get().pushMsgToPlayer(awardRec.playerId, 'scoreRankingList.award', {
//                 rank: awardRec.rank,
//                 drew: 0
//             });
//         });
//     });
// };

var WeekScoreRankingList = function (opts) {
    ScoreRankingList.call(this, opts);
};

util.inherits(WeekScoreRankingList, ScoreRankingList);


/*
 * 设置排行类型
 * **/
WeekScoreRankingList.prototype.setRankType=function(rankType ){
    //基类实现
};

WeekScoreRankingList.prototype.endlessDynamics = function (oldRank,orgRec) {

}

/*
* 排行榜有变化
* **/
WeekScoreRankingList.prototype.onRankChange = function (rec, orgRank) {
    // 需要刷新name、headPicId和heroId是由于可能有玩家从21跳进来，客户端只有1-20名的数据，会缺失这些信息
    scoreRankingListDao.getPlayerRankingInfo([rec.id], function (err, playerInfoList) {
        var playerInfoById = _.indexBy(playerInfoList, 'id'),
            playerInfo = playerInfoById[rec.id],
            clientInfo = rec.getClientInfo();
        if (playerInfo) {
            clientInfo.name = playerInfo.playername;
            clientInfo.headPicId = playerInfo.headPicId;
            clientInfo.heroId = playerInfo.heroId;
        }

        if (rec.rank <= dataUtils.getOptionValue('Endless_RankDisplayNum', 10)) {
            // 广播在线玩家
            playerManager.get().broadcast('weekScoreRankingList.update', clientInfo);
        }
        else
        {
            // 通知该玩家自己
            var player = playerManager.get().getPlayer(rec.playerId);
            if (player) {
                player.pushMsgToClient('weekScoreRankingList.update', clientInfo);
                  }
        }
    });
};
// 更新数据
WeekScoreRankingList.prototype.updateAndAdd = function (orgRec) {
    weekScoreRankingListDao.updateAndAdd(orgRec);
};
// /*
// * 下发周榜奖励
// * **/
// WeekScoreRankingList.prototype.dispatchAwards = function () {
//     var awardRecs = this.getData();
//     var self = this;
//     weekScoreRankingAwardDao.dispatch(awardRecs, function (err, success) {
//         logger.info('dispatchAwards dispatch week ranking awards %s, cnt = %s!', success ? 'success' : 'fail', awardRecs.length);
//         if (success) {
//             //清理数据库周榜数据
//             weekScoreRankingListDao.clear(function (err, success) {
//                 logger.info('dispatchAwards clear last week ranking list %s!', success ? 'success' : 'fail');
//             });
//             // 推送在线且获得奖励的玩家
//             awardRecs.forEach(function (awardRec) {
//                 playerManager.get().pushMsgToPlayer(awardRec.playerId, 'weekScoreRankingList.award', {
//                     rank: awardRec.rank,
//                     drew: 0
//                 });
//
//                 playerManager.get().pushMsgToPlayer(awardRec.playerId, 'player.updateProp', {
//                     prop: "weekHighScore",
//                     value: 0
//                 });
//             });
//         }
//     });
// };

//通过邮件发送排行奖励
WeekScoreRankingList.prototype.dispatchAwards = function () {
    //logger.debug("发送周榜排行榜奖励邮件");
    var mr = new mailRemote(pomelo.app);
    var awardRecs = this.getData();
    var mailId, sysMail, mail, mailDrop;
    async.eachSeries(awardRecs,function (awardRec,callback) {
        mailId = dataApi.EndlessRankReward.getMailIdByTypeAndRank(Consts.RANKING_TYPE.WEEK, awardRec.rank);
        //logger.debug("@@@@@ mailId：%d",mailId);
        sysMail = dataApi.SysEamil.findById(mailId);
        //logger.debug("@@@@@ sysMail：%j",sysMail);
        if (sysMail) {
            //发送邮件
            mail = {title: sysMail.title, info: sysMail.text, sender: sysMail.name, drop: sysMail.dropId,
                infoParams:JSON.stringify([{type:Consts.MAIL_PARAM_TYPE.TRUE_VALUE,value:awardRec.rank}])};
            mr.CreateMailNew(awardRec.playerId, mail, function (err) {
                callback();
            });
        }
    },function (err) {

    });

    //清理数据库数据
    weekScoreRankingListDao.clear(function (err, success) {
        logger.info('dispatchAwards clear last weekScoreRankingList %s!', success ? 'success' : 'fail');
    });
};

/*
* 通过玩家id获取 是否有周榜数据
* **/
WeekScoreRankingList.prototype.isHaveWeekRank=function(playerId )
{
    return null!=this.findById(playerId);
};

var g_scoreRankingList, g_weekScoreRankingList;
module.exports.getScoreRankingList = function () {
    if (!g_scoreRankingList) {
        g_scoreRankingList = new ScoreRankingList({capacity: dataUtils.getOptionValue('Endless_RankMaxNum', 100)});
        g_scoreRankingList.setRankType(Consts.RANKING_TYPE.TOTAL);
    }
    return g_scoreRankingList;
};

module.exports.getWeekScoreRankingList = function () {
    if (!g_weekScoreRankingList) {
        g_weekScoreRankingList = new WeekScoreRankingList({capacity: dataUtils.getOptionValue('Endless_RankMaxNum', 100)});
        g_weekScoreRankingList.setRankType(Consts.RANKING_TYPE.WEEK);
    }
    return g_weekScoreRankingList;
};

