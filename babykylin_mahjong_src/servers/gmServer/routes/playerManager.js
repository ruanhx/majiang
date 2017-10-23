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
    userDao.getPlayerDetail(dbClient, username, playerId, playerName, function(err, res){
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
                findPlayerSingle(serverInfo, username, playerId, playerName, function(err, playerList){
                    callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, playerList: playerList})
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

exp.findPlayer = function(req, res){
    console.log('findPlayer channelIds = %j, serverIds = %j, username = %s, playerId = %s, playerName = %s',
        req.body.channelIds, req.body.serverIds, req.body.username, req.body.playerId, req.body.playerName);
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
        // 特殊-全部,传0
        if(channelIds === 0){
            // 自动填充所有渠道ID
            channelIds = configUtils.getAllChannelIds();
            console.log('findPlayer all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // 过滤出渠道
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
        // 过滤出服务器
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

function listItemsSingle(serverInfo, username, playerId, playerName, cb){
    var mysqlConf = serverInfo.conf.GameUser,
        dbClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        });
    userDao.listItems(dbClient, username, playerId, playerName, function(err, res){
        dbClient.destroy();
        cb(err, res);
    });
}

function listItemsBatch(serverList, username, playerId, playerName, cb){
    configUtils.getMysqlConf(serverList, function(err, serverList){
        if(err){
            return cb(err);
        }
        async.map(
            serverList,
            function(serverInfo, callback){
                listItemsSingle(serverInfo, username, playerId, playerName, function(err, results){
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

exp.listItems = function(req, res){
    console.log('listItems channelIds = %j, serverIds = %j, username = %s, playerId = %s, playerName = %s',
        req.body.channelIds, req.body.serverIds, req.body.username, req.body.playerId, req.body.playerName);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        username = req.body.username,
        playerId = parseInt(req.body.playerId),
        playerName = req.body.playerName;
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || (!username && !playerId && !playerName)){
        console.log('listItems param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // 特殊-全部,传0
        if(channelIds === 0){
            // 自动填充所有渠道ID
            channelIds = configUtils.getAllChannelIds();
            console.log('listItems all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // 过滤出渠道
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('listItems channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('listItems channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('listItems all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // 过滤出服务器
        var serverList = channelServerList;
        console.log('listItems serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('listItems serverList = %j', serverList);
        listItemsBatch(serverList, username, playerId, playerName, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};

function listCardsSingle(serverInfo, username, playerId, playerName, cb){
    var mysqlConf = serverInfo.conf.GameUser,
        dbClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        });
    userDao.listCards(dbClient, username, playerId, playerName, function(err, res){
        dbClient.destroy();
        cb(err, res);
    });
}

function listCardsBatch(serverList, username, playerId, playerName, cb){
    configUtils.getMysqlConf(serverList, function(err, serverList){
        if(err){
            return cb(err);
        }
        async.map(
            serverList,
            function(serverInfo, callback){
                listCardsSingle(serverInfo, username, playerId, playerName, function(err, results){
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

exp.listCards = function(req, res){
    console.log('listCards channelIds = %j, serverIds = %j, username = %s, playerId = %s, playerName = %s',
        req.body.channelIds, req.body.serverIds, req.body.username, req.body.playerId, req.body.playerName);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        username = req.body.username,
        playerId = parseInt(req.body.playerId),
        playerName = req.body.playerName;
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || (!username && !playerId && !playerName)){
        console.log('listCards param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // 特殊-全部,传0
        if(channelIds === 0){
            // 自动填充所有渠道ID
            channelIds = configUtils.getAllChannelIds();
            console.log('listCards all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // 过滤出渠道
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('listCards channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('listCards channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('listCards all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // 过滤出服务器
        var serverList = channelServerList;
        console.log('listCards serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('listCards serverList = %j', serverList);
        listCardsBatch(serverList, username, playerId, playerName, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};

function listCardFragsSingle(serverInfo, username, playerId, playerName, cb){
    var mysqlConf = serverInfo.conf.GameUser,
        dbClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        });
    userDao.listCardFrags(dbClient, username, playerId, playerName, function(err, res){
        dbClient.destroy();
        cb(err, res);
    });
}

function listCardFragsBatch(serverList, username, playerId, playerName, cb){
    configUtils.getMysqlConf(serverList, function(err, serverList){
        if(err){
            return cb(err);
        }
        async.map(
            serverList,
            function(serverInfo, callback){
                listCardFragsSingle(serverInfo, username, playerId, playerName, function(err, results){
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

exp.listCardFrags = function(req, res){
    console.log('listCardFrags channelIds = %j, serverIds = %j, username = %s, playerId = %s, playerName = %s',
        req.body.channelIds, req.body.serverIds, req.body.username, req.body.playerId, req.body.playerName);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        username = req.body.username,
        playerId = parseInt(req.body.playerId),
        playerName = req.body.playerName;
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || (!username && !playerId && !playerName)){
        console.log('listCardFrags param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // 特殊-全部,传0
        if(channelIds === 0){
            // 自动填充所有渠道ID
            channelIds = configUtils.getAllChannelIds();
            console.log('listCardFrags all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // 过滤出渠道
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('listCardFrags channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('listCardFrags channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('listCardFrags all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // 过滤出服务器
        var serverList = channelServerList;
        console.log('listCardFrags serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('listCardFrags serverList = %j', serverList);
        listCardFragsBatch(serverList, username, playerId, playerName, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};