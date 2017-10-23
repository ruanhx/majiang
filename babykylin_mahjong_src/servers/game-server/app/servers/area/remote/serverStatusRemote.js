/**
 * Created by kilua on 2016/6/30 0030.
 */
var activityManager = require('../../../domain/activity/activityManager'),
    area = require('../../../domain/area/area'),
    publisher = require('../../../domain/activity/publisher'),
    activityMgr = require('../../../domain/activity/globalActivity/activityMgr'),
    common = require('../../../util/common');

var logger = require('pomelo-logger').getLogger(__filename);

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

/*
 *   同步状态
 * */
pro.syncStatus = function (startTime, opFlags, cb) {
    // logger.info('syncStatus startTime = %s, opFlags = %j', startTime, opFlags);
    this.app.set('serverStartTick', startTime);
    this.app.set('opFlags', opFlags);
    var self = this;
    activityMgr.getInstance().init(function () {
        activityMgr.getInstance().publish(publisher.publish(self.app.get('opFlags'), common.getServerDay()));
    });

    cb();
};

pro.syncOpFlags = function (opFlags, cb) {
    // logger.info('syncOpFlags opFlags = %j', opFlags);
    this.app.set('opFlags', opFlags);
    cb();
};

/**
 * 充值标记
 * */
pro.syncRechargeFlags = function(opFlags, cb){
    // logger.info('syncRechargeFlags rechargeFlags = %j', opFlags);
    this.app.set('rechargeFlags', opFlags);
    cb(null);
};

/*
* GM 同步运营标记
* */
pro.updatePlayerActivitys = function(opFlags, serverDay, cb){
    // logger.debug('updatePlayerActivitys opFlags = %j, serverDay = %s', opFlags, serverDay);

    var allPlayerIds = area.getPlayerIds(),
        app = this.app;
    allPlayerIds.forEach(function(playerId){
        var player = area.getPlayer(playerId);
        if(player){
            player.activityMgr.publish(publisher.publish(app.get('opFlags'), common.getServerDay()));
            player.pushMsg('activity.relist', {});
        }
    });
    activityMgr.getInstance().publish(publisher.publish(app.get('opFlags'), common.getServerDay()));
    cb(null);
};