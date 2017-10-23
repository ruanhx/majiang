/**
 * Created by tony on 2016/12/22.
 */
var util = require('util');
var exp = module.exports = {};
var request = require('request');
var utils = require('../../util/utils'),
    config = require('../../../config/auth.json').taiqi_guonei_ios,
    Code = require('../../../shared/code');


exp.authCheck = function(opts, cb){
    var ext = opts.sdkLoginCbData;
    var qs = {
        userId : ext.userId,
        token:  ext.token,
        cpId :  ext.cpId,
        appId :  ext.appId,
        channelId :  ext.channelId,
        channelAction: ext.channelAction,
        extInfo: ext.extInfo
    };

    var url = util.format(config.url, ext.channelAction );
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
        console.log('authCheck success body =%s,res = %s ', JSON.stringify(body),JSON.stringify(res));
        //这个是平台回调的数据
        var userId = util.format( '%s%s',config.prefix,ext.userId);
        utils.invokeCallback(cb, null, {result: true, code: Code.OK, uid: userId});
    });
};