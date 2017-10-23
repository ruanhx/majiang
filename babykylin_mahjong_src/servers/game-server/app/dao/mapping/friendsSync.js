/**
 * Created by kilua on 2016/7/1 0001.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var utils = require('../../util/utils');

var exp = module.exports = {};

exp.save = function (client, friendData, cb) {
    var sql = 'INSERT INTO friends(playerId, friends, requests, receiveEnergy, blackList) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE' +
            ' playerId = VALUES(playerId),friends = VALUES(friends),requests = VALUES(requests),receiveEnergy = VALUES(receiveEnergy),blackList = VALUES(blackList)',
        args = [friendData.playerId, friendData.friends, friendData.requests, friendData.receiveEnergy, friendData.blackList];
    client.query(sql, args, function (err, res) {
        if (err) {
            logger.error('save err = %s, friendData = %j', err.stack, friendData);
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!!res && res.affectedRows > 0)
                utils.invokeCallback(cb, null, true);
            else {
                logger.debug('save failed!friendData = %j', friendData);
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};