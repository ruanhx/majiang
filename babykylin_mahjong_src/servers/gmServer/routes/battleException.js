/**
 * Created by kilua on 2015-10-19.
 */

var util = require('util');

var _ = require('underscore'),
    async = require('async'),
    mysql = require('mysql'),
    request = require('request').defaults({jar: true, json: true});

var CODE = require('../shared/code'),
    configUtils = require('../utils/configUtils'),
    channelById = require('../config/channels/index.json'),
    serverList = require('../utils/serverList'),
    playerActionLogDao = require('../dao/playerActionLogDao'),
    exceptionStatDao = require('../dao/exceptionStatDao'),
    userDao = require('../dao/userDao'),
    common = require('../utils/common');

var exp = module.exports = {};

function getUserInfoByPlayerId(serverInfo, playerId, cb){
    var mysqlConf = serverInfo.conf.GameUser,
        dbClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        });
    userDao.getUserInfoByPlayerId(dbClient, playerId, function(err, userInfo){
        dbClient.destroy();
        cb(err, userInfo);
    });
}

function getUserInfoByPlayerIds(serverInfo, playerIds, cb){
    var mysqlConf = serverInfo.conf.GameUser,
        dbClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        });
    userDao.getUserInfoByPlayerIds(dbClient, playerIds, function(err, userInfos){
        dbClient.destroy();
        cb(err, userInfos);
    });
}

function getUserInfoByUsername(serverInfo, username, cb){
    var mysqlConf = serverInfo.conf.GameUser,
        dbClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        });
    userDao.getUserInfoByUsername(dbClient, username, function(err, userInfo){
        dbClient.destroy();
        cb(err, userInfo);
    });
}

function getLogSingle(serverInfo, begin, end, username, playerId, playerName, cb){
    var mysqlConf = serverInfo.conf.GameLog,
        dbClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        });
    playerActionLogDao.getBattleException(dbClient, begin, end, username, playerId, playerName, function(err, results){
        dbClient.destroy();
        var playerIds = _.pluck(results, 'playerId');
        if(!!playerIds && playerIds.length > 0){
            getUserInfoByPlayerIds(serverInfo, playerIds, function(err, userInfos){
                var userInfoByPlayerId = _.indexBy(userInfos, 'playerId');
                results.forEach(function(result){
                    var userInfo = userInfoByPlayerId[result.playerId];
                    if(userInfo){
                        result.username = userInfo.username;
                        result.playerName = userInfo.name;
                    }
                });
                cb(null, results);
            });
        }else{
            cb(err, results);
        }
    });
}

function getLogSingleEx(serverInfo, begin, end, username, playerId, playerName, cb){
    function getPlayerIdCallback(err, playerId){
        if(!!playerId){
            getLogSingle(serverInfo, begin, end, '', playerId, '', cb);
        }else{
            cb(null, []);
        }
    }
    if(!!username){
        return common.getPlayerIdByUser(serverInfo, username, getPlayerIdCallback);
    }
    if(!!playerName){
        return common.getPlayerIdByName(serverInfo, playerName, getPlayerIdCallback);
    }
    return getLogSingle(serverInfo, begin, end, '', playerId, '', cb);
}

function getLogBatch(serverList, begin, end, username, playerId, playerName, cb){
    configUtils.getMysqlConf(serverList, function(err, serverList){
        if(err){
            return cb(err);
        }
        async.map(
            serverList,
            function(serverInfo, callback){
                getLogSingleEx(serverInfo, begin, end, username, playerId, playerName, function(err, results){
                    callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, results: results})
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

/*
*   username��playerName�����ݲ�֧��
* */
exp.getLog = function(req, res){
    console.log('getLog channelIds = %j, serverIds = %j, begin = %s, end = %s, username = %s, playerId = %s, playerName = %s',
        req.body.channelIds, req.body.serverIds, req.body.begin, req.body.end, req.body.username, req.body.playerId, req.body.playerName);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        begin = parseInt(req.body.begin),
        end = parseInt(req.body.end),
        username = req.body.username,
        playerId = parseInt(req.body.playerId),
        playerName = req.body.playerName;
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || !begin || !end){
        console.log('getLog param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // ����-ȫ��,��0
        if(channelIds === 0){
            // �Զ������������ID
            channelIds = configUtils.getAllChannelIds();
            console.log('getLog all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // ���˳�����
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('getLog channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('getLog channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('getLog all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // ���˳�������
        var serverList = channelServerList;
        console.log('getLog serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('getLog serverList = %j', serverList);
        getLogBatch(serverList, begin, end, username, playerId, playerName, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};

function getStatSingle(serverInfo, username, playerId, playerName, cb){
    var mysqlConf = serverInfo.conf.GameUser,
        dbClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        });
    exceptionStatDao.getStat(dbClient, username, playerId, playerName, function(err, res){
        dbClient.destroy();
        cb(err, res);
    });
}

function getStatBatch(serverList, username, playerId, playerName, cb){
    configUtils.getMysqlConf(serverList, function(err, serverList){
        if(err){
            return cb(err);
        }
        async.map(
            serverList,
            function(serverInfo, callback){
                getStatSingle(serverInfo, username, playerId, playerName, function(err, results){
                    callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, results: results})
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

exp.getStat = function(req, res){
    console.log('getStat channelIds = %j, serverIds = %j, username = %s, playerId = %s, playerName = %s',
        req.body.channelIds, req.body.serverIds, req.body.username, req.body.playerId, req.body.playerName);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        username = req.body.username,
        playerId = parseInt(req.body.playerId),
        playerName = req.body.playerName;
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds)){
        console.log('getStat param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // ����-ȫ��,��0
        if(channelIds === 0){
            // �Զ������������ID
            channelIds = configUtils.getAllChannelIds();
            console.log('getStat all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // ���˳�����
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('getStat channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('getStat channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('getStat all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // ���˳�������
        var serverList = channelServerList;
        console.log('getStat serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('getStat serverList = %j', serverList);
        getStatBatch(serverList, username, playerId, playerName, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};

function addTraceByNameSingle(serverInfo, playerName, cb){
    request({
            url: util.format('http://%s:%s/addExceptionPlayerByName', serverInfo.IP, serverInfo.gmPort),
            qs: {
                playerName: playerName
            }
        },
        function(err, response, body){
            if(err){
                console.error('addTraceByNameSingle err = %s, channelId = %s, serverId = %s', err.stack, serverInfo.channelId, serverInfo.ID);
                return cb(err.message);
            }else{
                if(response.statusCode !== 200){
                    console.error('addTraceByNameSingle statusCode = %s, channelId = %s, serverId = %s', response.statusCode,
                        serverInfo.channelId, serverInfo.ID);
                    return cb();
                }else{
                    return cb(null, (body.toLowerCase() === 'ok'));
                }
            }
        }
    );
}

function addTraceByNameBatch(serverList, playerName, cb){
    async.map(
        serverList,
        function(serverInfo, callback){
            addTraceByNameSingle(serverInfo, playerName, function(err, result){
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

function getPlayerNameBatch(serverList, playername, username, playerId, cb){
    if(!!playername){
        return cb(null, playername);
    }
    configUtils.getMysqlConf(serverList, function(err, serverList){
        if(err){
            return cb(err);
        }
        async.map(
            serverList,
            function(serverInfo, callback){
                if(!!playerId){
                    return getUserInfoByPlayerId(serverInfo, playerId, function(err, playerInfo){
                        if(playerInfo){
                            return callback(null, playerInfo.name);
                        }
                        callback(err);
                    });
                }
                if(!!username){
                    return getUserInfoByUsername(serverInfo, username, function(err, playerInfo){
                        if(playerInfo){
                            return callback(null, playerInfo.name);
                        }
                        return callback(err);
                    });
                }
            },
            function(err, results){
                if(err){
                    return cb(err);
                }
                return cb(null, results[0]);
            }
        )
    });
}

exp.addTraceByName = function(req, res){
    console.log('addTraceByName channelIds = %j, serverIds = %j, playerName: %s, username = %s, playerId = %s',
        req.body.channelIds, req.body.serverIds, req.body.playerName, req.body.username, req.body.playerId);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        playerName = req.body.playerName || '',
        username = req.body.username || '',
        playerId = req.body.playerId || 0;
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || (!playerName && !username && !playerId)){
        console.log('addTraceByName param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        if(channelIds === 0){
            // 获取所有渠道ID
            channelIds = configUtils.getAllChannelIds();
            console.log('addTraceByName all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // 过滤指定渠道列表
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('addTraceByName channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('addTraceByName channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('addTraceByName all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        var serverList = channelServerList;
        console.log('addTraceByName serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('addTraceByName serverList = %j', serverList);

        getPlayerNameBatch(serverList, playerName, username, playerId, function(err, playerName){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            addTraceByNameBatch(serverList, playerName, function(err, results){
                if(err){
                    return res.send({code: CODE.FAIL});
                }
                return res.send({code: CODE.OK, results: results});
            });
        });
    });
};

function delTraceByNameSingle(serverInfo, playerName, cb){
    request({
            url: util.format('http://%s:%s/removeExceptionPlayerByName', serverInfo.IP, serverInfo.gmPort),
            qs: {
                playerName: playerName
            }
        },
        function(err, response, body){
            if(err){
                console.error('delTraceByNameSingle err = %s, channelId = %s, serverId = %s', err.stack, serverInfo.channelId, serverInfo.ID);
                return cb(err.message);
            }else{
                if(response.statusCode !== 200){
                    console.error('delTraceByNameSingle statusCode = %s, channelId = %s, serverId = %s', response.statusCode,
                        serverInfo.channelId, serverInfo.ID);
                    return cb();
                }else{
                    return cb(null, (body.toLowerCase() === 'ok'));
                }
            }
        }
    );
}

function delTraceByNameBatch(serverList, playerName, cb){
    async.map(
        serverList,
        function(serverInfo, callback){
            delTraceByNameSingle(serverInfo, playerName, function(err, result){
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

exp.delTraceByName = function(req, res){
    console.log('delTraceByName channelIds = %j, serverIds = %j, playerName: %s', req.body.channelIds, req.body.serverIds, req.body.playerName);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        playerName = req.body.playerName || '';
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || !playerName){
        console.log('delTraceByName param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // ����-ȫ��,��0
        if(channelIds === 0){
            // �Զ������������ID
            channelIds = configUtils.getAllChannelIds();
            console.log('delTraceByName all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // ���˳�����
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('delTraceByName channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('delTraceByName channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('delTraceByName all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // ���˳�������
        var serverList = channelServerList;
        console.log('delTraceByName serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('delTraceByName serverList = %j', serverList);
        delTraceByNameBatch(serverList, playerName, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};

function getTraceRecordSingle(serverInfo, username, playerId, playerName, cb){
    var mysqlConf = serverInfo.conf.GameUser,
        dbClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        });
    exceptionStatDao.getTraceRecord(dbClient, username, playerId, playerName, function(err, res){
        dbClient.destroy();
        cb(err, res);
    });
}

function getTraceRecordBatch(serverList, username, playerId, playerName, cb){
    configUtils.getMysqlConf(serverList, function(err, serverList){
        if(err){
            return cb(err);
        }
        async.map(
            serverList,
            function(serverInfo, callback){
                getTraceRecordSingle(serverInfo, username, playerId, playerName, function(err, results){
                    callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, results: results})
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

/*
*   username��playerName�����ݲ�֧��
* */
exp.getTraceRecord = function(req, res){
    console.log('getTraceRecord channelIds = %j, serverIds = %j, username = %s, playerId = %s, playerName = %s',
        req.body.channelIds, req.body.serverIds, req.body.username, req.body.playerId, req.body.playerName);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        username = req.body.username,
        playerId = parseInt(req.body.playerId),
        playerName = req.body.playerName;
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds)){
        console.log('getTraceRecord param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // ����-ȫ��,��0
        if(channelIds === 0){
            // �Զ������������ID
            channelIds = configUtils.getAllChannelIds();
            console.log('getTraceRecord all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // ���˳�����
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('getTraceRecord channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('getTraceRecord channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('getTraceRecord all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // ���˳�������
        var serverList = channelServerList;
        console.log('getTraceRecord serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('getTraceRecord serverList = %j', serverList);
        getTraceRecordBatch(serverList, username, playerId, playerName, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};