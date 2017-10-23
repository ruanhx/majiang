/**
 * Created by kilua on 2016/7/1 0001.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var utils = require('../../util/utils');

var assistFightSync = module.exports;

assistFightSync.save = function (client, data, cb) {
    var sql = 'INSERT INTO assistFight(playerId, friendId, count, lastUpdateTime) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE' +
            ' playerId = VALUES(playerId),friendId = VALUES(friendId),count = VALUES(count),lastUpdateTime = VALUES(lastUpdateTime)',
        args = [data.playerId, data.friendId, data.count, data.lastUpdateTime];
    client.query(sql, args, function (err, res) {
        if (err) {
            logger.error('save err = %s, assistFight = %j', err.stack, data);
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