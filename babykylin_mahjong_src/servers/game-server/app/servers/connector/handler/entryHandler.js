/**
 * Created by lishaoshen on 2015/09/26.
 */
var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore'),
    async = require('async');
var userWhiteIPs = require('../../../../config/userWhiteIPs');
var Code = require('../../../../shared/code'),
    playerDao = require('../../../dao/playerDao'),
    auth = require('../../../auth'),

    area = require('../../../domain/area/area'),
    report = require('../../../util/stateReport');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

Handler.prototype.entry = function (msg, session, next) {
    //logger.debug('entryHandler.entry : %s ',msg);
    var MAC = msg.MAC, pwd = msg.password, app = this.app, platform = msg.platform || 'default';
    var deviceId = msg.deviceId||'123456';
    // 服务器白名单
    var addressIp = session.__session__.__socket__.remoteAddress.ip.split("::ffff:");
    var ip = 0;
    if (addressIp.length>1){
        ip = addressIp[1];
    }
    if(userWhiteIPs.length > 0 && !_.contains(userWhiteIPs,ip)){
        logger.warn('ip = %s is rejected by user whiteIPs',ip);//玩家ip白名单阻拦
        next(null, {code: Code.CONNECTOR.NOTWHITEIP});
        return;
    }

    session.on('closed', onUserLeave.bind(null, app));
    session.set('platform',platform);
    async.waterfall([
        function (cb) {
            // auth MAC
        //     auth.authCheck(platform, {uid: MAC, pwd: pwd, token: msg.token ,sdkLoginCbData:msg.sdkLoginCbData || {}}, cb);
        // }, function (res, cb) {
        //     if (!res.result) {
        //         return cb(new Error('auth fail'), res.code);
        //     }
            session.set('MAC', msg.MAC);
            session.set('rawUid', MAC);
            session.set('deviceId', deviceId);
            session.pushAll();
            playerDao.getPlayersByUid(msg.MAC, cb);
        }, function (player, cb) {
            if (!player) {
                // 抛出异常，以终止流水线，直接调用最终回调
                logger.error("###");
                return cb(new Error('player not exists'), Code.CONNECTOR.FA_PLAYER_NOT_EXIST);
            }
            report.pushUserInfo(session.get('rawUid'));
            app.set('onlineCnt', app.get('onlineCnt') + 1);
            session.set('playerName',player.playername);
            // report.pushUserInfo(MAC,player.playerLevel,"server1");
            session.bind(player.id, function (err) {
                cb(err, player);
            });
        }, function (player, cb) {
            session.set('playerId', player.id);
			// session.set('areaId', player.areaId);

            session.pushAll(cb);
        }
    ], function (err, code) {
        if (err) {
            logger.info('entry err = %j', err);
            next(null, {code: code});
            if (code !== Code.CONNECTOR.FA_PLAYER_NOT_EXIST) {
                // 无角色时，须等待客户端创角角色，不踢
                app.get('sessionService').kickBySessionId(session.id, null);
            }
        } else {
            next(null, {code: Code.OK,account:msg.account,
                userid:session.get('playerId'),
                name:session.set('playerName'),
                lv:1,
                // exp:0,
                // coins:100,
                gems:100,
                ip:"127.0.0.1",
                sex:1});
        }
    });
};

var onUserLeave = function (app, session) {
    if (!session || !session.uid) {
        return;
    }
    app.set('onlineCnt', app.get('onlineCnt') - 1);
    var addressIp = session.__session__.__socket__.remoteAddress.ip.split("::ffff:");
    var ip = 0;
    if (addressIp.length>1){
        ip = addressIp[1];
    }
    var playerId = session.get('playerId');
    var rawUid = session.get('rawUid'),
        deviceId = session.get('deviceId'),
        platform = session.get('platform'),
        playerName = session.get('playerName');
    // if (!!playerId) {
    //     app.rpc.area.playerRemote.playerLeave(session, {
    //         playerId: playerId, sessionId: session.id,
    //         frontendId: session.frontendId
    //     }, function (err) {
    //         if (!!err) {
    //             logger.error('onPlayerLeave error %s', err.stack);
    //         }
    //         app.rpc.world.playerRemote.remove(session, {
    //             playerId: playerId, frontendId: session.frontendId,
    //             sessionId: session.id
    //         }, function (err, code) {
    //             if (!!err) {
    //                 logger.error('onUserLeave leave world error %s', err.stack);
    //             } else {
    //                 if (code === Code.OK) {
    //                     logger.info('onUserLeave leave world ok!');
    //                     report.SCADA("writeLoginReg",{accountId:rawUid,deviceNum:deviceId,channelId:platform,addIp:ip,addtime:Date.now(),type:2,roleId:playerId,roleNickName:playerName,roleLevel:1},function(){});
    //                 } else {
    //                     logger.debug('onUserLeave leave world code = %s', code);
    //                 }
    //             }
    //         });
    //         app.rpc.chat.chatRemote.leave(session, session.id, session.frontendId, function(){});
    //     });
    // }
    app.get('sessionService').kickBySessionId(session.id, null);
};
