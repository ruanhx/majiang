/**
 * Created by Administrator on 2016/4/9 0009.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var utils = require('../../util/utils');

var exp = module.exports = {};

exp.update = function (client, heroHistoryRec, cb) {
    var sql = 'INSERT INTO heroHistory(playerId, heroHistory) VALUES(?,?) ON DUPLICATE KEY UPDATE' +
            ' heroHistory = VALUES(heroHistory)',
        args = [heroHistoryRec.playerId, JSON.stringify(heroHistoryRec.heroHistory)];
    client.query(sql, args, function (err, res) {
        if (err) {
            logger.error('add err = %s, args = %j', err.stack, args);
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!!res && res.affectedRows > 0)
                utils.invokeCallback(cb, null, true);
            else {
                logger.debug('add failed!args = %j', args);
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};