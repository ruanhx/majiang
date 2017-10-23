/**
 * Created by kilua on 2015-10-14.
 */

var path = require('path'),
    fs = require('fs'),
    util = require('util');

var async = require('async'),
    _ = require('underscore');

var passwordEncoder = require('../utils/passwordEncoder'),
    channelById = require('../config/channels/index.json');

var exp = module.exports = {};

exp.getMysqlConf = function(servers, cb){
    var basePath = './config/channels';
    servers = servers || [];
    async.map(servers,
        function(server, callback){
            var cfgFile = path.join(basePath, util.format('%s/%s', server.channelId, server.name), 'mysql.json');
            fs.readFile(cfgFile, {encoding: 'utf8'}, function(err, data){
                if(err){
                    console.error('read %s err %s', cfgFile, err.stack);
                    return callback(err.message);
                }else{
                    var mySqlConf = JSON.parse(data).development;
                    // 解密数据库密码
                    _.each(mySqlConf, function(dbConfig){
                        dbConfig.password = passwordEncoder.decrypt(dbConfig.password);
                    });
                    callback(null, _.extend(server, {conf: mySqlConf}));
                }
            });
        },
        function(err, results){
            if(err){
                return cb(err);
            }
            cb(null, results || []);
        }
    );
};

exp.getAllChannelIds = function(){
    return _.map(_.keys(channelById), function(num){return parseInt(num)});
};