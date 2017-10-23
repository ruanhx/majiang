/**
 * Created by fisher on 2017/05/09.
 */

var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var utils = require('../util/utils');

var offlineFightRecordDao = module.exports;

/**
 获取记录
 */
offlineFightRecordDao.getRecordByPlayerId = function(playerId, cb) {
	var sql = 'select * from OfflineFightRecord where playerId = ? limit 1';
	var args = [playerId];

	pomelo.app.get('dbclient').query(sql, args, function(err, res) {
		if (err) {
			logger.error('getRecordByPlayerId failed! ' + err.stack);
			utils.invokeCallback(cb, err, null);
		} else {
			if (res) {
				var record = res;
				cb(null, record);
			} else {
				logger.error('record not exist');
				utils.invokeCallback(cb, new Error(' record not exist '), null);
			}
		}
	});
};

/**
 插入记录
 */
offlineFightRecordDao.insertRecord = function(playerId,fightType,opts, cb) {
	var sql = 'INSERT INTO OfflineFightRecord(playerId,type,detail) VALUES(?,?,?) ON DUPLICATE KEY UPDATE ' +
				'type=VALUES(type),detail=VALUES(detail)';
	var args = [playerId, fightType, JSON.stringify(opts)];

	pomelo.app.get('dbclient').query(sql, args, function(err, res) {
		if (err) {
			logger.error('insertRecord err = %s, args = %j', err.stack, args);
			utils.invokeCallback(cb, err.message, false);
		} else {
			utils.invokeCallback(cb, null, !!res && res.affectedRows > 0);
		}
	});
};