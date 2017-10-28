/**
 * Created by kilua on 2016/6/30 0030.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo');

var utils = require('../util/utils');

var dao = module.exports = {};

dao.getAllRoom = function (cb) {
    var sql = 'SELECT * FROM room',
        args = [];

    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('getAllRoom failed! ' + err.stack);
            utils.invokeCallback(cb, err.message, []);
        } else {
            utils.invokeCallback(cb, null, res || []);
        }
    });
};


dao.getByPlayerId = function (playerId,cb) {
    var sql = 'SELECT * FROM room where ownerId = ?',
        args = [playerId];

    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('getAllRoom failed! ' + err.stack);
            utils.invokeCallback(cb, err.message, []);
        } else {
            utils.invokeCallback(cb, null, res[0]);
        }
    });
}

dao.roomInsert = function(actData, cb) {
    var sql = 'INSERT INTO room(ownerId,di,gui,maxCnt,member,createTime) VALUES(?,?,?,?,?,?)'+
            ' ON DUPLICATE KEY UPDATE ownerId=VALUES(ownerId),di=VALUES(di),gui=VALUES(gui),'+
            'maxCnt=VALUES(maxCnt),member=VALUES(member),createTime=VALUES(createTime)',
        args = [actData.ownerId,  actData.di, actData.gui, actData.maxCnt, actData.member, actData.createTime];
    console.debug("roomInsert sql:%j args:%",sql,args);
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('upSert err = %s, args = %j', err.stack, args);
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!!res && res.affectedRows > 0) {
                var roomId = res.insertId;
                utils.invokeCallback(cb, null, roomId);
            } else {
                logger.debug('upSert failed!args = %j', args);
                utils.invokeCallback(cb, null, null);
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

dao.save = function (client, actData, cb) {
    if (actData.remove) {
        remove(client, actData, cb);
    } else {
        upSert(client, actData, cb);
    }
};