/**
 * Created by kilua on 2015-10-15.
 */
var util = require('util');

var request = require('request'),
    _ = require('underscore'),
    async = require('async');

var CONSTS = require('../config/consts');

var exp = module.exports = {};

var getServerList = exp.getServerList = function(channelInfo, cb){
    var options = {
        method: 'GET',
        uri: util.format('http://%s:%s/serverList?MAC=%s&isAdmin=true', channelInfo.host, channelInfo.port, CONSTS.MAC)
    };
    console.log('getServerList channel.id = %s', channelInfo.id);
    request(options, function(err, response, body){
        if(err){
            console.error('getServerList err = %s, channel.id = %s', err.stack, channelInfo.id);
            return cb(err.message);
        }
        if(response.statusCode === 200){
            body = JSON.parse(body);
            channelInfo.serverList = [];
            body.serverList = body.serverList || [];
            body.serverList.forEach(function(serverInfo){
                channelInfo.serverList.push(_.extend(_.pick(serverInfo, 'ID', 'name', 'IP', 'port', 'gmPort'),
                    {channelId: channelInfo.id, channelName: channelInfo.name}));
            });
            return cb(null, channelInfo);
        }
        return cb(null);
    });
};
/*
 *   ��ȡָ�������ķ������б�
 * */
var getServerListEx = exp.getServerListEx = function(channels, cb){
    console.log('getServerListEx channels = %j', channels);
    async.map(
        channels,
        getServerList,
        function(err, results){
            if(err){
                return cb(err);
            }
            results = results || [];
            // ɾ�����ܵĿ�����
            results.forEach(function(result, idx){
                if(!result || result.serverList.length === 0){
                    results.splice(idx, 1);
                }
            });
            results = _.indexBy(results, 'id');
            var serverList = [];
            _.each(results, function(result){
                serverList = serverList.concat(result.serverList);
            });
            return cb(null, serverList);
        }
    );
};