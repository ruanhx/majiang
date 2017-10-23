/**
 * Created by kilua on 2016/7/5 0005.
 */
var pomelo = require('pomelo');
var util = require('util'),
    Consts = require('../../consts/consts'),
    weekScoreRankingListDao = require('../../dao/weekScoreRankingListDao'),
    scoreRankingListDao = require('../../dao/scoreRankingListDao'),
    catchRankingListDao = require('../../dao/catchRankingListDao'),
    playerManager = require('./playerManager'),
    EventEmitter = require('events').EventEmitter,
    rankListDao = require('../../dao/rankListDao');

var _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename);

/*
 *   默认排序函数，按id升序排列
 * */
function defSortBy(a, b) {
    return a.id - b.id;
}

var RankRecord = function (opts) {
    EventEmitter.call(this);

    opts = opts || {};
    this.id = opts.id || 0;
    //默认为总榜数据
    this.rankType = opts.rankType ||Consts.RANKING_TYPE.TOTAL;
};

util.inherits(RankRecord, EventEmitter);

RankRecord.prototype.getData = function () {
    return {id: this.id};
};

/*
 * 设置排行类型
 * **/
RankRecord.prototype.setRankType = function (rankType) {
    this.rankType = rankType;
};

RankRecord.prototype.update = function (rec) {
    // TODO: 子类实现
};
RankRecord.prototype.getClientInfo = function () {
    return {id: this.id};
};

RankRecord.prototype.markRank = function (newRank) {
    if (!this.rank || this.rank !== newRank) {
        var orgRank = this.rank || 0;
        this.rank = newRank;
        // this.emit('change', this, orgRank);
    }
};

var RankingList = function (opts) {
    EventEmitter.call(this);

    opts = opts || {};
    this.sortBy = opts.sortBy || defSortBy;
    this.capacity = opts.capacity;
    this.rankingList = [];
    this.ranksById = {};
    registerEvents(this);
    //默认为总榜数据
    this.rankType = Consts.RANKING_TYPE.TOTAL;
};
// 注册存储事件
var registerEvents = function (event) {
    event.on("updateCatchRank", function (dec) {
        // rpc调用存储数据 TODO: 多服务器的分发
        pomelo.app.rpc.area.rankRemote.updateCatchRankingList('area-server-1', dec, function () {
        });
    });
    event.on("clearCatchRank", function () {
        var dec = {};
        dec.remove = true;
        // rpc调用存储数据 TODO: 多服务器的分发
        pomelo.app.rpc.area.rankRemote.clearCatchRankingList('area-server-1', dec, function () {
        });
    });
    event.on("updateRank", function (dec) {
        // rpc调用存储数据 TODO: 多服务器的分发
        pomelo.app.rpc.area.rankRemote.updateRankingList('*', dec, function () {
        });
    });
    event.on("clearRank", function (dec) {
        // var dec = {};
        dec.remove = true;
        // rpc调用存储数据 TODO: 多服务器的分发
        pomelo.app.rpc.area.rankRemote.clearRankingList('area-server-1', dec, function () {
        });
    });
    event.on("updateBarrierRank", function (dec) {
        // rpc调用存储数据 TODO: 多服务器的分发
        pomelo.app.rpc.area.rankRemote.updateBarrierRankingList('*', dec, function () {
        });
    });
    // event.on("clearBarrierRank", function () {
    //     var dec = {};
    //     dec.remove = true;
    //     // rpc调用存储数据 TODO: 多服务器的分发
    //     pomelo.app.rpc.area.rankRemote.clearRankingList('area-server-1', dec, function () {
    //     });
    // });
};

util.inherits(RankingList, EventEmitter);

var pro = RankingList.prototype;


/*
 *   加载一条排行数据
 *   @return {Object} a ranking record object.
 * */
pro.loadRec = function (dbRankingRec) {
    // TODO: 子类实现
};

pro.ensureCapacity = function () {
    if (this.rankingList.length > this.capacity) {
        // 按capacity截尾处理
        var rmRecords = this.rankingList.splice(this.capacity, this.rankingList.length - this.capacity) || [],
            ranksById = this.ranksById;
        rmRecords.forEach(function (rec) {
            delete ranksById[rec.id];
        });
    }
};

/*
 *   排名变更事件处理
 * */
pro.onRankChange = function (rec, orgRank) {
    // 默认处理
    // this.emit('update', rec, orgRank);

    rankListDao.getPlayerRankingInfo([rec.id], function (err, playerInfoList) {
        var playerInfoById = _.indexBy(playerInfoList, 'id'),
            playerInfo = playerInfoById[rec.id],
            clientInfo = rec.getClientInfo();
            clientInfo.type = this.rankType;
        if (playerInfo) {
            clientInfo.name = playerInfo.playername;
            clientInfo.headPicId = playerInfo.headPicId;
            clientInfo.heroId = playerInfo.heroId;
        }

        if (rec.rank <= dataUtils.getOptionValue('Endless_RankDisplayNum', 10)) {
            // 广播在线玩家
            //this.emit('broadcast', rec);
            playerManager.get().broadcast('RankingList.update', clientInfo);
        } else {
            // 通知该玩家自己
            var player = playerManager.get().getPlayer(rec.playerId);
            if (player) {
                player.pushMsgToClient('RankingList.update', clientInfo);
            }
        }
    });
};

pro.add = function (dbRec) {
    var rec = this.loadRec(dbRec);
    if (rec) {
        this.rankingList.push(rec);
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
    self.rankingList.sort(self.sortBy);
    self.ensureCapacity();
    self.rankingList.forEach(function (rec, idx) {
        rec.markRank(idx + 1);
    });
    logger.info('load cnt = %s', self.rankingList.length);
};

//清除排行记录
pro.clearData = function () {
    this.rankingList = [];
    this.ranksById = {};
};

pro.getData = function () {
    return _.map(this.rankingList, function (rec, idx) {
        var dbRankRec = rec.getData();
        dbRankRec.rank = idx + 1;
        return dbRankRec;
    });
};

pro.update = function (rec) {
    var orgRec = this.findById(rec.id);
    var oldRank = 0;
    var isRefresh = false;
    //已经有数据有变化了
    if (orgRec) {
        oldRank = orgRec.rank || 0;
        isRefresh = orgRec.score < rec.score;
        orgRec.update(rec);
    }
    else {
        isRefresh = true;
        orgRec = this.add(rec);
    }
    this.rankingList.sort(this.sortBy);
    this.ensureCapacity();
    this.rankingList.forEach(function (rec, idx) {
        rec.markRank(idx + 1);
    });
    orgRec.type = this.rankType;
    if ((orgRec.rank < oldRank && orgRec.rank <= 10) || (oldRank == 0 && orgRec.rank <= 10)) {
        this.sendRollingMsg(orgRec);
    }
    if (isRefresh) {
        this.updateAndAdd(orgRec);
    }
    this.endlessDynamics(oldRank,orgRec);
};
/**
 * 无尽动态更新
 * @param oldRank
 * @param orgRec
 */
pro.endlessDynamics = function (oldRank,orgRec) {

}

/**
 *  发送跑马灯
 */
pro.sendRollingMsg = function (orgRec) {
//TODO: 子类实现
};

// 更新数据
pro.updateAndAdd = function (orgRec) {
    //TODO: 子类实现
};

pro.getRankInfo = function (rank) {
    return this.rankingList[rank - 1];
};

pro.getPlayerIdList = function () {
  var result = [];

};

/*
 *   @low {Number} 低排名，包含
 *   @high {Number} 高排名，包含
 *   通过区间获取排行榜数据列表
 * */
pro.getRangeInfo = function (low, high) {
    var result = [], i, l;
    high = high - 1;
    for (i = high, l = this.rankingList.length; i < Math.min(l, low); ++i) {
        var rankInfo = this.rankingList[i].getClientInfo();
        rankInfo.rank = i + 1;
        result.push(rankInfo);
    }
    return result;
};

pro.findById = function (id) {
    return this.ranksById[id];
};

/*
 * 设置排行类型 子类必须初始化
 * **/
pro.setRankType = function (rankType) {
    this.rankType = rankType;
};
module.exports.RankRecord = RankRecord;
module.exports.RankingList = RankingList;