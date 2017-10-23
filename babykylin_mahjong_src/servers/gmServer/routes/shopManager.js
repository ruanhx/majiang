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

function getShopFlagsSingle(serverInfo, cb){
    request({
            url: util.format('http://%s:%s/getShopFlags', serverInfo.IP, serverInfo.gmPort),
            qs: {}
        },
        function(err, response, body){
            if(err){
                console.error('getShopFlagsSingle err = %s, channelId = %s, serverId = %s', err.stack, serverInfo.channelId, serverInfo.ID);
                return cb(err.message);
            }else{
                if(response.statusCode !== 200){
                    console.error('getShopFlagsSingle statusCode = %s, channelId = %s, serverId = %s', response.statusCode,
                        serverInfo.channelId, serverInfo.ID);
                    return cb();
                }else{
                    if(body.code.toLowerCase() === 'ok'){
                        return cb(null, body.shopFlags);
                    }else{
                        return cb();
                    }
                }
            }
        }
    );
}

function getShopFlagsBatch(serverList, cb){
    async.map(
        serverList,
        function(serverInfo, callback){
            getShopFlagsSingle(serverInfo, function(err, result){
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

exp.getShopFlags = function(req, res){
    console.log('getShopFlags channelIds = %j, serverIds = %j', req.body.channelIds, req.body.serverIds);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds;
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds)){
        console.log('getShopFlags param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // ����-ȫ��,��0
        if(channelIds === 0){
            // �Զ������������ID
            channelIds = configUtils.getAllChannelIds();
            console.log('getShopFlags all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // ���˳�����
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('getShopFlags channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('getShopFlags channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('getShopFlags all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // ���˳�������
        var serverList = channelServerList;
        console.log('getShopFlags serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('getShopFlags serverList = %j', serverList);
        getShopFlagsBatch(serverList, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};

function changeOpFlagsSingle(serverInfo, opFlags, cb){
    request({
            url: util.format('http://%s:%s/changeShopFlags', serverInfo.IP, serverInfo.gmPort),
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
                    return cb(null, body);
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

exp.changeShopFlags = function(req, res){
    console.log('changeShopFlags channelIds = %j, serverIds = %j, opFlags: %j', req.body.channelIds, req.body.serverIds, req.body.opFlags);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        opFlags = req.body.opFlags || '';
    opFlags = opFlags.split('#');
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds)){
        console.log('changeShopFlags param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // ����-ȫ��,��0
        if(channelIds === 0){
            // �Զ������������ID
            channelIds = configUtils.getAllChannelIds();
            console.log('changeShopFlags all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // ���˳�����
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('changeShopFlags channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('changeShopFlags channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('changeShopFlags all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // ���˳�������
        var serverList = channelServerList;
        console.log('changeShopFlags serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('changeShopFlags serverList = %j', serverList);
        changeOpFlagsBatch(serverList, opFlags, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};