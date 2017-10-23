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

function sendMailSingle(serverInfo, mailInfo, cb){
    request({
            url: util.format('http://%s:%s/sendMail', serverInfo.IP, serverInfo.gmPort),
            qs: {
                title: mailInfo.title,
                sender: mailInfo.sender,
                // ̧ͷ�ɿͻ���ƴ�ӵ�info��
                info: mailInfo.info,
                drop: mailInfo.drop,
                targetUser: mailInfo.account,
                targetID: mailInfo.targetID,
                targetName: mailInfo.targetName,
                less: mailInfo.less,
                greater: mailInfo.greater,
                life: mailInfo.life,
                serverMail: mailInfo.serverMail,
            }
        },
        function(err, response, body){
            if(err){
                console.error('sendMailSingle err = %s, channelId = %s, serverId = %s', err.stack, serverInfo.channelId, serverInfo.ID);
                return cb(err.message, false);
            }else{
                if(response.statusCode !== 200){
                    console.error('sendMailSingle statusCode = %s, channelId = %s, serverId = %s', response.statusCode,
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

function sendMailBatch(serverList, mailInfo, cb){
    async.map(
        serverList,
        function(serverInfo, callback){
            sendMailSingle(serverInfo, mailInfo, function(err, success){
                callback(err, {channelId: serverInfo.channelId, serverId: serverInfo.ID, success: success});
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

exp.sendMail = function(req, res){
    console.log('sendMail channelIds = %j, serverIds = %j, mailInfo: %j', req.body.channelIds, req.body.serverIds, req.body.mailInfo);
    var channelIds = req.body.channelIds,
        serverIds = req.body.serverIds,
        mailInfo = JSON.parse(req.body.mailInfo);
    if(_.isUndefined(channelIds) || _.isUndefined(serverIds) || _.isUndefined(mailInfo)){
        console.log('sendMail param error!');
        return res.send({code: CODE.FAIL});
    }
    if(!(channelIds instanceof Array)){
        channelIds = parseInt(channelIds);
        // ����-ȫ��,��0
        if(channelIds === 0){
            // �Զ������������ID
            channelIds = configUtils.getAllChannelIds();
            console.log('sendMail all channelIds = %j', channelIds);
        }else {
            channelIds = [channelIds];
        }
    }
    // ���˳�����
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(channelIds, channelInfo.id);
    });
    console.log('sendMail channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('sendMail channelServerList = %j', channelServerList);
        if(!(serverIds instanceof Array)){
            serverIds = parseInt(serverIds);
            if(serverIds === 0){
                serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('sendMail all serverIds = %j', serverIds);
            }else {
                serverIds = [serverIds];
            }
        }
        // ���˳�������
        var serverList = channelServerList;
        console.log('sendMail serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(serverIds, serverInfo.ID);
        });
        console.log('sendMail serverList = %j', serverList);
        sendMailBatch(serverList, mailInfo, function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
};