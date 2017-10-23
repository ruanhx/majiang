/**
 * Created by fisher on 2017/03/24.
 */

var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var utils = require('../util/utils');

var equipHistoryDao = module.exports;

equipHistoryDao.getByPlayerId = function (playerId, cb) {
    var sql = 'select equipHistory from EquipHistory where playerId = ?',
        args = [playerId];

    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('getByPlayerId failed! ' + err.stack);
            utils.invokeCallback(cb, err.message, []);
        } else {
            if (res && res.length > 0) {
                utils.invokeCallback(cb, null, JSON.parse(res[0].equipHistory));
            } else {
                // logger.error('getByPlayerId list is null');
                utils.invokeCallback(cb, null, []);
            }
        }
    });
};
