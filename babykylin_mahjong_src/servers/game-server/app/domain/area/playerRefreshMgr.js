/**
 * Created by rhx on 2017/6/15.
 */

var dataApi = require('../../util/dataApi'),
    consts = require('../../consts/consts'),
    logger = require('pomelo-logger').getLogger(__filename);

var playerRefreshMgr = function (player) {
    this.player = player;
};
module.exports = playerRefreshMgr;
var pro = playerRefreshMgr.prototype;

pro.clearRefreshMgr = function(){
    delete this.player;

    delete this.assistRandBossCount;
    delete this.playerRandBossCoolTime;
    delete this.assistRandBossCoolTime;
    delete this.dailyRandBossResetTick;
}

// 加载数据
pro.load = function (opts) {
    if (opts && opts.length > 0) {
        this.assistRandBossCount = opts[0].assistRandBossCount;
        this.playerRandBossCoolTime = opts[0].playerRandBossCoolTime;
        this.assistRandBossCoolTime = opts[0].assistRandBossCoolTime;
        this.dailyRandBossResetTick = opts[0].dailyRandBossResetTick;
    }else {
        this.assistRandBossCount = 0;
        this.playerRandBossCoolTime = 0;
        this.assistRandBossCoolTime = 0;
        this.dailyRandBossResetTick =0;
        this.save();
    }
};

pro.getClientInfo = function () {
    return {
        playerId: this.player.id,
        assistRandBossCount: this.assistRandBossCount,
        playerRandBossCoolTime: this.playerRandBossCoolTime,
        assistRandBossCoolTime: this.assistRandBossCoolTime,
        dailyRandBossResetTick: this.dailyRandBossResetTick,
    }
};

pro.getData = function () {
    return {
        playerId: this.player.id,
        assistRandBossCount: this.assistRandBossCount||0,
        playerRandBossCoolTime: this.playerRandBossCoolTime||0,
        assistRandBossCoolTime: this.assistRandBossCoolTime||0,
        dailyRandBossResetTick: this.dailyRandBossResetTick||0,
    }
};
// 刷新
pro.refreshAssitRandBoss = function () {
    this.assistRandBossCount += 1;
    var coolTime = dataApi.CommonParameter.getOptionValue('assistRandBossCoolTime', 600);
    this.assistRandBossCoolTime = Date.now() + coolTime*1000;
    this.save();
};
// 玩家上线重置
pro.processOfflineReset = function () {
    var trigger = pomelo.app.get('cronManager').getTriggerById(consts.AREA_CRON.RESET_FRIEND_RANDBOSS),
        nextExecuteTime, now = Date.now();
    if (!this.dailyRandBossResetTick) {
        // 第一次
        this.resetAssitRandBoss();
        return;
    }
    if (!!trigger && !!this.dailyRandBossResetTick) {
        nextExecuteTime = trigger.nextExcuteTime(this.dailyRandBossResetTick);
        // logger.debug('processOfflineReset %s', new Date(this.dailyRandBossResetTick).toString());
        if (nextExecuteTime < now) {
            this.resetAssitRandBoss();
        }
    }
};

pro.refreshRandBossCoolTime = function (coolTime) {
    this.playerRandBossCoolTime = Date.now() + coolTime*1000;
    this.save();
};
// 重置每天协助次数
pro.resetAssitRandBoss = function () {
    this.assistRandBossCount = 0;
    this.dailyRandBossResetTick = Date.now();
    this.save();
};

/*
 * 保存到数据库
 * */
pro.save=function()
{

    this.player.pushMsg("playerRefresh.push",this.getClientInfo());
    this.player.emit('savePlayerRefresh', this.getData());
};

// var _getInstance;
// module.exports.getInstance = function (player) {
//     if (!_getInstance) {
//         _getInstance = new playerRefreshMgr(player);
//     }
//     return _getInstance;
// };