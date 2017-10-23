/**
 * Created by kilua on 2016/7/1 0001.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var utils = require('../../util/utils');

var playerRefresh = module.exports;

playerRefresh.save = function (client, data, cb) {
    var sql = 'INSERT INTO playerRefresh(playerId, assistRandBossCount, playerRandBossCoolTime, assistRandBossCoolTime,dailyRandBossResetTick) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE' +
            ' playerId = VALUES(playerId),assistRandBossCount = VALUES(assistRandBossCount),playerRandBossCoolTime = VALUES(playerRandBossCoolTime),assistRandBossCoolTime = VALUES(assistRandBossCoolTime),dailyRandBossResetTick = VALUES(dailyRandBossResetTick)',
        args = [data.playerId, data.assistRandBossCount, data.playerRandBossCoolTime, data.assistRandBossCoolTime, data.dailyRandBossResetTick];
    client.query(sql, args, function (err, res) {
        if (err) {
            logger.error('save err = %s, friendData = %j', err.stack, data);
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!!res && res.affectedRows > 0)
                utils.invokeCallback(cb, null, true);
            else {
                logger.debug('save failed!friendData = %j', data);
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};