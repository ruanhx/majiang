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
        return a.id - b.id;
    }
    return b.score - a.score;
}

var BarrierScoreRankRecord = function (opts) {
    opts = opts || {};
    RankRecord.call(this, opts);
    this.score = opts.score;
};

util.inherits(BarrierScoreRankRecord, RankRecord);

BarrierScoreRankRecord.prototype.update = function (rec) {
    if (rec.score > this.score) {
        this.score = rec.score;
    }
};

BarrierScoreRankRecord.prototype.getData = function () {
    return {playerId: this.id, score: this.score, rank: this.rank};
};


BarrierScoreRankRecord.prototype.getClientInfo = function () {
    return {playerId: this.id, score: this.score, rank: this.rank};
};

var BarrierScoreRankingList = function (opts) {
    opts.sortBy = sortByScoreDescThenPlayerIdAsc;
    rankListManager.getInstance().setRankByType(this, Consts.RANKING_TYPE.BARRIER_SCORE);
    RankingList.call(this, opts);
};

util.inherits(BarrierScoreRankingList, RankingList);

var pro = BarrierScoreRankingList.prototype;

// /*
//  * 设置排行类型
//  * **/
// pro.setRankType = function (rankType) {
//     //基类实现
// };

pro.loadRec = function (dbRankingRec) {
    dbRankingRec = dbRankingRec || {};
    dbRankingRec.id = dbRankingRec.playerId;
    return new BarrierScoreRankRecord(dbRankingRec);
};

/**
 *  发送奖励邮件
 */
pro.dispatchAwards = function () {

    var mr = new mailRemote(pomelo.app);
    var awardRecs = this.getData();
    var mailId, sysMail, mail, mailDrop;
    async.eachSeries(awardRecs, function (awardRec, callback) {
        mailId = dataApi.EndlessRankReward.getMailIdByTypeAndRank(Consts.RANKING_TYPE.BARRIER_SCORE, awardRec.rank);
        sysMail = dataApi.SysEamil.findById(mailId);
        if (sysMail) {
            //发送邮件
            mail = {
                title: sysMail.title, info: sysMail.text, sender: sysMail.name, drop: sysMail.dropId,
                infoParams: JSON.stringify([{type: Consts.MAIL_PARAM_TYPE.TRUE_VALUE, value: awardRec.rank}])
            };
            mr.CreateMailNew(awardRec.playerId, mail, function (err) {
                callback();
            });
        }
    }, function (err) {

    });

    //清理数据库数据
    // this.emit("clearRank");
};
// 更新数据
// pro.updateAndAdd = function (orgRec) {
//     this.emit("updateRank",orgRec);
// };

pro.update = function (rec) {
    var orgRec = this.findById(rec.id);
    //已经有数据有变化了
    if (orgRec) {
        rec.score += orgRec.score;
        orgRec.update(rec);
    }
    else {
        this.add(rec);
    }
    this.rankingList.sort(this.sortBy);
    this.ensureCapacity();
    this.rankingList.forEach(function (rec, idx) {
        rec.markRank(idx + 1);
    });
};

pro.updateList = function (barrierRankList) {
    var self = this;
    this.clearData();
    barrierRankList.forEach(function (rankList) {
        rankList.forEach(function (record) {
            var score = dataApi.RacingScore.getScoreByRank(record.rank);
            self.update({
                id: record.playerId,
                playerId: record.playerId,
                type: Consts.RANKING_TYPE.BARRIER_SCORE,
                score: score || 0,
                rankType: Consts.RANKING_TYPE.BARRIER_SCORE
            });
        });
    });

};

var g_barrierScoreRankingList;
module.exports.getModle = function () {
    if (!g_barrierScoreRankingList) {
        g_barrierScoreRankingList = new BarrierScoreRankingList({capacity: dataUtils.getOptionValue('Endless_RankMaxNum', 50)});
        g_barrierScoreRankingList.setRankType(Consts.RANKING_TYPE.BARRIER_SCORE);
    }
    return g_barrierScoreRankingList;
};


