/**
 * Created by kilua on 2015-10-16.
 */

var util = require('util');

var _ = require('underscore'),
    async = require('async'),
    request = require('request').defaults({jar: true, json: true}),
    mysql = require('mysql');

var CODE = require('../shared/code'),
    configUtils = require('../utils/configUtils'),
    channelById = require('../config/channels/index.json'),
    serverList = require('../utils/serverList'),
    userDao = require('../dao/userDao');

var exp = module.exports = {};

function findPlayerSingle(serverInfo, username, playerId, playerName, cb){
    var mysqlConf = serverInfo.conf.GameUser,
        dbClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        });
    userDao.findPlayer(dbClient, username, playerId, playerName, function(err, res){
        dbClient.destroy();
        cb(err, res);
    });
}

function findPlayerBatch(serverList, username, playerId, playerName, cb){
    configUtils.getMysqlConf(serverList, function(err, serverList){
        if(err){
            return cb(err);
        }
        async.map(
            serverList,
            function(serverInfo, callback){
                findPlayerSingle(serverInfo, username, playerId, playerName, function(err, result){
                    callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, result: result});
                });
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

exp.findPlayer = function(req, res){
    console.log('findPlayer channelIds = %j, serverIds = %j, username = %s, playerId = %s, playerName = %s', req.body.channelIds,
        req.body.serverIds, req.body.username, req.body.playerId, req.body.playerName);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        username = req.body.username,
        playerId = parseInt(req.body.playerId),
        playerName = req.body.playerName;
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || (!username && !playerId && !playerName)){
        console.log('findPlayer param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // ����-ȫ��,��0
        if(channelIds === 0){
            // �Զ������������ID
            channelIds = configUtils.getAllChannelIds();
            console.log('findPlayer all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // ���˳�����
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('findPlayer channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('findPlayer channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('findPlayer all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // ���˳�������
        var serverList = channelServerList;
        console.log('findPlayer serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('findPlayer serverList = %j', serverList);
        findPlayerBatch(serverList, username, playerId, playerName, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};

function kickPlayerSingle(serverInfo, playerId, cb){
    request({
            url: util.format('http://%s:%s/kickPlayer', serverInfo.IP, serverInfo.gmPort),
            qs: {playerId: playerId}
        },
        function(err, response, body){
            if(err){
                console.error('kickPlayerSingle err = %s, channelId = %s, serverId = %s', err.stack, serverInfo.channelId, serverInfo.ID);
                return cb(err.message, 'fail');
            }else{
                if(response.statusCode !== 200){
                    console.error('kickPlayerSingle statusCode = %s, channelId = %s, serverId = %s', response.statusCode,
                        serverInfo.channelId, serverInfo.ID);
                    return cb(null, 'fail');
                }else{
                    var result = body.toLowerCase();
                    if(result === 'ok'){
                        return cb(null, result);
                    }else{
                        return cb(null, 'fail');
                    }
                }
            }
        }
    );
}

function kickPlayerBatch(serverList, playerId, cb){
    async.map(
        serverList,
        function(serverInfo, callback){
            kickPlayerSingle(serverInfo, playerId, function(err, result){
                callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, playerId: playerId, result: result});
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

exp.kickPlayer = function(req, res){
    console.log('kickPlayer channelIds = %j, serverIds = %j, playerId = %s', req.body.channelIds, req.body.serverIds, req.body.playerId);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        playerId = parseInt(req.body.playerId);
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || !playerId){
        console.log('kickPlayer param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // ����-ȫ��,��0
        if(channelIds === 0){
            // �Զ������������ID
            channelIds = configUtils.getAllChannelIds();
            console.log('kickPlayer all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // ���˳�����
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('kickPlayer channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('kickPlayer channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('kickPlayer all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // ���˳�������
        var serverList = channelServerList;
        console.log('kickPlayer serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('kickPlayer serverList = %j', serverList);
        kickPlayerBatch(serverList, playerId, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};

function disableChatSingle(serverInfo, uid, interval, cb){
    request({
            url: util.format('http://%s:%s/disableChat', serverInfo.IP, serverInfo.gmPort),
            qs: {uid: uid, interval: interval}
        },
        function(err, response, body){
            if(err){
                console.error('disableChatSingle err = %s, channelId = %s, serverId = %s', err.stack, serverInfo.channelId, serverInfo.ID);
                return cb(err.message, 'fail');
            }else{
                if(response.statusCode !== 200){
                    console.error('disableChatSingle statusCode = %s, channelId = %s, serverId = %s', response.statusCode,
                        serverInfo.channelId, serverInfo.ID);
                    return cb(null, 'fail');
                }else{
                    var result = body.toLowerCase();
                    if(result === 'ok'){
                        return cb(null, result);
                    }else{
                        return cb(null, 'fail');
                    }
                }
            }
        }
    );
}

function disableChatBatch(serverList, uid, interval, cb){
    async.map(
        serverList,
        function(serverInfo, callback){
            disableChatSingle(serverInfo, uid, interval, function(err, result){
                callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, uid: uid, result: result});
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

exp.disableChat = function(req, res){
    console.log('disableChat channelIds = %j, serverIds = %j, uid = %s, interval = %s', req.body.channelIds, req.body.serverIds,
    req.body.uid, req.body.interval);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        uid = parseInt(req.body.uid),
        interval = parseInt(req.body.interval);
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || !uid || !interval){
        console.log('disableChat param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // ����-ȫ��,��0
        if(channelIds === 0){
            // �Զ������������ID
            channelIds = configUtils.getAllChannelIds();
            console.log('disableChat all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // ���˳�����
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('disableChat channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('disableChat channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('disableChat all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // ���˳�������
        var serverList = channelServerList;
        console.log('disableChat serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('disableChat serverList = %j', serverList);
        disableChatBatch(serverList, uid, interval, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};

function disableLogonSingle(serverInfo, uid, interval, cb){
    request({
            url: util.format('http://%s:%s/disableLogon', serverInfo.IP, serverInfo.gmPort),
            qs: {uid: uid, interval: interval}
        },
        function(err, response, body){
            if(err){
                console.error('disableLogonSingle err = %s, channelId = %s, serverId = %s', err.stack, serverInfo.channelId, serverInfo.ID);
                return cb(err.message, 'fail');
            }else{
                if(response.statusCode !== 200){
                    console.error('disableLogonSingle statusCode = %s, channelId = %s, serverId = %s', response.statusCode,
                        serverInfo.channelId, serverInfo.ID);
                    return cb(null, 'fail');
                }else{
                    var result = body.toLowerCase();
                    if(result === 'ok'){
                        return cb(null, result);
                    }else{
                        return cb(null, 'fail');
                    }
                }
            }
        }
    );
}

function disableLogonBatch(serverList, uid, interval, cb){
    async.map(
        serverList,
        function(serverInfo, callback){
            disableLogonSingle(serverInfo, uid, interval, function(err, result){
                callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, uid: uid, result: result});
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

exp.disableLogon = function(req, res){
    console.log('disableLogon channelIds = %j, serverIds = %j, uid = %s, interval = %s', req.body.channelIds, req.body.serverIds,
        req.body.uid, req.body.interval);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        uid = parseInt(req.body.uid),
        interval = parseInt(req.body.interval);
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || !uid || !interval){
        console.log('disableLogon param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // ����-ȫ��,��0
        if(channelIds === 0){
            // �Զ������������ID
            channelIds = configUtils.getAllChannelIds();
            console.log('disableLogon all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // ���˳�����
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('disableLogon channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('disableLogon channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('disableLogon all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // ���˳�������
        var serverList = channelServerList;
        console.log('disableLogon serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('disableLogon serverList = %j', serverList);
        disableLogonBatch(serverList, uid, interval, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};

function enableChatSingle(serverInfo, uid, cb){
    request({
            url: util.format('http://%s:%s/enableChat', serverInfo.IP, serverInfo.gmPort),
            qs: {uid: uid}
        },
        function(err, response, body){
            if(err){
                console.error('enableChatSingle err = %s, channelId = %s, serverId = %s', err.stack, serverInfo.channelId, serverInfo.ID);
                return cb(err.message, 'fail');
            }else{
                if(response.statusCode !== 200){
                    console.error('enableChatSingle statusCode = %s, channelId = %s, serverId = %s', response.statusCode,
                        serverInfo.channelId, serverInfo.ID);
                    return cb(null, 'fail');
                }else{
                    var result = body.toLowerCase();
                    if(result === 'ok'){
                        return cb(null, result);
                    }else{
                        return cb(null, 'fail');
                    }
                }
            }
        }
    );
}

function enableChatBatch(serverList, uid, cb){
    async.map(
        serverList,
        function(serverInfo, callback){
            enableChatSingle(serverInfo, uid, function(err, result){
                callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, uid: uid, result: result});
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

exp.enableChat = function(req, res){
    console.log('enableChat channelIds = %j, serverIds = %j, uid = %s', req.body.channelIds, req.body.serverIds, req.body.uid);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        uid = parseInt(req.body.uid);
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || !uid){
        console.log('enableChat param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // ����-ȫ��,��0
        if(channelIds === 0){
            // �Զ������������ID
            channelIds = configUtils.getAllChannelIds();
            console.log('enableChat all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // ���˳�����
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('enableChat channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('enableChat channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('enableChat all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // ���˳�������
        var serverList = channelServerList;
        console.log('enableChat serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('enableChat serverList = %j', serverList);
        enableChatBatch(serverList, uid, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};

function enableLogonSingle(serverInfo, uid, cb){
    request({
            url: util.format('http://%s:%s/enableLogon', serverInfo.IP, serverInfo.gmPort),
            qs: {uid: uid}
        },
        function(err, response, body){
            if(err){
                console.error('enableLogonSingle err = %s, channelId = %s, serverId = %s', err.stack, serverInfo.channelId, serverInfo.ID);
                return cb(err.message, 'fail');
            }else{
                if(response.statusCode !== 200){
                    console.error('enableLogonSingle statusCode = %s, channelId = %s, serverId = %s', response.statusCode,
                        serverInfo.channelId, serverInfo.ID);
                    return cb(null, 'fail');
                }else{
                    var result = body.toLowerCase();
                    if(result === 'ok'){
                        return cb(null, result);
                    }else{
                        return cb(null, 'fail');
                    }
                }
            }
        }
    );
}

function enableLogonBatch(serverList, uid, cb){
    async.map(
        serverList,
        function(serverInfo, callback){
            enableLogonSingle(serverInfo, uid, function(err, result){
                callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, uid: uid, result: result});
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

exp.enableLogon = function(req, res){
    console.log('enableLogon channelIds = %j, serverIds = %j, uid = %s', req.body.channelIds, req.body.serverIds, req.body.uid);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        uid = parseInt(req.body.uid);
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || !uid){
        console.log('enableLogon param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // ����-ȫ��,��0
        if(channelIds === 0){
            // �Զ������������ID
            channelIds = configUtils.getAllChannelIds();
            console.log('enableLogon all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // ���˳�����
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('enableLogon channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('enableLogon channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('enableLogon all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // ���˳�������
        var serverList = channelServerList;
        console.log('enableLogon serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('enableLogon serverList = %j', serverList);
        enableLogonBatch(serverList, uid, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};