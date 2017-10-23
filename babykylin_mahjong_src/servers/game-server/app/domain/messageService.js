var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');


var exp = module.exports;

exp.pushMessageByUids = function (uids, route, msg) {
    pomelo.app.get('channelService').pushMessageByUids(route, msg, uids, function (err, fails) {
        if (err) {
            logger.error('Push Message uids = %j, route = %s, msg = %j, error = %s', uids, route, msg, err.stack);
        }
    });
};

exp.pushMessageToPlayer = function (uid, route, msg) {
    exp.pushMessageByUids([uid], route, msg);
};

/*
 *   注册玩家，方便以后push消息给指定玩家
 * */
var playerById = {};
exp.register = function (uid, playerId, frontendId) {
    playerById[playerId] = {uid: uid, sid: frontendId};
    return true;
};

exp.remove = function (playerId) {
    if (playerById[playerId]) {
        delete playerById[playerId];
        return true;
    }
    return false;
};

exp.pushMsgToPlayerById = function (playerId, route, msg) {
    var rec = playerById[playerId];
    if (!rec) {
        console.warn('pushMsgToPlayerById playerId = %s not found!', playerId);
        return false;
    }
    if (msg && !msg.route) {
        msg.route = route;
    }
    if (msg) {
        exp.pushMessageByUids([rec], route, msg);
    }
};

exp.broadcast = function (route, msg) {
    if (msg && !msg.route) {
        msg.route = route;
    }
    if (msg && _.size(playerById) > 0) {
        exp.pushMessageByUids(_.values(playerById), route, msg);
    }
};
