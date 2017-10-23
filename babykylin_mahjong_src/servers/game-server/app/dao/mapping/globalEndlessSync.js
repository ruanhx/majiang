/**
 * Created by rhx on 2017/8/29.
 */
var logger = require('pomelo-logger').getLogger(__filename);

var utils = require('../../util/utils');

var exp = module.exports = {};

exp.save = function (client, data, cb) {
    var sql = 'INSERT INTO globalEndless(occasionId, count) VALUES(?,?) ON DUPLICATE KEY UPDATE' +
            ' occasionId = VALUES(occasionId),count = VALUES(count)',
        args = [data.occasionId, data.count];
    client.query(sql, args, function (err, res) {
        if (err) {
            logger.error('save err = %s, data = %j', err.stack, data);
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!!res && res.affectedRows > 0){
                utils.invokeCallback(cb, null, true);
               // logger.debug("保存全服无尽 %s ,%s",data.occasionId, data.count);
            }
            else {
                logger.debug('save failed!data = %j', data);
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

exp.clearEndless = function (client, data, cb) {
    var sql = 'DELETE FROM globalEndless',
        args = [];
    client.query(sql, args, function (err, res) {
        if (err) {
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!!res && res.affectedRows > 0){
                utils.invokeCallback(cb, null, true);
            }
            else {
                logger.debug('save failed!data = %j', data);
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};