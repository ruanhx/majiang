/**
 * Created by Administrator on 2016/3/15 0015.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area');

var Cron = function (app) {
    this.app = app;
};

var pro = Cron.prototype;

pro.reset = function () {
    logger.debug('reset current time %s', new Date().toTimeString());
    // ��ʱ�������߲�����ң������ߵ���ҵ����ߺ��ٽ�������
    var playerIds = area.getPlayerIds();
    for (var playerId in playerIds) {
        var player = area.getPlayer(playerIds[playerId]);
        if (!!player && !!player.reviveCntMgr) {
            player.reviveCntMgr.reset();
        }
    }
};

module.exports = function (app) {
    return new Cron(app);
};