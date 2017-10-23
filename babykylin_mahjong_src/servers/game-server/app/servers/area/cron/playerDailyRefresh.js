/**
 * Created by tony on 2016/9/22.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area');

var Cron = function (app) {
    this.app = app;
};

var pro = Cron.prototype;
// 重置每天协助次数
pro.resetAssitRandBoss = function () {
    logger.debug('refreshAssitRandBoss current time %s', new Date().toTimeString());
    var playerIds = area.getPlayerIds();
    for (var playerId in playerIds) {
        var player = area.getPlayer(playerIds[playerId]);
        if (!!player && !!player.refreshMgr) {
            player.refreshMgr.resetAssitRandBoss();
        }
    }
};

pro.resetAssistFightCount = function () {
    var playerIds = area.getPlayerIds();
    for (var playerId in playerIds) {
        var player = area.getPlayer(playerIds[playerId]);
        if (!!player && !!player.assistFightMgr) {
            player.assistFightMgr.reset();
        }
    }

};

module.exports = function (app) {
    return new Cron(app);
};