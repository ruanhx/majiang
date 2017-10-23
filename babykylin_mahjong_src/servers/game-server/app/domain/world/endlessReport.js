/**
 * 无尽赛果记录
 * Created by LUJIAQUAN on 2017/6/8 0005.
 */

var util = require('util');
var pomelo = require('pomelo')
var logger = require('pomelo-logger').getLogger(__filename),
    async = require('async'),
    _ = require('underscore');

var dataUtils = require('../../util/dataUtils'),
    dataApi = require('../../util/dataApi'),
    mUtils = require('../../util/utils'),
    playerManager = require('./playerManager'),
    EventEmitter = require('events').EventEmitter,
    consts = require('../../consts/consts'),
    endlessReportDao = require('../../dao/endlessReportDao'),
    endlessOccasionDao = require('../../dao/endlessOccasionDao'),
    async = require('async');

// 注册存储事件
var registerEvents = function (event) {
    event.on("save", function (dec) {

    });
};
function EndlessReportVO(data) {
    if (!data) data = {};
    this.id = data.id || 0;
    this.endlessId = data.endlessId || "";
    this.result = data.result || 0;
    this.occasionId = data.occasionId || 0;
    this.drew = data.drew || 0,
        this.playerId = data.playerId || 0;
    this.recTime = data.recTime || 0;
    this.otherName = data.otherName || "";
    this.curHeroId = data.curHeroId || 0;
    this.otherHeroId = data.otherHeroId
    this.score = data.score || 0;
    this.otherScore = data.otherScore || 0;
    this.fightBfRank = data.fightBfRank || 0;
    this.fightBfWeekRank = data.fightBfWeekRank || 0;
    this.otherPlayerId = data.otherPlayerId || 0;
    this.isDouble = data.isDouble || 0;
    this.isDirty = 0;//数据是否脏掉

    this.makeStr = function () {
        var sql = " ('{endlessId}', {playerId},{result},{occasionId},{drew},{otherPlayerId},{recTime},'{otherName}',{curHeroId},{otherHeroId},{score},{otherScore}, {fightBfRank}, {fightBfWeekRank},{isDouble})";
        return sql.format({
            endlessId: this.endlessId,
            playerId: this.playerId,
            result: this.result,
            occasionId: this.occasionId,
            drew: this.drew,
            otherPlayerId: this.otherPlayerId,
            recTime: this.recTime,
            otherName: this.otherName,
            curHeroId: this.curHeroId,
            otherHeroId: this.otherHeroId,
            score: this.score,
            otherScore: this.otherScore,
            fightBfRank: this.fightBfRank,
            fightBfWeekRank: this.fightBfWeekRank,
            isDouble : this.isDouble
        });
    }
}

function EndlessOccasionVO(data) {
    if (!data) data = {};
    this.playerId = data.playerId || 0;
    this.occasionId = data.occasionId || 0;
    this.dailyCnt = data.dailyCnt || 0;
    this.dailyBuyCnt = data.dailyBuyCnt || 0;
    this.maxWin = data.maxWin || 0;
    this.maxLose = data.maxLose || 0;
    this.totalCnt = data.totalCnt || 0;
    this.isDirty = 0;//数据是否脏掉

    this.makeStr = function () {
        var sql = " ({playerId}, {occasionId}, {dailyCnt},{dailyBuyCnt},{maxWin},{maxLose},{totalCnt})";
        return sql.format({
            playerId: this.playerId,
            occasionId: this.occasionId,
            dailyCnt: this.dailyCnt,
            dailyBuyCnt: this.dailyBuyCnt,
            maxWin: this.maxWin,
            maxLose: this.maxLose,
            totalCnt: this.totalCnt
        });
    }
}

var EndlessReport = function () {
    EventEmitter.call(this);
    registerEvents(this);
    this.playerMap = {};//玩家数据表key:玩家id，value:{'EndlessReportVOList':list,'EndlessOccasionVOList:':list}
    this.outTimeMap = {};//玩家超时时间表 -- 下线后加入表并设置清除缓存时间  -- 定时检测该表剔除超时的玩家T出playerMap
}
util.inherits(EndlessReport, EventEmitter);
var pro = EndlessReport.prototype;

/**
 * 获取某个玩家的数据
 */
pro.getEndlessReportVOList = function (playerId, cb) {
    var self = this;
    if (!playerId || playerId === 0) return [];
    if (!self.playerMap[playerId]) {
        self.playerMap[playerId] = {}
    }
    if (!self.playerMap[playerId]["EndlessReportVOList"]) {
        logger.debug("getEndlessReportVOList 查数据库");
        self.playerMap[playerId]["EndlessReportVOList"] = [];
        //缓存不存在去数据库取
        endlessReportDao.getAllReports(playerId, function (err, rec) {
            self.playerMap[playerId]["EndlessReportVOList"] = rec;
            //如果玩家不是在线状态 --取完数要去timeOut注册一个超时列表，否则这段缓存讲一直不会被清理
            if (!playerManager.get().getPlayer(playerId)) {
                self.addOut(playerId);
            }
            cb(self.playerMap[playerId]["EndlessReportVOList"]);
        })
    } else {
        //如果玩家不是在线状态 --取完数要去timeOut注册一个超时列表，否则这段缓存讲一直不会被清理
        if (!playerManager.get().getPlayer(playerId)) {
            self.addOut(playerId);
        }
        cb(self.playerMap[playerId]["EndlessReportVOList"]);
    }

}

pro.getEndlessReport = function (playerId, endlessId, cb) {
    var self = this;
    self.getEndlessReportVOList(playerId, function (list) {
        var reportMap = _.indexBy(list, "endlessId");
        var report = reportMap[endlessId];
        cb(report);
    });
}

/**
 * 获取某个玩家的数据
 */
pro.getEndlessOccasionVOMap = function (playerId, cb) {
    var self = this;
    if (!playerId || playerId === 0) return [];
    if (!self.playerMap[playerId]) {
        self.playerMap[playerId] = {}
    }
    if (!self.playerMap[playerId]["EndlessOccasionVOMap"]) {
        //缓存不存在去数据库取
        endlessOccasionDao.getByPlayerId(playerId, function (err, rec) {
            var tempMap = {};
            _.each(rec, function (r) {
                tempMap[r.occasionId] = new EndlessOccasionVO(r);
            });
            self.playerMap[playerId]["EndlessOccasionVOMap"] = tempMap;
            //如果玩家不是在线状态 --取完数要去timeOut注册一个超时列表，否则这段缓存讲一直不会被清理
            if (!playerManager.get().getPlayer(playerId)) {
                self.addOut(playerId);
            }
            cb(self.playerMap[playerId]["EndlessOccasionVOMap"]);
        })
    } else {
        //如果玩家不是在线状态 --取完数要去timeOut注册一个超时列表，否则这段缓存讲一直不会被清理
        if (!playerManager.get().getPlayer(playerId)) {
            self.addOut(playerId);
        }
        cb(self.playerMap[playerId]["EndlessOccasionVOMap"]);
    }

}

/**
 * 删除超时缓存
 */
pro.removeOutTimeCache = function () {
    logger.debug("执行无尽赛果缓存清除~~");
    var self = this;
    var tOutTimeMap = self.outTimeMap;
    var now = (new Date()).getTime();
    for (var key in tOutTimeMap) {
        if (tOutTimeMap[key]) {
            if (tOutTimeMap[key] < now) {
                self.saveEndlessReport(key,self.playerMap[key], function () {
                    self.saveEndlessOccasion(self.playerMap[key], function () {
                        delete self.playerMap[key];
                        delete self.outTimeMap[key];
                    });
                });
            }
        }
    }
}

pro.playerOut = function (playerId) {
    this.addOut(playerId);
}

/**
 * 玩家加入清理列表
 * @param playerId
 */
pro.addOut = function (playerId) {
    logger.debug("无尽赛果  玩家加入超时列表~~");
    var self = this;
    this.outTimeMap[playerId] = (new Date()).getTime() + 30 * 60 * 1000;//半小时算超时
    self.saveEndlessReport(playerId,self.playerMap[playerId], function () {
    });
    self.saveEndlessOccasion(self.playerMap[playerId], function () {
    });
}

/**
 * 定时清理超时玩家，回收内存
 * @param playerId
 */
pro.removeOut = function (playerId) {
    logger.debug("无尽赛果  玩家移除超时列表~~");
    if (!this.outTimeMap[playerId])
        return;
    delete this.outTimeMap[playerId];
}

/**
 * 保存无尽赛果信息
 * @param player
 * @param sql
 * @param exe
 */
pro.saveEndlessReport = function (playerId,player, cb) {
    var valStr = "";
    if (!player) return cb();
    var endlessIds = [];
    if (player["EndlessReportVOList"]) {
        _.each(player["EndlessReportVOList"], function (endlessReportVO) {
            if (endlessReportVO) {
                if (endlessReportVO.isDirty === 1) {
                    valStr += endlessReportVO.makeStr() + ",";
                }
                endlessIds.push(endlessReportVO.endlessId);
            }
        });
    }
    if ("" !== valStr) {
        endlessReportDao.remove(playerId,endlessIds,function(err){
            endlessReportDao.save(valStr, function (err, faffectedRows) {
                logger.debug("endlessReportDao 保存数据");
                cb();
            });
        });
    } else {
        cb();
    }
}

/**
 * 保存无尽战役信息
 * @param player
 * @param sql
 * @param exe
 */
pro.saveEndlessOccasion = function (player, cb) {
    var valStr = "";
    if (!player) return cb();
    if (player["EndlessOccasionVOMap"]) {
        _.each(_.values(player["EndlessOccasionVOMap"]), function (endlessOccasionVO) {
            if (endlessOccasionVO) {
                if (endlessOccasionVO.isDirty === 1) {
                    valStr += endlessOccasionVO.makeStr() + ",";
                    //endlessOccasionVO.isDirty = 0;
                }
            }
        });
    }
    if ("" !== valStr) {
        endlessOccasionDao.save(valStr, function (err, faffectedRows) {
            cb();
        });
    } else {
        cb();
    }
}

/**
 * 保存全部
 */
pro.saveAll = function (cb) {
    var self = this;
    var tPlayerMap = this.playerMap;
    async.eachSeries(_.keys(tPlayerMap), function (key, callBack) {
        self.saveEndlessReport(key,self.playerMap[key], function () {
            self.saveEndlessOccasion(self.playerMap[key], function () {
                callBack();
            });
        });
    }, function (err) {
        if (err) {
            cb();
        }
    });
}


/***
 * +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */
/**
 * 修改赛果记录
 * @param args {endlessId,playerId ,result ,occasionId ,otherPlayerId ,otherName ,curHeroId ,otherHeroId ,score ,otherScore ,fightBfRank ,fightBfWeekRank ,curName ,isRobotFight }
 * @param cb
 */
pro.upsertReport = function (args, cb) {
    var self = this;
    async.parallel([function (callBack) {
        if(!args.playerId) return callBack();
        if(args.playerId === 0) return callBack();
        self.upsertSingleEndlessReport(args, function () {
            if (args.isRobotFight === 1) return callBack();
            self.statEndlessResult(args.playerId, args.occasionId, args.result, function () {
                callBack();
            });
        });
    }, function (callBack) {
        if(!args.otherPlayerId) return callBack();
        if(args.otherPlayerId === 0) return callBack();
            self.upsertSingleEndlessReport({
                endlessId: args.endlessId,
                playerId: args.otherPlayerId,//
                result: !args.result ? 1 : 0,
                occasionId: args.occasionId,
                otherPlayerId: args.playerId,//
                otherName: args.curName,//
                curHeroId: args.otherHeroId,//
                otherHeroId: args.curHeroId,//
                score: args.otherScore,//
                otherScore: args.score,//
                fightBfRank: args.fightBfRank,
                fightBfWeekRank: args.fightBfWeekRank,
                isDouble: args.isDouble
            }, function () {
                if (args.isRobotFight === 1) return callBack();
                self.statEndlessResult(args.otherPlayerId, args.occasionId, args.result === 1 ? 0 : 1, function () {
                    callBack();
                });
            });//other 跟 cur 互换
    }], function (err, results) {
        cb();
    });

}

pro.getByPlayerIdAndOccasionId = function (playerId, occasionId, cb) {
    this.getEndlessOccasionVOMap(playerId, function (endlessOccasionVOMap) {
        cb(endlessOccasionVOMap[occasionId]);
    })
}

/**
 * 修改一个人的赛果记录
 * @param args {endlessId, playerId, result, occasionId,otherPlayerId, otherName, curHeroId, otherHeroId, score, otherScore, fightBfRank, fightBfWeekRank}
 */
pro.upsertSingleEndlessReport = function (args, cb) {
    var self = this;
    self.getReportCnt(args.playerId, function (recCount) {
        if (recCount > dataUtils.getOptionValue('Endless_ResultNum', 10)) {
            self.removeReportOne(args.playerId, function () {
                self.addReport(args, function () {
                    cb();
                });
            });
        } else {
            self.addReport(args, function () {
                cb();
            });
        }

    });
}

/**
 * 赛果条数
 * @param playerId
 */
pro.getReportCnt = function (playerId, cb) {
    this.getEndlessReportVOList(playerId, function (list) {
        cb(list.length);
    });
}

/**
 * 删除一条无尽赛果
 * @param playerId
 */
pro.removeReportOne = function (playerId, cb) {
    this.getEndlessReportVOList(playerId, function (endlessReportVOList) {
        var now = new Date().getTime();
        var minCreateTime = now, minDrewTime = now;
        var minCreateIndex = -1, miniDrewIndex = -1;
        var removeIndex = -1;
        endlessReportVOList.forEach(function (rec, index) {
            if (rec.recTime < minCreateTime) {
                minCreateTime = rec.recTime;
                minCreateIndex = index;
            }
            if (rec.recTime < minDrewTime) {
                minDrewTime = rec.recTime;
                miniDrewIndex = index;
            }
        });
        if (miniDrewIndex !== -1) {
            removeIndex = miniDrewIndex;
        } else {
            removeIndex = minCreateIndex;
        }
        if (removeIndex !== -1) {
            endlessReportVOList.splice(removeIndex, 1);
        }
        cb();
    });
}

/**
 * 添加无尽赛果
 * @param player
 * @param args {endlessId,playerId,result,occasionId,otherPlayerId,otherName,curHeroId,otherHeroId,score,otherScore, fightBfRank, fightBfWeekRank}
 * @returns {number}
 */
pro.addReport = function (args, cb) {
    this.getEndlessReportVOList(args.playerId, function (endlessReportVOList) {
        args.drew = 0;
        args.recTime = (new Date()).getTime();
        var vo = new EndlessReportVO(args);
        vo.isDirty = 1;
        endlessReportVOList.push(vo);
        cb();
    });
}

/**
 * 修改战役的连胜跟连败值
 * @param playerId
 * @param occasionId
 * @param result
 */
pro.statEndlessResult = function (playerId, occasionId, result, cb) {
    this.getEndlessOccasionVOMap(playerId, function (endlessOccasionVOMap) {
        var occasion = endlessOccasionVOMap[occasionId];
        if (!occasion) return;
        logger.debug("设置连胜连败值result：%s", result);
        if (result === 1) {
            occasion.maxWin += 1;
            occasion.maxLose = 0;
        } else {
            occasion.maxLose += 1;
            occasion.maxWin = 0;
        }
        occasion.isDirty = 1;
        cb();
    });
}

/**
 * 同步战役数据
 * @param data
 */
pro.syncEndlessOccasion = function (data) {
    this.getEndlessOccasionVOMap(data.playerId, function (endlessOccasionVOMap) {
        var occasion = endlessOccasionVOMap[data.occasionId];
        if (occasion) {
            occasion.dailyCnt = data.dailyCnt || 0;
            occasion.dailyBuyCnt = data.dailyBuyCnt || 0;
            occasion.totalCnt = data.totalCnt || 0;
            occasion.isDirty = 1;
        } else {
            endlessOccasionVOMap[data.occasionId] = new EndlessOccasionVO(data);
            endlessOccasionVOMap[data.occasionId].isDirty = 1;
        }
    });
}

var instance;
module.exports.get = function () {
    if (!instance) {
        instance = new EndlessReport();
    }
    return instance;
};




