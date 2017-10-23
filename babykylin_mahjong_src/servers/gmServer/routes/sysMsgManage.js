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

function sendAnnouncementSingle(serverInfo, announcement, sendCount, interval, priority, pos, sendTime, cb){
    request({
            url: util.format('http://%s:%s/sendAnnouncement', serverInfo.IP, serverInfo.gmPort),
            qs: {announcement: announcement, sendCount: sendCount, interval: interval, priority: priority, pos: pos,
                sendTime: sendTime}
        },
        function(err, response, body){
            if(err){
                console.error('sendAnnouncementSingle err = %s, channelId = %s, serverId = %s', err.stack, serverInfo.channelId, serverInfo.ID);
                return cb(err.message, false);
            }else{
                if(response.statusCode !== 200){
                    console.error('sendAnnouncementSingle statusCode = %s, channelId = %s, serverId = %s', response.statusCode,
                        serverInfo.channelId, serverInfo.ID);
                    return cb(null, false);
                }else{
                    body.result = body.result || '';
                    body.emitterId = body.emitterId || 0;
                    if(body.result.toLowerCase() === 'ok'){
                        return cb(null, true, body.emitterId);
                    }else{
                        return cb(null, false, body.emitterId);
                    }
                }
            }
        }
    );
}

function sendAnnouncementBatch(serverList, announcement, sendCount, interval, priority, pos, sendTime, cb){
    async.map(
        serverList,
        function(serverInfo, callback){
            sendAnnouncementSingle(serverInfo, announcement, sendCount, interval, priority, pos, sendTime, function(err, success, emitterId){
                callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, success: success, emitterId: emitterId});
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

exp.sendAnnouncement = function(req, res){
    console.log('sendAnnouncement channelIds = %j, serverIds = %j, announcement = %s, sendCount = %s, interval = %s,' +
        'priority = %s, pos = %s, sendTime = %s',
        req.body.channelIds, req.body.serverIds, req.body.announcement, req.body.sendCount, req.body.interval,
        req.body.priority, req.body.pos, req.body.sendTime);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        announcement = req.body.announcement,
        sendCount = parseInt(req.body.sendCount),
        interval = parseInt(req.body.interval),
        priority = req.body.priority,
        pos = req.body.pos,
        sendTime = req.body.sendTime * 1000;
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || !announcement || _.isUndefined(sendCount)
    || _.isUndefined(priority) || _.isUndefined(pos) || _.isUndefined(sendTime)){
        console.log('sendAnnouncement param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // 所有渠道
        if(channelIds === 0){
            // 获取所有渠道ID
            channelIds = configUtils.getAllChannelIds();
            console.log('sendAnnouncement all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // 过滤出指定渠道
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('sendAnnouncement channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('sendAnnouncement channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('sendAnnouncement all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // 过滤出指定服务器列表
        var serverList = channelServerList;
        console.log('sendAnnouncement serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('sendAnnouncement serverList = %j', serverList);
        sendAnnouncementBatch(serverList, announcement, sendCount, interval, priority, pos, sendTime, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};

function cancelAnnouncementSingle(serverInfo, emitterId, cb){
    request({
            url: util.format('http://%s:%s/cancelAnnouncement', serverInfo.IP, serverInfo.gmPort),
            qs: {emitterId: emitterId}
        },
        function(err, response, body){
            if(err){
                console.error('cancelAnnouncementSingle err = %s, channelId = %s, serverId = %s', err.stack, serverInfo.channelId,
                    serverInfo.ID);
                return cb(err.message, false);
            }else{
                if(response.statusCode !== 200){
                    console.error('cancelAnnouncementSingle statusCode = %s, channelId = %s, serverId = %s', response.statusCode,
                        serverInfo.channelId, serverInfo.ID);
                    return cb(null, false);
                }else{
                    if(body.toLowerCase() === 'ok'){
                        return cb(null, true);
                    }else{
                        return cb(null, false);
                    }
                }
            }
        }
    );
}

exp.cancelAnnouncement = function(req, res){
    console.log('cancelAnnouncement channelId = %j, serverId = %j, emitterId = %s', req.body.channelId,
        req.body.serverId, req.body.emitterId);
    var channelId = req.body.channelId,
        serverId = req.body.serverId,
        emitterId = req.body.emitterId;
    if(_.isUndefined(channelId) || _.isUndefined(serverId) || !emitterId){
        console.log('cancelAnnouncement param error!');
        return res.send({code: CODE.FAIL});
    }
    // 过滤出指定渠道
    var targetChannel = _.find(channelById, function(channelInfo){
        return (parseInt(channelId) === channelInfo.id);
    });
    console.log('cancelAnnouncement targetChannel = %j', targetChannel);
    serverList.getServerList(targetChannel, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('cancelAnnouncement channelServerList = %j', channelServerList);
        var targetServer = _.find(channelServerList.serverList, function(serverInfo){
            return (parseInt(serverId) === serverInfo.ID);
        });
        console.log('cancelAnnouncement targetServer = %j', targetServer);
        cancelAnnouncementSingle(targetServer, emitterId, function(err, result){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, result: result});
        });
    });
};

function getAnnouncementSingle(serverInfo, cb){
    request({
            url: util.format('http://%s:%s/getAnnouncements', serverInfo.IP, serverInfo.gmPort),
            qs: {}
        },
        function(err, response, body){
            if(err){
                console.error('getAnnouncementSingle err = %s, channelId = %s, serverId = %s', err.stack, serverInfo.channelId, serverInfo.ID);
                return cb(err.message, false);
            }else{
                if(response.statusCode !== 200){
                    console.error('getAnnouncementSingle statusCode = %s, channelId = %s, serverId = %s', response.statusCode,
                        serverInfo.channelId, serverInfo.ID);
                    return cb(null, false);
                }else{
                    body.result = body.result || '';
                    body.announcements = body.announcements || [];
                    if(body.result.toLowerCase() === 'ok'){
                        return cb(null, true, body.announcements);
                    }else{
                        return cb(null, false, body.announcements);
                    }
                }
            }
        }
    );
}

function getAnnouncementBatch(serverList, cb){
    async.map(
        serverList,
        function(serverInfo, callback){
            getAnnouncementSingle(serverInfo, function(err, success, announcements){
                callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, success: success, announcements: announcements});
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

exp.getAnnouncements = function(req, res){
    console.log('getAnnouncements channelIds = %j, serverIds = %j', req.body.channelIds, req.body.serverIds);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds;
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds)){
        console.log('getAnnouncements param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // 所有渠道
        if(channelIds === 0){
            // 获取所有渠道ID
            channelIds = configUtils.getAllChannelIds();
            console.log('getAnnouncements all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // 过滤出指定渠道
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('getAnnouncements channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('getAnnouncements channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('getAnnouncements all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // 过滤出指定服务器列表
        var serverList = channelServerList;
        console.log('getAnnouncements serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('getAnnouncements serverList = %j', serverList);
        getAnnouncementBatch(serverList, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};