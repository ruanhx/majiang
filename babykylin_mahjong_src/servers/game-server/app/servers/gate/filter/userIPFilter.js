/**
 * Created by rhx on 2017/8/4.
 */
var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var userWhiteIPs = require('../../../../config/userWhiteIPs');//["12.12.12.12","22.22.22.22"]

var Filter = function (app) {
    this.app = app;
};

var pro = Filter.prototype;

pro.before = function (msg, session, next) {
    var address = this.app.get('sessionService').getClientAddressBySessionId(session.id);
    logger.error("###%s",address);
    if(userWhiteIPs.length > 0 && !_.contains(userWhiteIPs,session.__session__.__socket__.remoteAddress.ip)){
        logger.warn('ip = %s is rejected by user whiteIPs',session.__session__.__socket__.remoteAddress.ip);//玩家ip白名单阻拦
        next(new Error('rejected by user whiteIPs'));
    }
    next();
};

module.exports = function (app) {
    return new Filter(app);
};