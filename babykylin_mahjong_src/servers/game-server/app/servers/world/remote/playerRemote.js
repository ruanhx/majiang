/**
 * Created by kilua on 2015-05-12.
 */

var util = require('util');

var logger = require('pomelo-logger').getLogger(__filename);

var Code = require('../../../../shared/code'),
    async = require('async')
    orderLogger = require('pomelo-logger').getLogger('order-log', __filename),
    manager = require('../../../domain/world/playerManager'),
    playerMiniData = require('../../../domain/world/playerMiniData'),
    orderCacheDao = require('../../../dao/orderCacheDao');
var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

pro.add = function (args, cb) {
    var self = this,
        app = self.app,
        playerManager = manager.get();

    if (!playerManager.add({
            id: args.id, frontendId: args.frontendId, sessionId: args.sessionId, areaName: args.areaName,
            username: args.username
        })) {
        return cb(null, Code.WORLD.ALREADY_ONLINE);
    }
    // 延迟通知处理orderCache
    // function processOrderCache(){
    //     orderCacheDao.getByUid(app.get('dbclient'), args.username, function(err, orderList){
    //         if(orderList.length <= 0){
    //             return;
    //         }
    //         async.mapSeries(orderList, function(orderRec, callback){
    //             var msg = orderRec.orderInfo;
    //             orderCacheDao.remove(app.get('dbclient'), orderRec.id, function(err, succss){
    //                 if(succss){
    //                     app.rpc.area.orderRemote.order.toServer(args.areaName, msg, args.uid, args.id, function(err, status, code){
    //                         if(err){
    //                             orderLogger.error('processOrderCache order rpc orderRemote err = %s, orderId = %s', err.stack, msg.orderId);
    //                             return callback(err.message);
    //                         }
    //                         return callback();
    //                     })
    //                 }else{
    //                     return callback(util.format('remove order cache failed!orderRec = %j', orderRec));
    //                 }
    //             });
    //         }, function(err, results){
    //             if(err){
    //                 orderLogger.error('processOrderCache err = %s', err);
    //             }
    //         });
    //     });
    // }
    // setTimeout(processOrderCache, 30 * 1000);

    logger.debug('add args = %j', args);
    return cb(null, Code.OK);
};

pro.remove = function (args, cb) {
    var playerManager = manager.get();
    if (playerManager) {
        playerManager.remove(args.playerId, args.frontendId, args.sessionId);
        logger.debug('remove playerId = %s', args.playerId);
        return cb(null, Code.OK);
    }

    return cb('playerManager not initialized');
};

pro.upDate = function (args,cb) {
    playerMiniData.getInstance().update(args);
    return cb(null, Code.OK);
};

pro.updatePower = function (args,cb) {
    playerMiniData.getInstance().updatePower(args);
    return cb(null, Code.OK);
};

pro.updateHeroId = function (args,cb) {
    playerMiniData.getInstance().updateHeroId(args);
    return cb(null, Code.OK);
};

pro.updatePlayerName = function (args,cb) {
    var result = playerMiniData.getInstance().checkAndUpdatePlayerName(args);
    if(result){
        return cb(null, Code.OK);
    }else {
        return cb(null, Code.FAIL);
    }
};

pro.getMiniData = function (args,cb) {
    var miniData = playerMiniData.getInstance().getPlayerById(args.playerId);
    var clientInfo;
    if(miniData){
        clientInfo = miniData.getClientInfo();
    }
    return cb(null, {Code:Code.OK,miniData:clientInfo});

};
// 获取系统推荐的好友
pro.getSysMiniData = function (args, cb) {
    var playerList = playerMiniData.getInstance().getSysRecommendPlayer(args.playerId,args.friendList);
    var res = [];
    var size = playerList.length>args.needNum ? args.needNum : playerList.length;
    var clone = playerList.slice(0,size);

    return cb(null, {Code: Code.OK, sysMiniData: clone});

};