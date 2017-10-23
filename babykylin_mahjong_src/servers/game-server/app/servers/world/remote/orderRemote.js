/**
 * Created by kilua on 2015-06-26.
 */

var orderLogger = require('pomelo-logger').getLogger('order-log', __filename);

var SHARE = require('../../../../../serverManager/share'),
    manager = require('../../../domain/world/playerManager'),
    orderCacheDao = require('../../../dao/orderCacheDao');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

function sign(){

}

pro.order = function(msg, cb){

   // msg = {"orderId":"1","uid":"123456","serverId":"10000","time":"11111","sign":"abc"}
    orderLogger.debug('world.remote.orderRemote.order: msg = %j', msg);
    var app = this.app,
        playerManager = manager.get(),
        player,
        dbClient = app.get('dbclient');
    if(!playerManager){
        orderLogger.debug('playerManager is null');
        return orderCacheDao.cache(dbClient, msg.uid, msg, function(err, success){
            if(success){
                return cb(null, SHARE.STATUS.SUCCESS);
            }else{
                return cb(null, SHARE.STATUS.FAILURE, SHARE.CODE.OTHER_ERROR);
            }
        });
        //return cb(null, SHARE.STATUS.FAILURE, SHARE.CODE.OTHER_ERROR);
    }
    orderLogger.debug('playerManager  uid : %s ',msg.uid);
    // 检查目标玩家是否在线
    player = playerManager.getPlayerByUserName(msg.uid);　
    if(!player){
        orderLogger.debug('player no online');
        return orderCacheDao.cache(dbClient, msg.uid, msg, function(err, success){
            if(success){
                return cb(null, SHARE.STATUS.SUCCESS);
            }else{
                return cb(null, SHARE.STATUS.FAILURE, SHARE.CODE.OTHER_ERROR);
            }
        });
        //// 玩家不在线或不存在
        //return cb(null, SHARE.STATUS.FAILURE, SHARE.CODE.USER_NOT_EXIST);
    }
    orderLogger.debug('player online');
    app.rpc.area.orderRemote.order.toServer(player.areaName, msg, player.uid, player.id, function(err, status, code){
        if(err){
            orderLogger.error('order rpc orderRemote err = %s, orderId = %s', err.stack, msg.orderId);
            return cb(null, SHARE.STATUS.EXCEPTION, SHARE.CODE.OTHER_ERROR);
        }
        return cb(null, status, code);
    });
};