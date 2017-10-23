/**
 * Created by kilua on 2015-05-12.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo');

var messageService = require('../messageService'),
    utils = require('../../util/utils');

var Player = function (opts) {
    this.id = opts.id;
    this.frontendId = opts.frontendId;
    this.sessionId = opts.sessionId;
    this.areaName = opts.areaName;
    this.username = opts.username;
};

var pro = Player.prototype;

pro.pushMsgToClient = function (route, msg) {
    if (this.frontendId) {
        messageService.pushMessageToPlayer({uid: this.id, sid: this.frontendId}, route, msg);
    }
};

//设置无尽双人配对
pro.setMatchPair = function (pair) {
    this.endlessPair = pair;
};
//单人
pro.setSinglePvp = function(pair){
  this.singlePair = pair ;
};

pro.updateLoadingPercent = function (percent) {
    if (!this.endlessPair) {
    return false;
}
this.endlessPair.updateLoadingPercent(this.id, percent);
return true;
};
/*
 *   下线处理
 * */
pro.leave = function (shutdownSignal, cb) {
    logger.debug('leave playerId = %s, shutdownSignal = %s', this.id, shutdownSignal);
    if (this.endlessPair) {
        var matchPlayer = this.endlessPair.getPlayerById(this.id);
        if (matchPlayer) {
            matchPlayer.leave();
        }
    }
    if(this.singlePair)
    {
        var singlePlayer = this.singlePair.getPlayerById(this.id);
        if (singlePlayer) {
            singlePlayer.leave();
        }
    }
    utils.invokeCallback(cb);
};

/*
 *   调用area的方法
 * */
pro.areaRpc = function (remote, method, args, cb) {
    if (args && !args.playerId) {
        args.playerId = this.id;
    }
    pomelo.app.rpc.area[remote][method].toServer(this.areaName, args, cb);
};

module.exports = Player;