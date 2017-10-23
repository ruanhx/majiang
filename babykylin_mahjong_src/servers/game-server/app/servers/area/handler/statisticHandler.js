/**
 * Created by tony on 2016/10/14.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    dataApi = require('../../../util/dataApi'),
    dropUtils = require('../../../domain/area/dropUtils'),
    Consts = require('../../../consts/consts');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

/*
 *   玩家行为
 * */
pro.playerBehavior = function (msg, session, next) {
    var playerId = session.get('playerId');
    logger.debug('getList playerId = %s', playerId);
    var player = area.getPlayer(playerId);
    var heroLv = player.getFightHeroLv();
    var time = Date.now();
    var id = msg.id;
    var parameter1 = msg.parameter1;
    player.dataStatisticManager.refreshPlayerBehavior(playerId,heroLv,time,id,parameter1);
    return next(null, {code: Code.OK});
};