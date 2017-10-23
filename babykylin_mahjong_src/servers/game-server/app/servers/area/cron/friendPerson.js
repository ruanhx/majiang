/**
 * Created by tony on 2016/10/14.
 */
var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area');

var Cron = function (app) {
    this.app = app;
};

var pro = Cron.prototype;

pro.reset = function () {
    logger.debug(' activityEnergy.reset current time %s', new Date().toTimeString());
    var playerIds = area.getPlayerIds();
    for (var playerId in playerIds) {
        var player = area.getPlayer(playerIds[playerId]);
        if (!!player && !!player.friendPersonMgr) {
            player.friendPersonMgr.dailyClear();
        }
    }
};

module.exports = function (app) {
    return new Cron(app);
};