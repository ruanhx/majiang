/**
 * Created by tony on 2016/10/14.
 */
var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    activityMgr = require('../../../domain/activity/globalActivity/activityMgr');

var Cron = function (app) {
    this.app = app;
};

var pro = Cron.prototype;

pro.reset = function () {
    logger.debug(' activityEnergy.reset current time %s', new Date().toTimeString());
    var playerIds = area.getPlayerIds();
    for (var playerId in playerIds) {
        var player = area.getPlayer(playerIds[playerId]);
        if (!!player && !!player.activityMgr) {
            player.activityMgr.reset();
        }
    }
};

pro.activityReset = function () {
    activityMgr.getInstance().reset();
};

pro.checkEnergy = function(){
    var playerIds = area.getPlayerIds();
    for (var playerId in playerIds) {
        var player = area.getPlayer(playerIds[playerId]);
        if (!!player && !!player.activityMgr) {
            player.activityMgr.checkEnergy();
        }
    }
}

module.exports = function (app) {
    return new Cron(app);
};