/**
 * Created by tony on 2016/9/22.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area');

var Cron = function (app) {
    this.app = app;
};

var pro = Cron.prototype;

pro.reset = function () {
    logger.debug('\n\n\n\n\n resetDailyTask current time %s', new Date().toTimeString());
    var playerIds = area.getPlayerIds();
    for (var playerId in playerIds) {
        var player = area.getPlayer(playerIds[playerId]);
        if (!!player && !!player.missionMgr) {
            player.missionMgr.reset();
        }
    }
};

pro.resetDivision = function () {
    logger.debug('\n\n\n\n\n resetDivision current time %s', new Date().toTimeString());
    var playerIds = area.getPlayerIds();
    for (var playerId in playerIds) {
        var player = area.getPlayer(playerIds[playerId]);
        if (!!player && !!player.divisionPersonMgr) {
            player.divisionPersonMgr.dailyClean();
        }
    }
};

module.exports = function (app) {
    return new Cron(app);
};