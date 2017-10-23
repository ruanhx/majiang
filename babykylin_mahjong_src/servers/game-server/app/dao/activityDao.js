/**
 * Created by rhx on 2016/7/17 0017.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo');

var utils = require('../util/utils');

var activityDao = module.exports;

/*
 *
 * */
activityDao.load = function (cb) {
    var sql = 'SELECT * FROM activity',
        args = [];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('activityDao failed! ' + err.stack);
            utils.invokeCallback(cb, err.message,[]);
        } else {
            res = res || [];
            res.forEach(function (activity) {
                try {
                    activity.detail = JSON.parse(activity.detail);
                } catch (ex) {
                    logger.error('activityDao activity = %j', activity);
                    activity.detail = {};
                }
            });
            utils.invokeCallback(cb, null, res);
        }
    });
};

function upSert(dbClient, actData, cb) {
    var sql = 'INSERT INTO activity(id,pubTick,detail,resetTick) VALUES(?,?,?,?)' +
            ' ON DUPLICATE KEY UPDATE detail=VALUES(detail),resetTick=VALUES(resetTick)',
        args = [actData.id,  actData.pubTick, JSON.stringify(actData.detail), actData.resetTick];
    dbClient.query(sql, args, function (err, res) {
        if (err) {
            logger.error('upSert err = %s, args = %j', err.stack, args);
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!!res && res.affectedRows > 0) {
                utils.invokeCallback(cb, null, true);
            } else {
                logger.debug('upSert failed!args = %j', args);
                utils.invokeCallback(cb, null, false);
            }
        }
    });
}

function remove(dbClient, actData, cb) {
    var sql = 'DELETE FROM activity WHERE id = ?',
        args = [actData.id];
    dbClient.query(sql, args, function (err, res) {
        if (err) {
            logger.error('remove err %s, args = %j', err.stack, args);
            utils.invokeCallback(cb, err.message, false);
        } else {
            utils.invokeCallback(cb, null, true);
        }
    });
}

activityDao.save = function (client, actData, cb) {
    if (actData.remove) {
        remove(client, actData, cb);
    } else {
        upSert(client, actData, cb);
    }
};