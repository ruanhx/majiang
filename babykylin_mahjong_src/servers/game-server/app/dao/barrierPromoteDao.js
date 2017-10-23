/**
 * Created by 卢家泉 on 2017/5/16.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var utils = require('../util/utils');
var pomelo = require('pomelo');

var barrierPromoteDao = module.exports;

/*
 *   读取
 * */
barrierPromoteDao.getByPlayerId = function (playerId, cb) {
    var sql = 'SELECT * FROM barrierPromote WHERE playerId = ?',
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