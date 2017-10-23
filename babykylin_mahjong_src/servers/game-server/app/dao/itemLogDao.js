/**
 * Created by rhx on 2017/9/18.
 */
var logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo');

var utils = require('../util/utils');

var exp = module.exports = {};

exp.save = function (saveData, cb) {
    var sql = 'INSERT INTO logItemFlow(playerId,serverId,flowType,flowSource,itemType,itemId,amount,preCount,nowCount,logTime) VALUES(?,?,?,?,?,?,?,?,?,?)',

        args = [saveData.playerId,saveData.serverId,saveData.flowType,saveData.flowSource,saveData.itemType,saveData.itemId,saveData.amount,saveData.preCount,saveData.nowCount,saveData.logTime];

    pomelo.app.get('logclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('db save err = %s, STTENewBarrier = %j', err.stack, saveData);
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!!res )
            {
                utils.invokeCallback(cb, null, true);
            }
            else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};