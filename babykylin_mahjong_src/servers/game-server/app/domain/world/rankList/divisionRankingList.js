/**
 * Created by hongxiang on 2016/7/5 0005.
 */

var util = require('util');
var pomelo = require('pomelo');
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
    rankListManager = require('../rankListManager'),
    rankListDao = require('../../../dao/rankListDao');


/*
 *   默认排序函数，按id升序排列
 * */
function sortByScoreDescThenPlayerIdAsc(a, b) {
    if (a.score === b.score) {
        return a.id - b.id;
    }
    return b.score - a.score;
}

var DivisionRankRecord = function (opts) {
    opts = opts || {};
    RankRecord.call(this, opts);
    this.score = opts.score;
};

util.inherits(DivisionRankRecord, RankRecord);

DivisionRankRecord.prototype.update = function (rec) {
    if (rec.score > this.score) {
        this.score = rec.score;
    }
};

DivisionRankRecord.prototype.getData = function () {
    return {playerId: this.id, score: this.score};
};


DivisionRankRecord.prototype.getClientInfo = function () {
    return {playerId: this.id, score: this.score, rank: this.rank};
};

var DivisionRankingList = function (opts) {
    opts.sortBy = sortByScoreDescThenPlayerIdAsc;
    rankListManager.getInstance().setRankByType(this,Consts.RANKING_TYPE.DIVISION);
    RankingList.call(this, opts);
};

util.inherits(DivisionRankingList, RankingList);

var pro = DivisionRankingList.prototype;

// /*
//  * 设置排行类型
//  * **/
// pro.setRankType = function (rankType) {
//     //基类实现
// };

pro.loadRec = function (dbRankingRec) {
    dbRankingRec = dbRankingRec || {};
    dbRankingRec.id = dbRankingRec.playerId;
    return new DivisionRankRecord(dbRankingRec);
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
        mailId = dataApi.EndlessRankReward.getMailIdByTypeAndRank(Consts.RANKING_TYPE.DIVISION, awardRec.rank);
        // logger.debug("@@@@@ mailId：%d",mailId);
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
    var dec = {};
    dec.id = Consts.RANKING_TYPE.DIVISION;
    dec.type = this.rankType;
    this.emit("clearRank",dec);
};
// 更新数据
pro.updateAndAdd = function (orgRec) {
    this.emit("updateRank",orgRec);
};

pro.sendRollingMsg = function (orgRec) {
    var args ={};
    // args.playerId = orgRec.id;
    var player = playerMiniData.getInstance().getPlayerById(orgRec.id);
    args.playerName = player? player.playername : "";
    var listTemp = dataApi.Mission.getDataGroup(Consts.MISSION_CONDITION_TYPE.DIVISION_RANK_TEN,Consts.MISSION_TYPE.ROLLING_MSG,32);
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

var g_divisionRankingList;
module.exports.getModle = function () {
    if (!g_divisionRankingList) {
        g_divisionRankingList = new DivisionRankingList({capacity: dataUtils.getOptionValue('Endless_RankMaxNum', 50)});
        g_divisionRankingList.setRankType(Consts.RANKING_TYPE.DIVISION);
    }
    return g_divisionRankingList;
};


