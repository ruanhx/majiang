/**
 * Created by kilua on 2015-10-15.
 */

var _ = require('underscore'),
    async = require('async'),
    mysql = require('mysql');

var CODE = require('../shared/code'),
    onlineUserDao = require('../dao/onlineUserDao'),
    configUtils = require('../utils/configUtils'),
    channelById = require('../config/channels/index.json'),
    mylibUtils = require('../libs/mylib/utils/lib/utils'),
    serverList = require('../utils/serverList');

var exp = module.exports = {};

function onlineStat(serverInfo, begin, end, cb){
    var mysqlConf = serverInfo.conf.GameStat,
        dbClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        });
    async.parallel([
        function(callback){
            // 查询今日在线采样数据
            var todayBegin = new Date().setHours(0, 0, 0, 0);
            onlineUserDao.getOnlineBetween(dbClient, todayBegin, Date.now(), callback);
        },
        function(callback){
            // 查询昨日在线采样数据
            var yesterday = mylibUtils.getDaysFrom(new Date(), -1),
                yesterdayBegin = yesterday.setHours(0, 0, 0, 0),
                yesterdayEnd = yesterday.setHours(23, 59, 59, 999);
            onlineUserDao.getOnlineBetween(dbClient, yesterdayBegin, yesterdayEnd, callback);
        },
        function(callback){
            // 查询上周在线采样数据
            var lastWeek = mylibUtils.getWeeksFrom(new Date(), -1),
                lastWeekBegin = lastWeek.setHours(0, 0, 0, 0),
                lastWeekEnd = lastWeek.setHours(23, 59, 59, 999);
            onlineUserDao.getOnlineBetween(dbClient, lastWeekBegin, lastWeekEnd, callback);
        },
        function(callback){
            // 查询指定期间的每天的在线统计
            onlineUserDao.getOnlineTimeStat(dbClient, begin, end, callback);
        }
    ],function(err, results){
        dbClient.destroy();
        if(err){
            return cb(err);
        }
        return cb(null, {
            today: results[0],
            yesterday: results[1],
            lastWeek: results[2],
            total: results[3]
        });
    });
}

function onlineStatEx(serverList, begin, end, cb){
    configUtils.getMysqlConf(serverList, function(err, serverList){
        if(err){
            return cb(err);
        }
        async.map(
            serverList,
            function(serverInfo, callback){
                onlineStat(serverInfo, begin, end, callback);
            },
            function(err, results){
                if(err){
                    return cb(err);
                }
                //results = _.flatten(results, true);
                return cb(null, results);
            }
        )
    });
}

exp.onlineStatistics = function(req, res){
    console.log('onlineStatistics channelIds = %j, serverIds = %j, begin = %s, end = %s', req.body.channelIds, req.body.serverIds,
        req.body.begin, req.body.end);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        begin = req.body.begin,
        end = req.body.end;
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || !begin || !end){
        console.log('onlineStatistics param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // 特殊-全部,传0
        if(channelIds === 0){
            // 自动填充所有渠道ID
            channelIds = configUtils.getAllChannelIds();
            console.log('onlineStatistics all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // 过滤出渠道
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('onlineStatistics channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('onlineStatistics channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('onlineStatistics all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // 过滤出服务器
        var serverList = channelServerList;
        console.log('onlineStatistics serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('onlineStatistics serverList = %j', serverList);
        onlineStatEx(serverList, parseInt(begin), parseInt(end), function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};