/**
 * Created by kilua on 2016/7/5 0005.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var area = require('../../../domain/area/area'),
    publisher = require('../../../domain/activity/publisher'),
    activityMgr = require('../../../domain/activity/globalActivity/activityMgr'),
    utils = require('../../../util/utils'),
    common = require('../../../util/common');

var Cron = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Cron(app);
};

var pro = Cron.prototype;

pro.publish = function () {
    logger.debug('publish time = %s', new Date().toTimeString());
    var app = this.app;
    // 即时重置在线部分玩家，不在线的玩家等上线后再进行重置
    // TODO: 可优化为开服载入动态根据各个活动开放时间创建活动各自的定时任务
    var playerIds = area.getPlayerIds();
    var pubActIds = publisher.publish(app.get('opFlags'), common.getServerDay());
    _.each(playerIds, function (playerId) {
        var player = area.getPlayer(playerId);
        if (!!player) {
            if (!!player.activityMgr) {
                // var pubActIds = publisher.publish(app.get('opFlags'), common.getServerDay());
                //logger.debug('##publish pubActIds = %j', pubActIds);
                player.activityMgr.publish(pubActIds);
            }
        }
    });
    activityMgr.getInstance().publish(pubActIds);
};