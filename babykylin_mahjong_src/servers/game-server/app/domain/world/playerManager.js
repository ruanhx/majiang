/**
 * Created by kilua on 2015-05-12.
 */

var pomelo = require('pomelo'),
    async = require('async'),
    _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename);

var Player = require('./player'),
    endlessReport = require('./endlessReport'),
    messageService = require('../messageService');

var PlayerManager = function () {
    this.playersById = {};
    //this.playersByUid = {};
    this.playersByUserName = {};
};

var pro = PlayerManager.prototype;

pro.updatePlayer = function (playerData) {
    var player = this.playersById[playerData.id];
    if (player) {
        player.frontendId = playerData.frontendId;
        player.sessionId = playerData.sessionId;
        player.areaName = playerData.areaName;
        // 覆盖更新
        messageService.register(player.id, player.id, player.frontendId);
        return true;
    }
    return false;
};

pro.add = function (playerData) {
    if (this.playersById[playerData.id]) {
        // 由于允许顶号，这里需要允许替换
        return this.updatePlayer(playerData);
    }
    var player = new Player({
        id: playerData.id, frontendId: playerData.frontendId, sessionId: playerData.sessionId,
        areaName: playerData.areaName, username: playerData.username
    });
    this.playersById[player.id] = player;
    this.playersByUserName[player.username] = player;
    messageService.register(player.id, player.id, player.frontendId);
    return true;
};

pro.remove = function (playerId, frontendId, sessionId) {
    var player = this.playersById[playerId];
    if (player && player.frontendId === frontendId && player.sessionId === sessionId) {
        player.leave(false);
        delete this.playersById[playerId];
        delete this.playersByUserName[player.username];
        messageService.remove(playerId);
        endlessReport.get().playerOut(playerId);
        return true;
    }
    return false;
};

pro.getPlayer = function (playerId) {
    return this.playersById[playerId];
};

pro.getPlayerByUserName = function (username) {
    console.log("username : %s , this.playersByUserName %j",username,JSON.stringify(this.playersByUserName));
    return this.playersByUserName[username];
};

pro.broadcast = function (route, msg) {
    messageService.broadcast(route, msg);
};
// 跑马灯推送
pro.rollingMessage = function (msg) {
    messageService.broadcast('rollingInformation.push', msg);
};

pro.pushMsgToPlayer = function (playerId, route, msg) {
    if (!this.getPlayer(playerId)) {
        return false;
    }
    return messageService.pushMsgToPlayerById(playerId, route, msg);
};

/*
*   关服
* */
pro.beforeShutdown = function(app,cb){
    var self =this;
    async.each(_.values(self.playersById),
        function(player, callback){
        player.leave(true, function () {
            app.rpc.area.playerRemote.playerRemove("*",{playerId:player.id},callback);
        });
        },

        function(err){
        if(err){
            logger.info('beforeShutdown error!');
        }else{
            logger.info('beforeShutdown ok!');
        }
        cb(err);
    })
};

var g_Manager;
module.exports.get = function () {
    if (!g_Manager) {
        g_Manager = new PlayerManager();
    }
    return g_Manager;
};