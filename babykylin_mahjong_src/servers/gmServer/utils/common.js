/**
 * Created by kilua on 2015-08-15.
 */
var mysql = require('mysql');

var userDao = require('../dao/userDao');

var exp = module.exports;

exp.getPlayerIdByUser = function(serverInfo, username, cb){
    var mysqlConf = serverInfo.conf.GameUser,
        userClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        });
    userDao.getPlayerIdByUser(userClient, username, function(err, playerId){
        userClient.end();
        cb(err, playerId);
    });
};

exp.getPlayerIdByName = function(serverInfo, playerName, cb){
    var mysqlConf = serverInfo.conf.GameUser,
        userClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        });
    userDao.getPlayerIdByName(userClient, playerName, function(err, playerId){
        userClient.end();
        cb(err, playerId);
    });
};