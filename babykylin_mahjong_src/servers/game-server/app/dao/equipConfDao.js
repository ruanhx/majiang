/**
 * Created by kilua on 2016/7/1 0001.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo');

var utils = require('../util/utils');

var dao = module.exports = {};

dao.getByPlayerId = function (playerId, cb) {
    var sql = 'SELECT pos,refineLV,refineExp,wakeUpLV,washCnt,strengthenLV FROM EquipConf WHERE playerId = ?',
        args = [playerId];

    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('getByPlayerId failed! err = %s, playerId = %s', err.stack, playerId);
            utils.invokeCallback(cb, err.message, []);
        } else {
            res = res || [];
            utils.invokeCallback(cb, null, res || []);
        }
    });
};