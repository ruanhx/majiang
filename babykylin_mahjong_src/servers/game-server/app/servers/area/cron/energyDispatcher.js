/**
 * Created by employee11 on 2016/2/19.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    Consts = require('../../../consts/consts'),
    dataUtils = require('../../../util/dataUtils');

var Cron = function (app) {
    this.app = app;
};

var pro = Cron.prototype;

pro.dispatch = function () {
    var playerIds = area.getPlayerIds();
    playerIds.forEach(function (playerId) {
        var player = area.getPlayer(playerId);
        if (!player) {
            return;
        }
        // if (player.isEnergyFull()) {
        //     logger.debug('dispatch player %s energy full!', player.id);
        //     return;
        // }
        // player.dispatchEnergy(dataUtils.getOptionValue('Sys_StrengthRenewNum', 1));
    });
};

pro.send = function () {
    logger.debug('send...');
    var playerIds = area.getPlayerIds(),
        trigger = this.app.get('cronManager').getTriggerById(Consts.AREA_CRON.SEND_ENERGY_CRON_ID),
        count = 0;
    if (trigger) {
        count = parseInt(trigger.args);
    }
    playerIds.forEach(function (playerId) {
        var player = area.getPlayer(playerId);
        if (!player) {
            return;
        }
        player.sendEnergy(count);
    });
};

pro.resetBuyEnergyCount = function () {
    logger.debug('resetBuyEnergyCount...');
    var playerIds = area.getPlayerIds();
    playerIds.forEach(function (playerId) {
        var player = area.getPlayer(playerId);
        if (!player) {
            return;
        }
        player.resetBuyEnergyCount(Date.now());
    });
};

module.exports = function (app) {
    return new Cron(app);
};
