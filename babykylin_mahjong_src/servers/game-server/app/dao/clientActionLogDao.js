/**
 * Created by kilua on 2016/6/24 0024.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo');

var utils = require('../util/utils'),
    Consts = require('../consts/consts');

var dao = module.exports = {};

// type : 0是设备信息 1是报错信息 3：最后的操作
var write = dao.write = function (playerId, type, msg, cb) {
    var sql = 'INSERT INTO clientActionLog(playerId,type,msg) VALUES(?,?,?)',
        args = [playerId, type,msg];

    pomelo.app.get('logclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('write failed! ' + err.stack);
            utils.invokeCallback(cb, err.message, 0);
        } else {
            utils.invokeCallback(cb, null, res.insertId || 0);
        }
    });
};
