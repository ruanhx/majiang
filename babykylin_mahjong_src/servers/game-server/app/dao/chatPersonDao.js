/**
 * Created by 卢家泉 on 2017/5/16.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var utils = require('../util/utils');
var pomelo = require('pomelo');

var dao = module.exports;

/*
 *   读取
 * */
dao.getByPlayerId = function (playerId, cb) {
    var sql = 'SELECT * FROM ChatPerson WHERE playerId = ?',
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

/*
 *   保存已
 * */
dao.save = function (dbData, cb) {
    var sql = 'INSERT INTO ChatPerson(playerId,channelInfo) VALUES(?,?) ON DUPLICATE KEY ' +
            'UPDATE playerId = VALUES(playerId),channelInfo = VALUES(channelInfo) ',
        args = [dbData.playerId, JSON.stringify(dbData.channelInfo)];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('upSert err = %s, args = %j', err.stack, args);
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!!res && res.affectedRows > 0)
                utils.invokeCallback(cb, null, true);
            else {
                logger.debug('upSert failed!dbData = %j', dbData);
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};