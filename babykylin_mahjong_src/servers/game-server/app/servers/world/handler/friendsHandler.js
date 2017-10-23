/**
 * Created by kilua on 2016/7/4 0004.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var Code = require('../../../../shared/code'),
    dataUtils = require('../../../util/dataUtils'),
    Consts = require('../../../consts/consts'),
    dataApi = require('../../../util/dataApi'),
    friendsMgr = require('../../../domain/world/friendsMgr').get(),
    playerManager = require('../../../domain/world/playerManager'),
    playerMiniData = require('../../../domain/world/playerMiniData'),
    playerDao = require('../../../dao/playerDao'),
    friendsDao = require('../../../dao/friendsDao'),
    dropUtils = require('../../../domain/area/dropUtils');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

/*
 *
 * */
// pro.getInfoList = function (msg, session, next) {
//     var player = playerManager.get().getPlayer(session.get('playerId'));
//     friendsMgr.getInfoList(player ,msg.type ,function(infoList){
//         next(null,{code:Code.OK,infoList:infoList});
//     });
// };
//
// /*
//  *
//  * */
// pro.sendRequest = function (msg, session, next) {
//     var player = playerManager.get().getPlayer(session.get('playerId'));
//     friendsMgr.sendRequest(player.id,msg.playerId,function(code){
//         if(code == Code.OK){
//             playerManager.get().pushMsgToPlayer(msg.playerId,"friends.new",{type:Consts.FRIEND_TYPE.REQUEST});
//         }
//         player.areaRpc("friendsRemote","removeRecommend",{playerId:player.id,friendId:msg.playerId},function(){});
//         next(null,{code:code});
//     });
// };
//
// /*
//  *
//  * */
// pro.refuseRequest = function (msg, session, next) {
//     var player = playerManager.get().getPlayer(session.get('playerId'));
//     friendsMgr.refuseRequest(player.id,msg.playerId,function(code){
//         next(null,{code:code});
//     });
// };
//
// function getAssistFightInfo(playerMiniData) {
//     var clientInfo = {};
//     clientInfo.playername = playerMiniData.playername;
//     clientInfo.headPicId = playerMiniData.headPicId;
//     clientInfo.heroId = playerMiniData.heroId;
//     clientInfo.highPower = playerMiniData.highPower;
//     clientInfo.price = 0;
//     clientInfo.playerId = playerMiniData.playerId;
//     return clientInfo;
// };
//
// /*
//  *
//  * */
// pro.agreeRequest = function (msg, session, next) {
//     var player = playerManager.get().getPlayer(session.get('playerId'));
//     friendsMgr.agreeRequest(player.id,msg.playerId,function(code){
//         if(code == Code.OK){
//             playerManager.get().pushMsgToPlayer(player.id,"friends.new",{type:Consts.FRIEND_TYPE.FRIEND});
//             playerManager.get().pushMsgToPlayer(msg.playerId,"friends.new",{type:Consts.FRIEND_TYPE.FRIEND});
//             friendsDao.getCountByPlayerId(player.id,Consts.FRIEND_TYPE.FRIEND,function(err,count){
//                 if(!err){
//                     player.areaRpc("friendsRemote","addFriend",{playerId:player.id,friendCnt:count},function(){});
//                 }
//             });
//             // 发送助战信息
//             var me = playerMiniData.getInstance().getPlayerById(player.id);
//             var meClintInfo = getAssistFightInfo(me);
//
//             var friend = playerMiniData.getInstance().getPlayerById(msg.playerId);
//             var friendClintInfo = getAssistFightInfo(friend);
//             playerManager.get().pushMsgToPlayer(player.id,"assistFight.push",{info:friendClintInfo});
//             playerManager.get().pushMsgToPlayer(msg.playerId,"assistFight.push",{info:meClintInfo});
//         }
//         next(null,{code:code});
//     });
// };
//
// /*
//  *
//  * */
// pro.removeFriend = function (msg, session, next) {
//     var player = playerManager.get().getPlayer(session.get('playerId'));
//     player.areaRpc("friendsRemote","getFriendRemoveCnt",{playerId:player.id},function(cnt){
//         friendsMgr.removeFriend(player.id,msg.playerId,cnt,function(code){
//             if(code == Code.OK){
//                 //playerManager.get().pushMsgToPlayer(player.id,"friends.new",{type:Consts.FRIEND_TYPE.FRIEND});
//                 //playerManager.get().pushMsgToPlayer(msg.playerId,"friends.new",{type:Consts.FRIEND_TYPE.FRIEND});
//                 player.areaRpc("friendsRemote","setFriendRemoveCnt",{cnt:cnt+1},function(){
//
//                 });
//             }
//             next(null,{code:code});
//         });
//     });
// };
//
// /*
//  *
//  * */
// pro.addBadFriend = function (msg, session, next) {
//     var player = playerManager.get().getPlayer(session.get('playerId'));
//     friendsMgr.addBadFriend(player.id,msg.playerId,function(code){
//         next(null,{code:code});
//     });
// };
//
// /*
//  *
//  * */
// pro.removeBadFriend = function (msg, session, next) {
//     var player = playerManager.get().getPlayer(session.get('playerId'));
//     friendsMgr.removeBadFriend(player.id,msg.playerId,function(code){
//         next(null,{code:code});
//     });
// };
//
// /*
//  *
//  * */
// pro.sendEnergy = function (msg, session, next) {
//     var player = playerManager.get().getPlayer(session.get('playerId'));
//     friendsMgr.sendEnergy(player.id,msg.playerIds,function(code){
//         _.each(msg.playerIds,function (pid) {
//             playerManager.get().pushMsgToPlayer(pid,"friends.new",{type:Consts.FRIEND_TYPE.FRIEND});
//         });
//         next(null,{code:code});
//     });
// };
//
// /*
//  *
//  * */
// pro.acceptEnergy = function (msg, session, next) {
//     var player = playerManager.get().getPlayer(session.get('playerId'));
//     friendsMgr.acceptEnergy(player.id,msg.playerIds,function(cnt){
//         if(cnt>0){
//             var receiveEnergy = dataUtils.getOptionValue("ReceivingEnergy",5)*cnt;
//             player.areaRpc("friendsRemote","addEnergy",{playerId:player.id,energy:receiveEnergy},function () {
//                 logger.debug("体力收取成功");
//             });
//             next(null,{code:Code.OK});
//         }else{
//             logger.debug("体力收取失败");
//             next(null,{code:Code.FAIL});
//
//         }
//     });
// };
//
//
// pro.findFriend = function (msg, session, next) {
//     playerDao.getPlayerByName(msg.name,function(err,player){
//         if(player){
//             next(null,{code:Code.OK,playerId:player.id});
//         }else{
//             next(null,{code:Code.FAIL});
//         }
//     });
// };

