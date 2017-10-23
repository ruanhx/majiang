/**
 * Created by rhx on 2017/6/13.
 */
var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore'),
    pomelo = require('pomelo');

var dataUtils = require('../../util/dataUtils'),
    dataApi = require('../../util/dataApi'),
    // common = require('../../util/utils'),
    Consts = require('../../consts/consts');

var assistRecord = function (dbData) {
    // this.player = dbData.player;
    this.playerId = dbData.playerId;
    this.friendId = dbData.friendId;
    this.count = dbData.count;
    this.lastUpdateTime = dbData.lastUpdateTime;
};

assistRecord.prototype.clearAssistRecord = function () {
    if(!!this.player){
        delete this.player;
    }
    delete this.playerId;
    delete this.friendId;
    delete this.count;
    delete this.lastUpdateTime;
};

// 计算价格
assistRecord.prototype.getPrice = function () {
    return dataUtils.getOptionListValueByIndex(Consts.CONFIG.ASSIST_FIGHT_PRICE, this.count);
};

assistRecord.prototype.getClientInfo = function () {
    var cost = this.getPrice();
    return {
        playerId: this.friendId,
        // friendId: this.friendId,
        price: cost,
    }
};

assistRecord.prototype.getData = function () {
    return {
        playerId: this.playerId,
        friendId: this.friendId,
        count: this.count,
        // lastUpdateTime: this.lastUpdateTime
    }
};


var assistFightManager = function (player) {
    this.player = player;
    this.assistRecords = {};
};

module.exports = assistFightManager;
var pro = assistFightManager.prototype;

pro.clearAssistFight = function(){
    delete this.player;

    for(var key in this.assistRecords){
        var record = this.assistRecords[key];
        record.clearAssistRecord();
        delete this.assistRecords[key];
    }
    delete this.assistRecords;
}

pro.update = function (friendId) {
    var record = this.assistRecords[friendId];
    if (!record){
        return {playerId:this.player.id,friendId:friendId,count:0,lastUpdateTime:0};
    }else {
        record.count += 1;
    }
    this.save(record);
}
// 每日重置
pro.reset = function () {
    var self = this;
    for (var key in this.assistRecords) {
        var record = this.assistRecords[key];
        record.count = 0;
        record.lastUpdateTime = Date.now();
        self.save(record);
    }
    ;
};

// 玩家上线重置
pro.processOfflineReset = function () {
    var self = this;
    var trigger = pomelo.app.get('cronManager').getTriggerById(Consts.AREA_CRON.RESET_ASSIST_FIGHT_CNT),
        nextExecuteTime, now = Date.now();
    for (var key in this.assistRecords) {
        var record = this.assistRecords[key];
        if (!record.lastUpdateTime) {
            // 第一次
            record.count = 0;
            record.lastUpdateTime = Date.now();
            self.save(record);
            return;
        }
        if (!!trigger && !!record.lastUpdateTime) {
            nextExecuteTime = trigger.nextExcuteTime(record.lastUpdateTime);
            logger.debug('processOfflineReset %s', new Date(record.lastUpdateTime).toString());
            if (nextExecuteTime < now) {
                record.count = 0;
                record.lastUpdateTime = Date.now();
                self.save(record);
            }
        }
    }

};

pro.getAssistRecord = function (friendId) {
    var record = this.assistRecords[friendId];
    if (!record){
        record = new assistRecord({playerId:this.player.id,friendId:friendId,count:0,lastUpdateTime:0});
        this.assistRecords[friendId] = record;
        this.player.emit('assistFightSync', record.getData());
        return record;
    }else {
        return record;
    }
};

/*
 * 保存到数据库
 * */
pro.save=function(record)
{
    var clientInfo = {};
    var self = this;
    clientInfo = record.getClientInfo();
    pomelo.app.rpc.world.playerRemote.getMiniData('*', {playerId: record.friendId}, function (err, res) {
        if (res.miniData) {
            clientInfo.playername = res.miniData.playername;
            clientInfo.headPicId = res.miniData.headPicId;
            clientInfo.heroId = res.miniData.heroId;
            clientInfo.highPower = res.miniData.highPower;
        } else {
            var sysAssistFight = dataApi.SysAssistFight.getDataById(record.friendId);
            if(sysAssistFight){
                clientInfo.playername = sysAssistFight.playername;
                clientInfo.headPicId = sysAssistFight.headPicId;
                clientInfo.heroId = sysAssistFight.heroId;
                clientInfo.highPower = sysAssistFight.highPower;
            }else {
                clientInfo.playername = "";
                clientInfo.headPicId = 0;
                clientInfo.heroId = 0;
                clientInfo.highPower = 0;
            }

        }
        self.player.pushMsg("assistFight.push",{info:clientInfo});
    });
    // this.player.pushMsg("assistFight.push",{info:clientInfo});
    this.player.emit('assistFightSync', record.getData());
};

// 加载数据
pro.load = function (opts) {
    var playerRecords =[];
    var self = this;
    opts = opts ? opts : [];
    _.each(opts,function (dbData) {
         var record = new assistRecord({player:this.player,playerId:dbData.playerId,friendId:dbData.friendId,count:dbData.count,lastUpdateTime:dbData.lastUpdateTime});
        self.assistRecords[dbData.friendId]=record;
    });
};