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
    //logger.debug('\n\n\n\n\n resetDailyActivityEctypeTask current time %s', new Date().toTimeString());
    var playerIds = area.getPlayerIds();
    for (var playerId in playerIds) {
        var player = area.getPlayer(playerIds[playerId]);
        if (!!player&& !!player.catchTreasureManager) {
            player.catchTreasureManager.rankScoreReset();
        }
    }
};

module.exports = function (app) {
    return new Cron(app);
};