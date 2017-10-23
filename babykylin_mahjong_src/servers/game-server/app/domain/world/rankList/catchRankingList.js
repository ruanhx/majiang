/**
 * Created by kilua on 2016/7/5 0005.
 */

var util = require('util');
var pomelo = require('pomelo')
var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore'),
    async = require('async');

var RankingList = require('../rankingList').RankingList,
    RankRecord = require('../rankingList').RankRecord,
    dataUtils = require('../../../util/dataUtils'),
    dataApi = require('../../../util/dataApi'),
    playerManager = require('../playerManager'),
    Consts = require('../../../consts/consts'),
    mailRemote = require('../../../servers/world/remote/mailRemote'),
    catchRankingListDao = require('../../../dao/catchRankingListDao');


/*
 *   默认排序函数，按id升序排列
 * */
function sortByScoreDescThenPlayerIdAsc(a, b) {
    if (a.score === b.score) {
        return a.id - b.id;
    }
    return b.score - a.score;
}

var CatchRankRecord = function (opts) {
    opts = opts || {};
    RankRecord.call(this, opts);
    this.score = opts.score;
};

util.inherits(CatchRankRecord, RankRecord);

CatchRankRecord.prototype.update = function (rec) {
    if (rec.score > this.score) {
        this.score = rec.score;
    }
};

CatchRankRecord.prototype.getData = function () {
    return {playerId: this.id, score: this.score};
};


CatchRankRecord.prototype.getClientInfo = function () {
    return {playerId: this.id, score: this.score, rank: this.rank};
};

var CatchRankingList = function (opts) {
    opts.sortBy = sortByScoreDescThenPlayerIdAsc;
    RankingList.call(this, opts);
};

util.inherits(CatchRankingList, RankingList);

var pro = CatchRankingList.prototype;

/*
 * 设置排行类型
 * **/
pro.setRankType = function (rankType) {
    //基类实现
};

pro.loadRec = function (dbRankingRec) {
    dbRankingRec = dbRankingRec || {};
    dbRankingRec.id = dbRankingRec.playerId;
    return new CatchRankRecord(dbRankingRec);
};

/*
 *   排名变更事件处理
 * */
pro.onRankChange = function (rec, orgRank) {
    catchRankingListDao.getPlayerRankingInfo([rec.id], function (err, playerInfoList) {
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
            playerManager.get().broadcast('catchRankingList.update', clientInfo);
        } else {
            // 通知该玩家自己
            var player = playerManager.get().getPlayer(rec.playerId);
            if (player) {
                player.pushMsgToClient('catchRankingList.update', clientInfo);
            }
        }
    });
};

/**
 *  发送奖励邮件
 */
pro.dispatchAwards = function () {
    //logger.debug("发送抓宝排行榜奖励邮件");
    var mr = new mailRemote(pomelo.app);
    var awardRecs = this.getData();
    var mailId, sysMail, mail, mailDrop;
    async.eachSeries(awardRecs,function (awardRec,callback) {
        mailId = dataApi.EndlessRankReward.getMailIdByTypeAndRank(Consts.RANKING_TYPE.CATCH, awardRec.rank);
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
    this.emit("clearCatchRank");
    // catchRankingListDao.clear(function (err, success) {
    //     logger.info('dispatchAwards clear last catch ranking list %s!', success ? 'success' : 'fail');
    // });
};
// 更新数据
pro.updateAndAdd = function (orgRec) {
    this.emit("updateCatchRank",orgRec);
};

pro.sendRollingMsg = function (orgRec) {
    var args ={};
    // args.playerId = orgRec.id;
    var player = playerMiniData.getInstance().getPlayerById(orgRec.id);
    args.playerName = player? player.playername : "";
    var listTemp = dataApi.Mission.getDataGroup(Consts.MISSION_CONDITION_TYPE.CATCH_RANK_TEN,Consts.MISSION_TYPE.ROLLING_MSG,32);
    if (!listTemp){
        return;
    }
    if (!listTemp[0].textInformation){
        return;
    }
    args.content = listTemp[0].textInformation;
    args.value = [{type:Consts.MAIL_PARAM_TYPE.TRUE_VALUE,value:orgRec.rank}];
    playerManager.get().rollingMessage({info:args,type:0});
};

var g_catchRankingList;
module.exports.getCatchRankingList = function () {
    if (!g_catchRankingList) {
        g_catchRankingList = new CatchRankingList({capacity: dataUtils.getOptionValue('Endless_RankMaxNum', 50)});
        g_catchRankingList.setRankType(Consts.RANKING_TYPE.CATCH);
    }
    return g_catchRankingList;
};


