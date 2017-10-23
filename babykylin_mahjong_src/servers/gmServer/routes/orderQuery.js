/**
 * Created by kilua on 2015-10-17.
 */

var _ = require('underscore'),
    async = require('async'),
    mysql = require('mysql');

var CODE = require('../shared/code'),
    configUtils = require('../utils/configUtils'),
    channelById = require('../config/channels/index.json'),
    serverList = require('../utils/serverList'),
    orderDao = require('../dao/orderDao');

var exp = module.exports = {};

function getOrderList(serverInfo, begin, end, username, playerId, playerName, cb){
    var mysqlConf = serverInfo.conf.GameUser,
        dbClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        });
    orderDao.getOrderList(dbClient, begin, end, username, playerId, playerName, function(err, orderList){
        dbClient.destroy();
        cb(err, orderList);
    });
}

function getUserRegisterTime(serverInfo, username, cb){
    var mysqlConf = serverInfo.conf.GameUser,
        dbClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        }),
        sql = 'SELECT registerTime FROM User WHERE MAC = ?',
        args = [username];
    dbClient.query(sql, args, function(err, res){
        dbClient.destroy();
        if(err){
            console.error('getUserRegisterTime err = %s, args = %j', err.stack, args);
            cb(err.message, 0);
        }else{
            if(!!res && res.length === 1){
                cb(null, res[0].registerTime);
            }else{
                cb(null, 0);
            }
        }
    });
}

function getOrderListEx(serverList, begin, end, username, playerId, playerName, cb){
    configUtils.getMysqlConf(serverList, function(err, serverList){
        if(err){
            return cb(err);
        }
        async.map(
            serverList,
            function(serverInfo, callback){
            getOrderList(serverInfo, begin, end, username, playerId, playerName, function(err, orderList){
                /*async.map(orderList,
                    function(orderInfo, next){
                        getUserRegisterTime(serverInfo, orderInfo.username, function(err, registerTime){
                            orderInfo.registerTime = registerTime;
                            next(err, registerTime);
                        });
                    },
                    function(err, results){
                        callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, orderList: orderList});
                    });*/
                callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, orderList: orderList});
            });
        },
            function(err, results){
                if(err){
                    return cb(err);
                }
                //results = _.flatten(results || [], true);
                return cb(null, results);
            }
        )
    });
}

exp.getOrderList = function(req, res){
    console.log('getOrderList channelIds = %j, serverIds = %j, begin = %s, end = %s, username = %s, playerId = %s, playerName = %s',
        req.body.channelIds, req.body.serverIds, req.body.begin, req.body.end, req.body.username, req.body.playerId, req.body.playerName);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        begin = parseInt(req.body.begin),
        end = parseInt(req.body.end),
        username = req.body.username,
        playerId = parseInt(req.body.playerId),
        playerName = req.body.playerName;
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || !begin || !end){
        console.log('getOrderList param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // 特殊-全部,传0
        if(channelIds === 0){
            // 自动填充所有渠道ID
            channelIds = configUtils.getAllChannelIds();
            console.log('getOrderList all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // 过滤出渠道
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('getOrderList channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('getOrderList channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('getOrderList all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // 过滤出服务器
        var serverList = channelServerList;
        console.log('getOrderList serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('getOrderList serverList = %j', serverList);
        getOrderListEx(serverList, begin, end, username, playerId, playerName, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            console.log('getOrderList results = %j', results);
            return res.send({code: CODE.OK, results: results});
        });
    });
};

function getOrderCache(serverInfo, begin, end, username, cb){
    var mysqlConf = serverInfo.conf.GameUser,
        dbClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        });
    orderDao.getOrderCache(dbClient, begin, end, username, function(err, orderList){
        dbClient.destroy();
        cb(err, orderList);
    });
}

function getOrderCacheEx(serverList, begin, end, username, cb){
    configUtils.getMysqlConf(serverList, function(err, serverList){
        if(err){
            return cb(err);
        }
        async.map(
            serverList,
            function(serverInfo, callback){
                getOrderCache(serverInfo, begin, end, username, function(err, orderList){
                    async.map(orderList,
                        function(orderInfo, next){
                            getUserRegisterTime(serverInfo, orderInfo.uid, function(err, registerTime){
                                orderInfo.registerTime = registerTime;
                                next(err, registerTime);
                            });
                        },
                        function(err, results){
                            callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, orderList: orderList});
                        });
                    //callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, orderList: orderList});
                });
            },
            function(err, results){
                if(err){
                    return cb(err);
                }
                //results = _.flatten(results || [], true);
                return cb(null, results);
            }
        )
    });
}

exp.getOrderCache = function(req, res){
    console.log('getOrderCache channelIds = %j, serverIds = %j, begin = %s, end = %s, username = %s',
        req.body.channelIds, req.body.serverIds, req.body.begin, req.body.end, req.body.username);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        begin = parseInt(req.body.begin),
        end = parseInt(req.body.end),
        username = req.body.username;
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || !begin || !end){
        console.log('getOrderCache param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // 特殊-全部,传0
        if(channelIds === 0){
            // 自动填充所有渠道ID
            channelIds = configUtils.getAllChannelIds();
            console.log('getOrderCache all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // 过滤出渠道
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('getOrderCache channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('getOrderCache channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('getOrderCache all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // 过滤出服务器
        var serverList = channelServerList;
        console.log('getOrderCache serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('getOrderCache serverList = %j', serverList);
        getOrderCacheEx(serverList, begin, end, username, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};