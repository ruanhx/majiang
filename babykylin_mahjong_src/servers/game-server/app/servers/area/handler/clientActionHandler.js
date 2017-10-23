/**
 * Created by kilua on 2016/5/17 0017.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    dataApi = require('../../../util/dataApi'),
    dropUtils = require('../../../domain/area/dropUtils'),
    clientActionLogDao = require('../../../dao/clientActionLogDao');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

/*
 *  引导完成，领取奖励
 * */
pro.record = function (msg, session, next) {
    // var player = area.getPlayer(session.get('playerId'));
    clientActionLogDao.write(session.get('playerId'),msg.type,msg.msg);
    next(null, {code: Code.OK});
};