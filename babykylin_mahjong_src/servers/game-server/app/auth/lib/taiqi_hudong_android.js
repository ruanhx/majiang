/**
 * Created by tony on 2016/12/22.
 */
var util = require('util');
var exp = module.exports = {};
var request = require('request');
var utils = require('../../util/utils'),
    config = require('../../../config/auth.json').taiqi_hudong_android,
    Code = require('../../../shared/code');

//opts：{uid: MAC, pwd: pwd, token: msg.token ,sdkLoginCbData:msg.sdkLoginCbData || {}}
exp.authCheck = function(opts, cb){
    var ext = opts.sdkLoginCbData;
    var isDebug = ext.isDebug;
    var qs = {
        userId : opts.uid,
        token:  opts.token,
        cpId :  config.cpId,
        appId :  config.appId,
        channelId :  ext.channelId,
        channelAction: ext.channelAction,
        extInfo: ext.extInfo
    };

    var url = util.format(config.urlRelease, ext.channelAction );
    //if(isDebug){
    //    url = util.format(config.urlDebug, ext.channelAction );
    //}
    var options = {
        uri: url,
        method:config.method,
        qs: qs
    };
    //   method: config.method,
    request(options, function (err, res, body) {
        if (err) {
            console.log('authCheck failed!err = %s', err.stack);
            utils.invokeCallback(cb, err.message, {result: false, code: Code.FAIL});
            return;
        }
        if (res.statusCode !== 200) {
            console.log('authCheck failed!code = %s', res.statusCode);
            utils.invokeCallback(cb, 'statusCode error', {
                result: false,
                code: (body.message === 500) ? Code.DB_ERROR : Code.CONNECTOR.FA_PWD_ERROR
            });
            return;
        }
        console.log(body);
        // 解析 body
        try{
            body = JSON.parse(body);
            if(body.respCode != 200){
                console.debug('body respCode=%s',body.respCode);
                return;
            }

            //这个是平台回调的数据
            var userId = util.format( '%s%s',config.prefix,opts.uid);//body.userId);
            utils.invokeCallback(cb, null, {result: true, code: Code.OK, uid: userId});
        }catch(ex){
            return;
        }
    });
};