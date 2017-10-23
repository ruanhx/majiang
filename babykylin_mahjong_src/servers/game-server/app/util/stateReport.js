/**
 * Created by employee11 on 2015/12/7.
 */

var util = require('util');

var request = require('request');

var config = require('../../config/stateReport.json');

var stateReport = module.exports;

stateReport.pushUserInfo = function(MAC){
    var options = {
        uri: util.format('http://%s:%s/pushUserInfo', config.host, config.port),
        method: 'POST',
        json: {
            "MAC": MAC,
            "serverName": config.alias
        }
    };
    request(options, function (err, res) {
        if(err){
            console.log('pushUserInfo failed! err = %s', err.stack);
        }else{
            if(res.statusCode !== 200){
                console.log('pushUserInfo failed! code = %s', res.statusCode);
            }else{
                console.log('pushUserInfo ok!');
            }
        }
    });
};

stateReport.gainAward = function(MAC,cb){
    var options = {
        uri: util.format('http://%s:%s/gainAward', config.host, config.port),
        method: 'POST',
        json: {
            "MAC": MAC
        }
    };
    request(options, function (err, res) {
        if(err){
            console.log('gainAward failed! err = %s', err.stack);
        }else{
            console.log('gainAward ! res = %j', res);
            if(res.statusCode !== 200){
                console.log('gainAward failed! code = %s', res.statusCode);
            }else{
                console.log('gainAward ok!');
                cb(null,res);
            }
        }
    });
};

stateReport.SCADA = function(action,record,cb){
    var options = {
        uri: util.format('http://%s:%s/SCADA', config.host, config.port),
        method: 'POST',
        json: {
            "action":action,
            "record": record
        }
    };
    request(options, function (err, res) {
        if(err){
            console.log('SCADA failed! err = %s', err.stack);
        }else{
            console.log('SCADA ! res = %j', res);
            if(res.code !== 200){
                console.log('SCADA failed! code = %s', res.code);
            }else{
                console.log('SCADA ok!');
                cb(null,res);
            }
        }
    });
};