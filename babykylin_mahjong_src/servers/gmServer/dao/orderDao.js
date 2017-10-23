/**
 * Created by kilua on 2015-10-17.
 */

var util = require('util');
var utils = require('../utils/utils');

var dao = module.exports = {};

dao.getOrderList = function (dbClient, begin, end, username, playerId, playerName, cb) {
    var sql, all = (!username && !playerId && !playerName), args;
    /*if(all){
        sql = 'SELECT createTime, uid AS username, playerId, playerName, chargeTotal, money, orderId, channel, status FROM OrderList' +
            ' WHERE createTime >= ? AND createTime <= ?',
        args = [begin, end];
    }else{
        if(username) {
            sql = 'SELECT createTime, uid AS username, playerId, playerName, chargeTotal, money, orderId, channel, status FROM OrderList' +
                ' WHERE createTime >= ? AND createTime <= ? AND (uid LIKE ? OR playerId = ? OR playerName = ?)',
                args = [begin, end, util.format('%%%s%%', username || ''), playerId, playerName];
        }else{
            sql = 'SELECT createTime, uid AS username, playerId, playerName, chargeTotal, money, orderId, channel, status FROM OrderList' +
                ' WHERE createTime >= ? AND createTime <= ? AND (playerId = ? OR playerName = ?)',
                args = [begin, end, playerId, playerName];
        }
    }*/
    if(playerName) {
        sql = 'SELECT createTime,productId,money, playerId, playerName, orderId, operationFlag FROM OrderList' +
            ' WHERE createTime >= ? AND createTime <= ? AND (playerName = ?)',
            args = [begin, end, playerName];
    }
    else{
        sql = 'SELECT createTime,productId,money, playerId, playerName, orderId, operationFlag FROM OrderList' +
            ' WHERE createTime >= ? AND createTime <= ? AND playerId = ?',
            args = [begin, end,playerId];
    }

    dbClient.query(sql, args, function (err, res) {
        if (err) {
            console.error('getOrderList err = %s, args = %j', err.stack, args);
            cb(err.message, []);
        } else {
            res.forEach(function (record) {
                record.createTime = parseInt(record.createTime.toString());
                record.createTime = new Date(record.createTime);
                record.createTime = record.createTime.toString();
            })

            cb(null, res || []);
        }
    });
};

dao.getOrderCache = function(dbClient, begin, end, username, cb){
    var sql = 'SELECT orderInfo FROM OrderCache WHERE recvTime >= ? AND recvTime <= ?',
        args = [begin, end];
    if(username){
        sql += ' AND uid = ?';
        args.push(username);
    }
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('getOrderCache err = %s, args = %j', err.stack, args);
            cb(err.message, []);
        }else{
            var results = [];
            res = res || [];
            res.forEach(function(order){
                order.orderInfo = JSON.parse(order.orderInfo);
                results.push(order.orderInfo);
            });
            cb(null, results);
        }
    });
};