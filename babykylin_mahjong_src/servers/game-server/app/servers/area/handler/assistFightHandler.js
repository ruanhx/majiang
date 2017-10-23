/**
 * Created by rhx on 2016/7/17 0017.
 */

var pomelo = require('pomelo'),
    async = require('async'),
    logger = require('pomelo-logger').getLogger(__filename);


var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts'),
    friendsDao = require('../../../dao/friendsDao'),
    dropUtils = require('../../../domain/area/dropUtils'),
    dataApi = require('../../../util/dataApi');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

// 获取玩家的所有助战列表
pro.getAllAssistList = function (msg, session, next) {
    var playerId = session.get('playerId');
    var player = area.getPlayer(playerId);
    var friendList = [];
    async.waterfall([
        // 玩家好友列表
        function (callback) {
            pomelo.app.rpc.world.friendsRemote.getFriendIdList(session,playerId,function (err,result) {
                var assistFightList = [];
                async.mapSeries(result, function (friendId, cb) {
                    friendList.push(friendId);
                    var rec = player.assistFightMgr.getAssistRecord(friendId);
                    var clientInfo = rec.getClientInfo();
                    pomelo.app.rpc.world.playerRemote.getMiniData(session, {playerId: friendId}, function (err, res) {
                        if (res.miniData) {
                            clientInfo.playername = res.miniData.playername;
                            clientInfo.headPicId = res.miniData.headPicId;
                            clientInfo.heroId = res.miniData.heroId;
                            clientInfo.highPower = res.miniData.highPower;
                        } else {
                            clientInfo.playername = "";
                            clientInfo.headPicId = 0;
                            clientInfo.heroId = 0;
                            clientInfo.highPower = 0;
                        }
                        cb(null, clientInfo);
                    });
                }, function (err, results) {
                    // return next(null, {code: Code.OK, assistList: results});
                    callback(null, results);
                });
            });
        },
        // 系统推荐好友列表
        function (arg, callback) {
            if (arg.length >= dataUtils.getOptionValue("FriendMax", 30)) {
                callback(null, arg);
            } else {
                var needNum = dataUtils.getOptionValue("FriendMax", 30) - arg.length;
                needNum = needNum > 5 ? 5 : needNum;
                pomelo.app.rpc.world.playerRemote.getSysMiniData(session, {
                    needNum: needNum,
                    playerId: playerId,
                    friendList: friendList
                }, function (err, res) {
                    if (err){
                        logger.error("world.playerRemote.getSysMiniData error");

                    }
                    res.sysMiniData.forEach(function (data) {
                        var rec = player.assistFightMgr.getAssistRecord(data.playerId);
                        data.price = rec.getPrice();
                    });
                    callback(null,{friendAssistList:arg,sysAssistList:res.sysMiniData});
                });
            }
        }
    ], function (err, ret) {
        if (err){
            logger.error("getAllAssistList error :%s",err);
        }
        var sysDataAssistList = dataApi.SysAssistFight.getAllAssistList();
        sysDataAssistList.forEach(function (data) {
            var rec = player.assistFightMgr.getAssistRecord(data.playerId);
            data.price = rec.getPrice();
            // ret.sysAssistList.push(data);
        });
        var assistAddFriendDrewCnt = player.friendPersonMgr.getAgreeCnt();
        return next(null, {code: Code.OK, friendAssistList:ret.friendAssistList,sysAssistList:ret.sysAssistList,dataAssistList:sysDataAssistList,assistAddFriendDrewCnt:assistAddFriendDrewCnt});
    });

};