/**
 * Created by rhx on 2017/6/12.
 */
var util = require('util');
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var RankingList = require('../rankingList').RankingList,
    RankRecord = require('../rankingList').RankRecord,
    dataUtils = require('../../../util/dataUtils'),
    dataApi = require('../../../util/dataApi'),
    playerManager = require('../playerManager'),
    Consts = require('../../../consts/consts'),
    mailRemote = require('../../../servers/world/remote/mailRemote'),
    rankListManager = require('../rankListManager'),
    barrierScoreRankingList = require('./barrierScoreRankingList'),
    rankListDao = require('../../../dao/rankListDao');


/*
 *   默认排序函数，按id升序排列
 * */
function sortByScoreDescThenPlayerIdAsc(a, b) {
    if (a.score === b.score) {
        return a.id - b.id;
    }
    return a.score - b.score;
}

var BarrierRankRecord = function (opts) {
    opts = opts || {};
    RankRecord.call(this, opts);
    this.score = opts.score;
    this.barrierId = opts.barrierId;
    this.playerId = opts.playerId;
    // this.rank = opts.rank;
    this.rankListByBarrier = [];
};

util.inherits(BarrierRankRecord, RankRecord);

BarrierRankRecord.prototype.update = function (rec) {
    if (rec.score < this.score) {
        this.score = rec.score;
    }
};

BarrierRankRecord.prototype.getData = function () {
    return {playerId: this.id, score: this.score};
};


BarrierRankRecord.prototype.getClientInfo = function () {
    return {playerId: this.playerId, score: this.score, rank: this.rank, barrier: this.barrierId};
};

var barrierRankingList = function (opts) {
    opts.sortBy = sortByScoreDescThenPlayerIdAsc;
    rankListManager.getInstance().setRankByType(this, Consts.RANKING_TYPE.BARRIER);
    RankingList.call(this, opts);
    this.rankingListByBarrier = {};
};

util.inherits(barrierRankingList, RankingList);

var pro = barrierRankingList.prototype;

// /*
//  * 设置排行类型
//  * **/
// pro.setRankType = function (rankType) {
//     //基类实现
// };

pro.loadRec = function (dbRankingRec) {
    dbRankingRec = dbRankingRec || {};
    dbRankingRec.id = [dbRankingRec.playerId, dbRankingRec.barrierId].join("_");
    dbRankingRec.rankType = Consts.RANKING_TYPE.BARRIER;
    return new BarrierRankRecord(dbRankingRec);
};

pro.getOrCreateByBarrierId = function (barrierId) {
    if (!this.rankingListByBarrier[barrierId]) {
        this.rankingListByBarrier[barrierId] = [];
    }
    return this.rankingListByBarrier[barrierId];
};
/**
 * 更新排行榜
 * @param rec
 */
pro.update = function (rec) {
    var orgRec = this.findById(rec.id);

    var isRefresh = false;
    var oldRank =0;
    //已经有数据有变化了
    if (orgRec) {
        oldRank = orgRec.rank || 0;
        isRefresh = orgRec.score > rec.score;
        orgRec.update(rec);
    }
    else {
        isRefresh = true;
        orgRec = this.add(rec);
    }

    this.getOrCreateByBarrierId(rec.barrierId).sort(this.sortBy);
    this.ensureCapacity(this.getOrCreateByBarrierId(rec.barrierId));
    this.getOrCreateByBarrierId(rec.barrierId).forEach(function (rec, idx) {
        rec.markRank(idx + 1);
    });
    orgRec.type = this.rankType;
    orgRec.barrierId = rec.barrierId;
    if (isRefresh) {
        this.updateAndAdd(orgRec);
    }
    // 排名变动更新关卡积分排行
    if ((orgRec.rank < oldRank) || oldRank == 0) {
        barrierScoreRankingList.getModle().updateList(_.values(this.rankingListByBarrier));
    }
};

pro.add = function (dbRec) {
    var rec = this.loadRec(dbRec);
    if (rec) {

        this.getOrCreateByBarrierId(rec.barrierId).push(rec);
        // this.rankingListByBarrier[rec.barrierId] = this.getOrCreateByBarrierId(rec.barrierId);
        this.ranksById[rec.id] = rec;

        // rec.on('change', this.onRankChange.bind(this));
    }
    return rec;
};

//将数据库排行榜数据读取到内存
pro.load = function (dbRankingList) {
    var self = this;
    dbRankingList = dbRankingList || [];
    // logger.debug('load dbRankingList = %j', dbRankingList);
    dbRankingList.forEach(function (dbRankingRec) {
        self.add(dbRankingRec);
    });
    // 排序
    dbRankingList.forEach(function (dbRankingRec) {
        self.getOrCreateByBarrierId(dbRankingRec.barrierId).sort(self.sortBy);
        self.ensureCapacity(self.getOrCreateByBarrierId(dbRankingRec.barrierId));
        self.getOrCreateByBarrierId(dbRankingRec.barrierId).forEach(function (rec, idx) {
            rec.markRank(idx + 1);
        });
    });
    barrierScoreRankingList.getModle().updateList(_.values(this.rankingListByBarrier));
    logger.info('load cnt = %s', self.rankingList.length);
};

pro.ensureCapacity = function (rankList) {
    if (rankList.length > this.capacity) {
        // 按capacity截尾处理
        var rmRecords = rankList.splice(this.capacity, rankList.length - this.capacity) || [],
            ranksById = this.ranksById;
        rmRecords.forEach(function (rec) {
            delete ranksById[rec.id];
        });
    }
};

//清除排行记录
pro.clearData = function () {
    this.rankingList = [];
    this.ranksById = {};
    this.rankingListByBarrier = {};
};



pro.getRangeInfo = function (low, high,barrierId) {
    var result = [], i, l;
    high = high - 1;
    var list = this.getOrCreateByBarrierId(barrierId);
    for (i = high, l = list.length; i < Math.min(l, low); ++i) {
        var rankInfo = list[i].getClientInfo();
        rankInfo.rank = i + 1;
        result.push(rankInfo);
    }
    return result;
};

// 更新数据
pro.updateAndAdd = function (orgRec) {
    this.emit("updateBarrierRank", orgRec);
    // rankListDao.updateAndAdd(orgRec);
};
var g_barrierRankingList;
module.exports.getModle = function () {
    if (!g_barrierRankingList) {
        g_barrierRankingList = new barrierRankingList({capacity: dataUtils.getOptionValue('Endless_RankMaxNum', 50)});
        g_barrierRankingList.setRankType(Consts.RANKING_TYPE.BARRIER);
    }
    return g_barrierRankingList;
};


