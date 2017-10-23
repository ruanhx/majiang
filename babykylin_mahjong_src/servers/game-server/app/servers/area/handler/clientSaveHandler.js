/**
 * Created by kilua on 2016/5/17 0017.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    clientSaveDao = require('../../../dao/clientSaveDao');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

/*
 *   保存数据
 * */
pro.save = function (msg, session, next) {
    // logger.debug('save playerId = %s, saveData = %j', session.get('playerId'), msg.saveData);
    var player = area.getPlayer(session.get('playerId'));
    player.setClientSaveData(msg.saveData);
    return next(null, {code: Code.OK});
};

/*
 *   读取数据
 * */
pro.load = function (msg, session, next) {
    // logger.debug('load playerId = %s', session.get('playerId'));
    var player = area.getPlayer(session.get('playerId'));
    return next(null, {code: Code.OK, saveData: player.clientSaveData});
};