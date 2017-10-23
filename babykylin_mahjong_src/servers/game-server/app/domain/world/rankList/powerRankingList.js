/**
 * Created by rhx on 2017/7/12 0005.
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
    rankListManager = require('../rankListManager');


/*
 *   默认排序函数，按id升序排列
 * */
function sortByScoreDescThenPlayerIdAsc(a, b) {
    if (a.score === b.score) {
        return a.lastUpdateTime - b.lastUpdateTime;
    }
    return b.score - a.score;
}

var PowerRankRecord = function (opts) {
    opts = opts || {};
    RankRecord.call(this, opts);
    this.score = opts.score;
};

util.inherits(PowerRankRecord, RankRecord);

PowerRankRecord.prototype.update = function (rec) {
    if (rec.score > this.score) {
        this.score = rec.score;
        this.lastUpdateTime = rec.lastUpdateTime;
    }
};

PowerRankRecord.prototype.getData = function () {
    return {playerId: this.id, score: this.score,lastUpdateTime:this.lastUpdateTime};
};


PowerRankRecord.prototype.getClientInfo = function () {
    return {playerId: this.id, score: this.score, rank: this.rank};
};

var PowerRankingList = function (opts) {
    opts.sortBy = sortByScoreDescThenPlayerIdAsc;
    rankListManager.getInstance().setRankByType(this,Consts.RANKING_TYPE.POWER);
    RankingList.call(this, opts);
};

util.inherits(PowerRankingList, RankingList);

var pro = PowerRankingList.prototype;

// /*
//  * 设置排行类型
//  * **/
// pro.setRankType = function (rankType) {
//     //基类实现
// };

pro.loadRec = function (dbRankingRec) {
    dbRankingRec = dbRankingRec || {};
    dbRankingRec.id = dbRankingRec.playerId;
    return new PowerRankRecord(dbRankingRec);
};

/**
 *  发送奖励邮件
 */
pro.dispatchAwards = function () {
    var mr = new mailRemote(pomelo.app);
    var awardRecs = this.getData();
    var mailId, sysMail, mail, mailDrop;
    async.eachSeries(awardRecs,function (awardRec,callback) {
        mailId = dataApi.EndlessRankReward.getMailIdByTypeAndRank(Consts.RANKING_TYPE.POWER, awardRec.rank);
        sysMail = dataApi.SysEamil.findById(mailId);
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
    dec.id = Consts.RANKING_TYPE.POWER;
    dec.type = this.rankType;
    // this.emit("clearRank",dec);
};
// 更新数据
pro.updateAndAdd = function (orgRec) {
    this.emit("updateRank",orgRec);
};


var g_powerRankingList;
module.exports.getModle = function () {
    if (!g_powerRankingList) {
        g_powerRankingList = new PowerRankingList({capacity: dataUtils.getOptionValue('Endless_RankMaxNum', 50)});
        g_powerRankingList.setRankType(Consts.RANKING_TYPE.POWER);
    }
    return g_powerRankingList;
};


