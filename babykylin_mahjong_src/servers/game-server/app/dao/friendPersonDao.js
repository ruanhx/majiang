/**
 * Created by kilua on 2016/7/17 0017.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo');

var utils = require('../util/utils');

var dao = module.exports = {};


/*
 *
 * */
dao.getByPlayerId = function (playerId, cb) {
    var sql = 'SELECT * FROM FriendPerson WHERE playerId = ?',
        args = [playerId];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('getByPlayerId failed!err = %s', err.stack);
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.length > 0) {
                utils.invokeCallback(cb, null, res);
            } else {
                utils.invokeCallback(cb, null, null);
            }
        }
    });
};
/**
 *
 * @param client
 * @param friendPerson
 * @param cb
 */
dao.updateAgreeCnt = function (playerId,cnt, cb) {
    var sql = 'INSERT INTO FriendPerson(playerId,agreeCnt) VALUES(?,?) ON DUPLICATE KEY ' +
            'UPDATE playerId = VALUES(playerId),agreeCnt = VALUES(agreeCnt) ',
        args = [playerId,cnt];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('upSert err = %s, args = %j', err.stack, args);
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!!res && res.affectedRows > 0)
                utils.invokeCallback(cb, null, true);
            else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};