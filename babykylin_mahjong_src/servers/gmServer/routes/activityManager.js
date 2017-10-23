/**
 * Created by kilua on 2015-10-16.
 */

var util = require('util');

var _ = require('underscore'),
    async = require('async'),
    request = require('request').defaults({jar: true, json: true});

var CODE = require('../shared/code'),
    configUtils = require('../utils/configUtils'),
    channelById = require('../config/channels/index.json'),
    serverList = require('../utils/serverList');

var exp = module.exports = {};

function listActivitiesSingle(serverInfo, cb){
    request({
            url: util.format('http://%s:%s/listActivities', serverInfo.IP, serverInfo.gmPort),
            qs: {}
        },
        function(err, response, body){
            if(err){
                console.error('listActivitiesSingle err = %s, channelId = %s, serverId = %s', err.stack, serverInfo.channelId, serverInfo.ID);
                return cb(err.message);
            }else{
                if(response.statusCode !== 200){
                    console.error('listActivitiesSingle statusCode = %s, channelId = %s, serverId = %s', response.statusCode,
                        serverInfo.channelId, serverInfo.ID);
                    return cb();
                }else{
                    if(body.activities){
                        return cb(null, body);
                    }else{
                        return cb();
                    }
                }
            }
        }
    );
}

function listActivitiesBatch(serverList, cb){
    async.map(
        serverList,
        function(serverInfo, callback){
            listActivitiesSingle(serverInfo, function(err, result){
                callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, result: result});
            });
        },
        function(err, results){
            if(err){
                return cb(err);
            }
            return cb(err, results);
        }
    );
}

exp.listActivities = function(req, res){
    console.log('listActivities channelIds = %j, serverIds = %j', req.body.channelIds, req.body.serverIds);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds;
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds)){
        console.log('listActivities param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // 特殊-全部,传0
        if(channelIds === 0){
            // 自动填充所有渠道ID
            channelIds = configUtils.getAllChannelIds();
            console.log('listActivities all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // 过滤出渠道
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('listActivities channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('listActivities channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('listActivities all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // 过滤出服务器
        var serverList = channelServerList;
        console.log('listActivities serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('listActivities serverList = %j', serverList);
        listActivitiesBatch(serverList, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};

function changeOpFlagsSingle(serverInfo, opFlags, cb){
    request({
            url: util.format('http://%s:%s/changeOpFlags', serverInfo.IP, serverInfo.gmPort),
            qs: {
                opFlags: JSON.stringify(opFlags)
            }
        },
        function(err, response, body){
            if(err){
                console.error('changeOpFlagsSingle err = %s, channelId = %s, serverId = %s', err.stack, serverInfo.channelId, serverInfo.ID);
                return cb(err.message);
            }else{
                if(response.statusCode !== 200){
                    console.error('changeOpFlagsSingle statusCode = %s, channelId = %s, serverId = %s', response.statusCode,
                        serverInfo.channelId, serverInfo.ID);
                    return cb();
                }else{
                    if(body.activities){
                        return cb(null, body);
                    }else{
                        return cb();
                    }
                }
            }
        }
    );
}

function changeOpFlagsBatch(serverList, opFlags, cb){
    async.map(
        serverList,
        function(serverInfo, callback){
            changeOpFlagsSingle(serverInfo, opFlags, function(err, result){
                callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, result: result});
            });
        },
        function(err, results){
            if(err){
                return cb(err);
            }
            return cb(err, results);
        }
    );
}

exp.changeOpFlags = function(req, res){
    console.log('changeOpFlags channelIds = %j, serverIds = %j, opFlags: %j', req.body.channelIds, req.body.serverIds, req.body.opFlags);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        opFlags = req.body.opFlags || '';
    opFlags = opFlags.split('#');
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds)){
        console.log('changeOpFlags param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // 特殊-全部,传0
        if(channelIds === 0){
            // 自动填充所有渠道ID
            channelIds = configUtils.getAllChannelIds();
            console.log('changeOpFlags all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // 过滤出渠道
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('changeOpFlags channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('changeOpFlags channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('changeOpFlags all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // 过滤出服务器
        var serverList = channelServerList;
        console.log('changeOpFlags serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('changeOpFlags serverList = %j', serverList);
        changeOpFlagsBatch(serverList, opFlags, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};