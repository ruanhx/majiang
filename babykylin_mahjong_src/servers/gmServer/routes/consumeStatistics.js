/**
 * Created by kilua on 2015-10-15.
 */

var util = require('util');

var router = require('express').Router(),
    async = require('async'),
    request = require('request'),
    _ = require('underscore'),
    mysql = require('mysql');

var userDao = require('../dao/userDao'),
    CODE = require('../shared/code'),
    configUtils = require('../utils/configUtils'),
    channelById = require('../config/channels/index.json'),
    serverList = require('../utils/serverList'),
    consumeStatByTypeDao = require('../dao/consumeStatByTypeDao');

var exp = module.exports = {};

function consumeStatByType(serverInfo, begin, end, cb){
    var mysqlConf = serverInfo.conf.GameStat,
        dbClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        });
    consumeStatByTypeDao.getConsumeStatByType(dbClient, begin, end, function(err, res){
        dbClient.destroy();
        cb(err, res);
    });
}

function consumeStatByTypeEx(serverList, begin, end, cb){
    configUtils.getMysqlConf(serverList, function(err, serverList){
        if(err){
            return cb(err);
        }
        async.map(
            serverList,
            function(serverInfo, callback){
                consumeStatByType(serverInfo, begin, end, callback);
            },
            function(err, results){
                if(err){
                    return cb(err);
                }
                results = _.flatten(results || [], true);
                return cb(null, results);
            }
        )
    });
}

exp.getConsumeStatisticsByType = function(req, res){
    console.log('consumeStatisticsByType channelIds = %j, serverIds = %j, begin = %s, end = %s', req.body.channelIds, req.body.serverIds, req.body.begin,
    req.body.end);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        begin = req.body.begin,
        end = req.body.end;
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || !begin || !end){
        console.log('getConsumeStatisticsByType param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        // 特殊-全部,传0
        channelIds = parseInt(channelIds);
        if(channelIds === 0){
            // 自动填充所有渠道ID
            channelIds = configUtils.getAllChannelIds();
            console.log('getConsumeStatisticsByType all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // 过滤出渠道
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('getConsumeStatisticsByType channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('getConsumeStatisticsByType channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('getConsumeStatisticsByType all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // 过滤出服务器
        var serverList = channelServerList;
        console.log('getConsumeStatisticsByType serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('getConsumeStatisticsByType serverList = %j', serverList);
        consumeStatByTypeEx(serverList, parseInt(begin), parseInt(end), function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};

function consumeStatByItemId(serverInfo, begin, end, cb){
    var mysqlConf = serverInfo.conf.GameStat,
        dbClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        });
    consumeStatByTypeDao.getConsumeStatByItemId(dbClient, begin, end, function(err, res){
        dbClient.destroy();
        cb(err, res);
    });
}

function consumeStatByItemIdEx(serverList, begin, end, cb){
    configUtils.getMysqlConf(serverList, function(err, serverList){
        if(err){
            return cb(err);
        }
        async.map(
            serverList,
            function(serverInfo, callback){
                consumeStatByItemId(serverInfo, begin, end, callback);
            },
            function(err, results){
                if(err){
                    return cb(err);
                }
                results = _.flatten(results || [], true);
                return cb(null, results);
            }
        )
    });
}

exp.getConsumeStatisticsByItemId = function(req, res){
    console.log('getConsumeStatisticsByItemId channelIds = %j, serverIds = %j, begin = %s, end = %s', req.body.channelIds,
        req.body.serverIds, req.body.begin, req.body.end);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        begin = req.body.begin,
        end = req.body.end;
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || !begin || !end){
        console.log('getConsumeStatisticsByItemId param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // 特殊-全部,传0
        if(channelIds === 0){
            // 自动填充所有渠道ID
            channelIds = configUtils.getAllChannelIds();
            console.log('getConsumeStatisticsByItemId all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // 过滤出渠道
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('getConsumeStatisticsByItemId channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('getConsumeStatisticsByItemId channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('getConsumeStatisticsByItemId all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // 过滤出服务器
        var serverList = channelServerList;
        console.log('getConsumeStatisticsByItemId serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('getConsumeStatisticsByItemId serverList = %j', serverList);
        consumeStatByItemIdEx(serverList, parseInt(begin), parseInt(end), function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};