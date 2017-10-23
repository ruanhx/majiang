/**
 * Created by kilua on 2016/7/1 0001.
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
    logger.debug('reset time = %s', new Date().toTimeString());
    // 即时重置在线部分玩家，不在线的玩家等上线后再进行重置
    var playerIds = area.getPlayerIds();
    _.each(playerIds, function (playerId) {
        var player = area.getPlayer(playerId);
        if (!!player && !!player.refineResetMgr) {
            player.refineResetMgr.reset();
        }
    });
};