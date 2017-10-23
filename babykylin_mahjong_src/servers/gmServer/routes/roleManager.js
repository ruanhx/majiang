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
    playerDao = require('../dao/playerDao'),
    common = require('../utils/common');

var exp = module.exports = {};

function querySingle(serverInfo, playerId, playerName, cb){
    var mysqlConf = serverInfo.conf.GameUser,
        dbClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        });
    if(!!playerName){
        playerDao.getPlayersByName(dbClient,playerName,function(err, res){
            dbClient.destroy();
            cb(err, res);
        });
    }else if(!!playerId){
        playerDao.getPlayersById(dbClient,playerId,function(err, res){
            dbClient.destroy();
            cb(err, res);
        });
    }
}



// function querySingleEx(serverInfo, playerId, playerName, cb){
//
//
//     if(!!playerName){
//         return common.getPlayerIdByName(serverInfo, playerName, getPlayerIdCallback);
//     }
//     if(!!playerId){
//         return querySingle(serverInfo, playerId, '', cb);
//     }
//
// }

function queryBatch(serverList, playerId, playerName, cb){
    configUtils.getMysqlConf(serverList, function(err, serverList){
        if(err){
            return cb(err);
        }
        async.map(
            serverList,
            function(serverInfo, callback){
                querySingle(serverInfo, playerId, playerName, function (err, res) {
                    callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, playerInfo: res})
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
*   username,playerId,playerName������������ʱֻ֧��playerId��������3�������������Ļ�����ȫ��
* */
exp.getRoleInfo = function(req, res){
    console.log('getRoleInfo channelIds = %j, serverIds = %j, playerId = %s, playerName = %s',
        req.body.channelIds, req.body.serverIds, req.body.playerId, req.body.playerName);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        // begin = parseInt(req.body.begin),
        // end = parseInt(req.body.end),
        // username = req.body.username,
        playerId = parseInt(req.body.playerId),
        playerName = req.body.playerName;
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds)){
        console.log('getRoleInfo param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // ����-ȫ��,��0
        if(channelIds === 0){
            // �Զ������������ID
            channelIds = configUtils.getAllChannelIds();
            console.log('getRoleInfo all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // ���˳�����
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('getRoleInfo channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('getRoleInfo channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('getRoleInfo all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // ���˳�������
        var serverList = channelServerList;
        console.log('getRoleInfo serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('getRoleInfo serverList = %j', serverList);
        queryBatch(serverList,playerId, playerName, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};