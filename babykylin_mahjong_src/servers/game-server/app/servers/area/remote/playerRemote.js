/**
 * Created by employee11 on 2015/12/24.
 */

var logger = require('pomelo-logger').getLogger(__filename);
var area = require('../../../domain/area/area');
var Code = require('../../../../shared/code');
var utils = require('../../../util/utils');

var Handler = function(app){
    this.app = app;
};

module.exports = function(app){
    return new Handler(app);
};

var pro = Handler.prototype;

pro.playerLeave = function(args,cb){
    var player = area.getPlayer(args.playerId);

    if(player && player.frontendId === args.frontendId && player.sessionId === args.sessionId){
        area.removePlayer(args.playerId);
        logger.debug('playerLeave ok!playerId = %s', args.playerId);
    }
    utils.invokeCallback(cb);
};

pro.getPlayerEndlessBuff = function (args,cb) {
    var player = area.getPlayer(args.playerId);
    if(player){
        utils.invokeCallback(cb,null,player.effectBuffIds);
    }else {
        utils.invokeCallback(cb,null,null);
    }
};

pro.playerRemove = function (args,cb) {
    var player = area.getPlayer(args.playerId);
    if (player){
        player.flush(cb);
    }
    utils.invokeCallback(cb);
};

pro.progressMission = function (args,cb) {
    var player = area.getPlayer(args.playerId);
    if (!player){
        cb(Code.FAIL);
        return;
    }
    player.missionMgr.progressUpdate(args.type,args.valueType,args.progress,args.paramerter);
    utils.invokeCallback(cb);
};