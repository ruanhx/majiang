/**
 * Created by rhx on 2017/8/28.
 */
var logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo');
var dataUtils = require('../../util/dataUtils'),
    _ = require('underscore');
globalEndlessDao = require('../../dao/globalEndlessDao');
dataApi = require('../../util/dataApi');

var endlessMgr = function () {
    this.occasionCount = {};
    this.playerDynamics = [];
    EventEmitter.call(this);
    registerEvents(this);
}
util.inherits(endlessMgr, EventEmitter);
var pro = endlessMgr.prototype;

// 注册存储事件
var registerEvents = function (event) {
    event.on("saveMatchCnt", function (dec) {
        var data = {
            occasionId: dec.occasionId,
            count: dec.count
        }
        // rpc调用存储数据 TODO: 多服务器的分发
        pomelo.app.rpc.area.endlessRemote.saveMatchCount('area-server-1', data, function () {
        });
    });
    event.on("clearMatchCnt", function () {

        // rpc调用存储数据 TODO: 多服务器的分发
        pomelo.app.rpc.area.endlessRemote.clearMatchCount('area-server-1', {}, function () {
        });
    });
};

pro.matchCntReset = function () {
    this.occasionCount = {};
    this.emit("clearMatchCnt");
};

/**
 * 添加玩家动态
 * @param data
 */
pro.addPlayerDynamics = function (data) {
    this.playerDynamics.push(data);
    var recordLimit = dataUtils.getOptionValue('Endless_RankTrendsNum', 20);
    if (this.playerDynamics.length > recordLimit) {
        this.playerDynamics.shift();
    }
}

pro.addMatchCount = function (occasionId) {
    var curCnt = this.occasionCount[occasionId];
    var rangeOp = dataUtils.getRangeOption('Endless_AddTimes');
    var addCnt = Math.round(Math.random() * (rangeOp.high - (rangeOp.low)) + rangeOp.low);
    if (curCnt) {
        this.occasionCount[occasionId] = this.occasionCount[occasionId] + addCnt;
    } else {
        this.occasionCount[occasionId] = addCnt;
    }
    var self = this;
    this.emit("saveMatchCnt", {occasionId: occasionId, count: self.occasionCount[occasionId]});
}

pro.getEndlessClientInfo = function () {
    var countList = [];
    var self = this;
    _.keys(this.occasionCount).forEach(function (key) {
        var matchCnt = {};
        matchCnt.occasionId = key;
        matchCnt.count = self.occasionCount[key];
        countList.push(matchCnt);
    });

    return {playerDynamics: this.playerDynamics, endlessMatchCnt: countList};
};

pro.init = function () {
    var self = this;
    globalEndlessDao.findAll(function (err, res) {
        res.forEach(function (record) {
            self.occasionCount[record.occasionId] = record.count;
        })
    });
}

var instance;
module.exports.getInstance = function () {
    if (!instance) {
        instance = new endlessMgr();
    }
    return instance;
};