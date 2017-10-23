/**
 * Created by tony on 2017/2/25.
 */

var utils = require('../util/utils'),
    logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo');

var dao = module.exports = {};

dao.getByPlayerId = function ( playerId , randomBossId, cb) {
    if(randomBossId==0 || randomBossId == null){
        return  utils.invokeCallback(cb, null, 0);
    }
    var sql = 'SELECT (COUNT(*))winCnt FROM randBossRecord WHERE playerId = ? AND randomBossId = ? ',
        args = [playerId,randomBossId];

    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('getByPlayerId failed! ' + err.stack);
            utils.invokeCallback(cb, err.message);
        } else {
            utils.invokeCallback(cb, null, res[0].winCnt);
        }
    });
};

dao.getRecordByPlayerId = function (playerId ,cb) {

    var oneWeek = utils.thisWeekBeginTime();
    var sql = 'SELECT * FROM randBossRecord WHERE playerId = ? AND createTime >= ? ',
        args = [playerId,oneWeek];

    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('getRecordByPlayerId failed! ' + err.stack);
            utils.invokeCallback(cb, err.message);
        } else {
            utils.invokeCallback(cb, null, res);
        }
    });
};

dao.insert = function ( data , cb){
    var sql = 'INSERT INTO randBossRecord(playerId,randomBossId,barrierId,createTime,atkCnt) VALUES(?,?,?,?,?)';
    pomelo.app.get('dbclient').query(sql, [data.playerId, data.randomBossId, data.barrierId, data.createTime, data.atkCnt], function(err, res){
        if(err){
            logger.error("#### " + err.message);
            utils.invokeCallback(cb, err.message, false);
        }else{
            if(!!res){
                utils.invokeCallback(cb, null, true);
            }else{
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

dao.getWinCntByWeek = function (playerId , randomBossId,cb) {
    if(randomBossId==0 || randomBossId == null){
        return  utils.invokeCallback(cb, null, 0);
    }
    var oneWeek = utils.thisWeekBeginTime();
    //var sql = 'SELECT (COUNT(*))winCnt FROM randBossRecord WHERE playerId = ? AND randomBossId = ? AND createTime >= ? ',
       // args = [playerId,randomBossId,oneWeek,];
    var sql = 'CALL getRandBossWinCntByWeek(?,?,?)',
        args = [playerId,randomBossId,oneWeek];

    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('getWinCntByWeek failed! ' + err.stack);
            utils.invokeCallback(cb, err.message);
        } else {
            //utils.invokeCallback(cb, null, res[0].winCnt);
            utils.invokeCallback(cb, null, res[0][0].thisWinCnt,res[0][0].lastWinCnt);
        }
    });
};


dao.getWinCntByWeekPlayerOnly = function (playerId ,cb) {
    var oneWeek = utils.thisWeekBeginTime();
    var sql = 'CALL getRandBossWinCntByWeekPlayerOnly(?,?)',
        args = [playerId,oneWeek];

    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('getWinCntByWeekPlayerOnly failed! ' + err.stack);
            utils.invokeCallback(cb, err.message);
        } else {
            //utils.invokeCallback(cb, null, res[0].winCnt);
            utils.invokeCallback(cb, null, res[0][0].thisWinCnt,res[0][0].lastWinCnt);
        }
    });
};
