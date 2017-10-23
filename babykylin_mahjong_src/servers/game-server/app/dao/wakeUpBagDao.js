/**
 * Created by kilua on 2016/7/22 0022.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo');

var utils = require('../util/utils');

var dao = module.exports = {};

dao.getByPlayerId = function (playerId, cb) {
    var sql = 'SELECT * FROM WakeUpBag WHERE playerId = ?',
        args = [playerId];

    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('getByPlayerId err = %s, args = %j! ', err.stack, args);
            utils.invokeCallback(cb, err.message, []);
        } else {
            utils.invokeCallback(cb, null, res || []);
        }
    });
};