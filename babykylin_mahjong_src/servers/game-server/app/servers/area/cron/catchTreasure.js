/**
 * Created by kilua on 2016/7/18 0018.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var area = require('../../../domain/area/area');

var Cron = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Cron(app);
};

var pro = Cron.prototype;

pro.reset = function () {
    var playerIds = area.getPlayerIds();
    for (var playerId in playerIds) {
        var player = area.getPlayer(playerIds[playerId]);
        if (!!player&& !!player.catchTreasureManager) {
            player.catchTreasureManager.rankScoreReset();
        }
    }
};