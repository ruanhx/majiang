/**
 * Created by kilua on 2015-06-11.
 */

var util = require('util');

var request = require('request');

var exp = module.exports = {};

var config = require('../../../../config/sn.json');

function getModuleName(){
    var path = require('path');
    return path.basename(__filename, path.extname(__filename));
}
/*
*   序列号查询接口
*   @param {String} sn      序列号字符串
*   @param {Callback}   cb  回调函数，function cb(err, code, type, awardId){}
* */
exp.query = function(sn, cb){
    // 检查配置
    var curConfig = config[getModuleName()];
    if(!curConfig){
        return cb(new Error(util.format('no config for %s found!', getModuleName())));
    }
    if(!curConfig.enable){
        return cb(new Error(util.format('module %s disabled!', getModuleName())));
    }

    var options = {
        uri: curConfig.uri + sn,
        method: 'GET'
    };
    request(options, function (error, response, body) {
        if(error){
            return cb(error);
        }
        if(response.statusCode !== 200){
            return cb(new Error(util.format('http error %s', response.statusCode)));
        }
        body = JSON.parse(body);
        if(body.code !== curConfig.code.ok){
            return cb(null, body.code);
        }
        return cb(null, body.code, body.type, body.awardId);
    });
};