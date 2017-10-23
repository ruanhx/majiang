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
    playerActionLogDao = require('../dao/playerActionLogDao'),
    common = require('../utils/common');

var exp = module.exports = {};

function querySingle(serverInfo, begin, end, username, playerId, playerName, cb){
    var mysqlConf = serverInfo.conf.GameLog,
        dbClient = mysql.createConnection({
            host: mysqlConf.host,
            port: mysqlConf.port,
            user: mysqlConf.user,
            password: mysqlConf.password,
            database: mysqlConf.database,
            supportBigNumbers: true
        });
    playerActionLogDao.getSnHistories(dbClient, begin, end, username, playerId, playerName, function(err, snHistories){
        dbClient.destroy();
        cb(err, snHistories);
    });
}

function querySingleEx(serverInfo, begin, end, username, playerId, playerName, cb){
    function getPlayerIdCallback(err, playerId){
        if(!!playerId){
            querySingle(serverInfo, begin, end, '', playerId, '', cb);
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
    if(!!playerId){
        return querySingle(serverInfo, begin, end, '', playerId, '', cb);
    }
    // 全部
    return querySingle(serverInfo, begin, end, '', 0, '', cb);
}

function queryBatch(serverList, begin, end, username, playerId, playerName, cb){
    configUtils.getMysqlConf(serverList, function(err, serverList){
        if(err){
            return cb(err);
        }
        async.map(
            serverList,
            function(serverInfo, callback){
                querySingleEx(serverInfo, begin, end, username, playerId, playerName, function(err, snHistories){
                    callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, snHistories: snHistories})
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
exp.getSnHistories = function(req, res){
    console.log('getSnHistories channelIds = %j, serverIds = %j, begin = %s, end = %s, username = %s, playerId = %s, playerName = %s',
        req.body.channelIds, req.body.serverIds, req.body.begin, req.body.end, req.body.username, req.body.playerId, req.body.playerName);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        begin = parseInt(req.body.begin),
        end = parseInt(req.body.end),
        username = req.body.username,
        playerId = parseInt(req.body.playerId),
        playerName = req.body.playerName;
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || !begin || !end){
        console.log('getSnHistories param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // ����-ȫ��,��0
        if(channelIds === 0){
            // �Զ������������ID
            channelIds = configUtils.getAllChannelIds();
            console.log('getSnHistories all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // ���˳�����
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('getSnHistories channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('getSnHistories channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('getSnHistories all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // ���˳�������
        var serverList = channelServerList;
        console.log('getSnHistories serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('getSnHistories serverList = %j', serverList);
        queryBatch(serverList, begin, end, username, playerId, playerName, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};