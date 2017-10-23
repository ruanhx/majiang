/**
 * Created with JetBrains WebStorm.
 * User: kilua
 * Date: 13-9-25
 * Time: 上午11:15
 * To change this template use File | Settings | File Templates.
 */

var rechargeDao = module.exports = {};

rechargeDao.getAll = function (dbClient,msg,cb) {
    var sql = 'SELECT * FROM recharge',
        args = [];
    dbClient.query(sql, args, function(err, info){
        if(!!err){
            console.error('getRechargeInfoByMAC failed!err = %s', err.stack);
            cb(err.message, null);
        }else{
            cb(null, info);
        }
    });
};

rechargeDao.getRechargeInfoByMAC = function(dbClient, MAC, cb){
    var sql = 'SELECT * FROM recharge WHERE MAC = ?',
        args = [MAC];
    dbClient.query(sql, args, function(err, info){
        if(!!err){
            console.error('getRechargeInfoByMAC failed!err = %s', err.stack);
            cb(err.message, null);
        }else{
            cb(null, info[0]);
        }
    });
};

rechargeDao.pushRechargeInfo = function(dbClient, msg, cb){
    var sql = 'INSERT INTO recharge(MAC,money,diamond,lastUpdateTime) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE MAC=VALUES(MAC) '+
        ', money=VALUES(money),diamond=VALUES(diamond),lastUpdateTime=VALUES(lastUpdateTime)',
        now = Date.now(),
        args = [msg.MAC,msg.money,msg.diamond, now];
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('pushRechargeInfo failed!err = %s', err.stack);
            cb(err.message, false);
        }else{
            if(!!res && res.affectedRows > 0){
                cb(null, true);
            }else{
                cb(null, false);
            }
        }
    });
};

rechargeDao.drawReward = function(dbClient, msg, cb){
    var sql = 'UPDATE recharge SET hasDraw = 1',
        now = Date.now(),
        args = [];
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('pushRechargeInfo failed!err = %s', err.stack);
            cb(err.message, false);
        }else{
            if(!!res && res.affectedRows > 0){
                cb(null, true);
            }else{
                cb(null, false);
            }
        }
    });
};