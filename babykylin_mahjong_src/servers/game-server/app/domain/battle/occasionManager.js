/**
 * Created by kilua on 2016/7/20 0020.   赛事管理器
 */

var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore'),
    pomelo = require('pomelo');

var dataApi = require('../../util/dataApi'),
    Consts = require('../../consts/consts');

var Occasion = function (dbOccasion) {
    EventEmitter.call(this);

    this.occasionId = dbOccasion.occasionId;
    this.dailyCnt = dbOccasion.dailyCnt;
    this.maxWin = dbOccasion.maxWin || 0;
    this.maxLose = dbOccasion.maxLose || 0;
    this.dailyBuyCnt = dbOccasion.dailyBuyCnt || 0;
    this.totalCnt = dbOccasion.totalCnt || 0;
    this.bindData();
};

util.inherits(Occasion, EventEmitter);
Occasion.prototype.clearOccasion = function () {
    delete this.occasionId;
    delete this.dailyCnt;
    delete this.maxWin;
    delete this.maxLose;
    delete this.dailyBuyCnt;
    delete this.totalCnt;
    delete this.data;
}

Occasion.prototype.bindData = function () {
    this.data = dataApi.EndlessType.findById(this.occasionId);
    if (!this.data) {
        logger.error('bindData no [EndlessType] data found!id = %s', this.occasionId);
    }
};

Occasion.prototype.getData = function () {
    return {occasionId: this.occasionId, dailyCnt: this.dailyCnt,dailyBuyCnt:this.dailyBuyCnt,totalCnt:this.totalCnt};
};

Occasion.prototype.save = function () {
    this.emit('save', this.getData());
};

Occasion.prototype.getClientInfo = function () {
    return {occasionId: this.occasionId, dailyCnt: this.dailyCnt, maxWin: this.maxWin, maxLose: this.maxLose,dailyBuyCnt:this.dailyBuyCnt,totalCnt:this.totalCnt};
};

Occasion.prototype.refresh = function () {
    this.emit('refresh', this.getClientInfo());
};

Occasion.prototype.setDailyCnt = function (newCnt) {
    if (this.dailyCnt !== newCnt) {
        this.dailyCnt = newCnt;
        this.save();
        this.refresh();
    }
};
Occasion.prototype.setTotalCnt = function (newCnt) {
    if (this.totalCnt !== newCnt) {
        this.totalCnt = newCnt;
        // this.save();
        // this.refresh();
    }
};
Occasion.prototype.setDailyBuyCnt = function (newCnt) {
    if (this.dailyBuyCnt !== newCnt) {
        this.dailyBuyCnt = newCnt;
        this.save();
        this.refresh();
    }
};

Occasion.prototype.setMaxWin = function (newMaxWin) {
    if (this.maxWin !== newMaxWin) {
        this.maxWin = newMaxWin;
        //this.save();
        this.refresh();
    }
};

Occasion.prototype.setMaxLose = function (newMaxLose) {
    if (this.maxLose !== newMaxLose) {
        this.maxLose = newMaxLose;
        //this.save();
        this.refresh();
    }
};

var OccasionManager = function (player) {
    this.player = player;
    this.occasionsById = {};
};

var pro = OccasionManager.prototype;

pro.clearOccasionMgr = function(){
    delete this.player;

    for(var key in this.occasionsById){
        this.occasionsById[key].clearOccasion();
        delete this.occasionsById[key];
    }
    delete this.occasionsById;
}

pro.create = function (dbOccasion) {
    var occasion = new Occasion(dbOccasion),
        self = this;
    occasion.on('save', function (dbData) {
        dbData.playerId = self.player.id;
        //self.player.emit('endlessOccasion.save', dbData);
        pomelo.app.rpc.world.endlessRemote.syncEndlessOccasion("*",dbData,function(){});
    });
    occasion.on('refresh', function (occasionInfo) {
        self.player.pushMsg('endlessOccasion.refresh', occasionInfo);
    });
    return occasion;
};

pro.getById = function (occasionId) {
    return this.occasionsById[occasionId];
};

pro.updateDailyCnt = function (occasionId) {
    var occasion = this.getById(occasionId);
    occasion.setTotalCnt(occasion.totalCnt + 1);
    occasion.setDailyCnt(occasion.dailyCnt + 1);
};

pro.add = function (occasionId) {
    var occasion = this.getById(occasionId);
    if (!occasion) {
        occasion = this.occasionsById[occasionId] = this.create({occasionId: occasionId, dailyCnt: 0, totalCnt: 0});
        occasion.save();
        occasion.refresh();
    }
    return occasion;
};

pro.load = function (dbOccasionList) {
    dbOccasionList = dbOccasionList || [];
    this.occasionsById = {};
    var self = this;
    dbOccasionList.forEach(function (dbOccasion) {
        self.occasionsById[dbOccasion.occasionId] = self.create(dbOccasion);
    });
    logger.debug('load ok!cnt = %s', _.size(self.occasionsById));
};

pro.resetDailyCnt = function () {
    this.player.set('endlessOccasionCntResetTick', Date.now());
    _.each(this.occasionsById, function (occasion) {
        occasion.setDailyCnt(0);
        occasion.setDailyBuyCnt(0);
    });
};

pro.processOfflineReset = function () {
    if (!this.player.endlessOccasionCntResetTick) {
        // 首次
        this.resetDailyCnt();
    } else {
        var trigger = pomelo.app.get('cronManager').getTriggerById(Consts.AREA_CRON.RESET_ENDLESS),
            nextExecuteTime = trigger.nextExcuteTime(this.player.endlessOccasionCntResetTick);
        logger.debug('processOfflineReset endlessOccasionCntResetTick = %s', new Date(this.player.endlessOccasionCntResetTick).toString());
        if (nextExecuteTime < Date.now()) {
            this.resetDailyCnt();
        }
    }
};

pro.getClientInfo = function () {
    return _.map(this.occasionsById, function (occasion) {
        return occasion.getClientInfo();
    });
};

/*
 *   更新连胜、连败
 * */
pro.updateResult = function (occasionId, maxWin, maxLose) {
    var occasion = this.getById(occasionId);
    if (occasion) {
        occasion.setMaxWin(maxWin);
        occasion.setMaxLose(maxLose);
    }
};

module.exports.create = function (player) {
    return new OccasionManager(player);
};
