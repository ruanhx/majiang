/**
 * 段位管理器
 * Created by LUJIAQUAN on 2017/6/8 0005.
 */

var util = require('util');
var pomelo = require('pomelo')
var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var dataUtils = require('../../util/dataUtils'),
    Consts = require('../../consts/consts'),
    dataApi = require('../../util/dataApi'),
    playerManager = require('./playerManager').get(),
    EventEmitter = require('events').EventEmitter,
    scoreRankingList = require('./scoreRankingList'),
    Code = require('../../../shared/code'),
    async = require('async'),
    mailRemote = require('../../servers/world/remote/mailRemote'),
    playerMiniData = require("./playerMiniData"),
    ai = require("./ai");
var friendsDao = require('../../dao/friendsDao');


// 注册存储事件
var registerEvents = function (event) {
    event.on("save", function (playerId) {
        var data = {
            playerId:playerId,
            friends:JSON.stringify(event.friendMap[playerId]["friends"]),
            requests:JSON.stringify(event.friendMap[playerId]["requests"]),
            receiveEnergy:JSON.stringify(event.friendMap[playerId]["receiveEnergy"]),
            blackList:JSON.stringify(event.friendMap[playerId]["blackList"])
        }
        // rpc调用存储数据 TODO: 多服务器的分发
        logger.debug("FriendMgr 事件提交！");
        pomelo.app.rpc.area.friendsRemote.savePlayer('area-server-1', data, function() {
        });
    });
};
var FriendMgr = function () {
    EventEmitter.call(this);
    registerEvents(this);
}
util.inherits(FriendMgr, EventEmitter);
var pro = FriendMgr.prototype;


var instance;
module.exports.get = function () {
    if (!instance) {
        instance = new FriendMgr();
    }
    return instance;
};

/**
 * 开服加载好友表
 */
pro.loadFriend = function () {
    var self = this;
    self.friendMap = {};//好友表
    friendsDao.loadAllFriend(function (err, records) {
        if (!err) {
            _.each(records, function (rd) {
                if (!self.friendMap[rd.playerId]) {
                    self.friendMap[rd.playerId] = {};
                }

                self.friendMap[rd.playerId]["friends"] = JSON.parse(rd.friends)||[];
                self.friendMap[rd.playerId]["requests"] = JSON.parse(rd.requests)||[];
                self.friendMap[rd.playerId]["receiveEnergy"] = JSON.parse(rd.receiveEnergy)||[];
                self.friendMap[rd.playerId]["blackList"] = JSON.parse(rd.blackList)||[];
            });
        }
    });
}

pro.makeRecord = function(playerId){
    var self = this;
    if(self.friendMap[playerId]) return;//记录存在
    self.friendMap[playerId] = {};
    self.friendMap[playerId]["friends"] = [];
    self.friendMap[playerId]["requests"] = [];
    self.friendMap[playerId]["receiveEnergy"] = [];
    self.friendMap[playerId]["blackList"] = [];
}

/**
 * 添加黑名单
 * @param playerId
 * @param friendId
 * @param callBack
 */
pro.addBadFriend = function (playerId, friendId, callBack) {
    var self = this;
    if (playerId === friendId) {
        logger.error("addBadFriend  不能是自己");
        return callBack(Code.FAIL);
    }
    self.makeRecord(playerId);
    self.friendMap[playerId]["blackList"] = _.union(self.friendMap[playerId]["blackList"],[friendId]);
    self.emit("save",playerId);
    return callBack(Code.OK);
}

/**
 * 删除黑名单
 * @param playerId
 * @param friendId
 * @param callBack
 */
pro.removeBadFriend = function (playerId, friendId, callBack) {
    var self = this;
    if (!self.friendMap[playerId]) {
        return callBack(Code.FAIL);
    }
    if (!self.friendMap[playerId]["blackList"]) {
        return callBack(Code.FAIL);
    }
    var index = _.indexOf(self.friendMap[playerId]["blackList"], friendId);
    if (index === -1) {
        return callBack(Code.FAIL);
    }
    self.friendMap[playerId]["blackList"].splice(index, 1);
    self.emit("save",playerId);
    return callBack(Code.OK);
}

/**
 * 玩家是否在对方申请列表
 * @param playerId
 * @param friendId
 * @returns {number}
 */
pro.playerInFriendRequest = function(playerId, friendId){
    var self = this;
    if(!self.friendMap[friendId]) return 0;
    if (_.indexOf(self.friendMap[friendId]["requests"], playerId) !== -1) {
        return 1;
    }
    return 0;
}

/**
 * 发送好友请求
 * @param playerId
 * @param friendId
 * @param callBack
 */
pro.sendRequest = function (playerId, friendId, callBack) {
    var self = this;
    if (playerId === friendId) {
        logger.error("sendRequest 不能给本人发请求");
        return callBack({code:Code.FAIL});
    }
    //好友存不存在
    if(!playerMiniData.getInstance().getPlayerById(friendId)){
        return callBack({code:Code.WORLD.NO_PLAYER});
    }
    self.makeRecord(playerId);
    self.makeRecord(friendId);
    if (_.indexOf(self.friendMap[playerId]["friends"], friendId) !== -1) {
        return callBack({code:Code.WORLD.FRIEND_EXIT});
    }
    var sent = false;
    var index = _.indexOf(self.friendMap[friendId]["requests"],playerId);
    if(index!==-1){
        self.friendMap[friendId]["requests"].splice(index,1);//已经申请过的删除以前的记录
        sent = true;
    }
    self.friendMap[friendId]["requests"].push(playerId);
    if(self.friendMap[friendId]["requests"].length > dataUtils.getOptionValue("FriendMaxInvite",5)){
        self.friendMap[friendId]["requests"].splice(0,1);//超过最大值，删掉第一个
    }
    self.emit("save",friendId);
    return callBack({code:Code.OK,alreadySent:sent});
}

/**
 * 拒绝好友请求
 * @param playerId
 * @param friendId
 * @param callBack
 */
pro.refuseRequest = function (playerId, friendId, callBack) {
    var self = this;
    self.makeRecord(playerId);
    self.makeRecord(friendId);
    var index = _.indexOf(self.friendMap[playerId]["requests"],friendId);
    if(index === -1){
        return callBack(Code.FAIL);
    }
    self.friendMap[playerId]["requests"].splice(index,1);
    self.emit("save",playerId);
    return callBack(Code.OK);
}

/**
 * 同意好友请求
 * @param playerId
 * @param friendId
 * @param callBack
 */
pro.agreeRequest = function (playerId, friendId, callBack) {
    var self = this;
    self.makeRecord(playerId);
    self.makeRecord(friendId);
    var requestIndex = _.indexOf(self.friendMap[playerId]["requests"],friendId);
    var requestIndex2 = _.indexOf(self.friendMap[friendId]["requests"],playerId);
    var friendCnt = self.friendMap[playerId]["friends"].length;
    var friendCnt2 = self.friendMap[friendId]["friends"].length;
    if (friendCnt >= dataUtils.getOptionValue("FriendMax", 30) || friendCnt2 >= dataUtils.getOptionValue("FriendMax", 30)) {
        return callBack(Code.WORLD.FRIEND_MAX);
    }
    self.friendMap[playerId]["friends"] = _.union(self.friendMap[playerId]["friends"],[friendId]);
    self.friendMap[friendId]["friends"] = _.union(self.friendMap[friendId]["friends"],[playerId]);
    if(requestIndex!==-1){
        self.friendMap[playerId]["requests"].splice(requestIndex,1);
    }
    if(requestIndex2!==-1){
        self.friendMap[friendId]["requests"].splice(requestIndex2,1);
    }
    self.emit("save",playerId);
    self.emit("save",friendId);
    return callBack(Code.OK);
}

/**
 * 删除好友
 * @param playerId
 * @param friendId
 * @param callBack
 */
pro.removeFriend = function (playerId, friendId, callBack) {
    var self = this;
    self.makeRecord(playerId);
    self.makeRecord(friendId);
    var index = _.indexOf(self.friendMap[playerId]["friends"], friendId);
    var index2 = _.indexOf(self.friendMap[friendId]["friends"], playerId);
    if (index !== -1) self.friendMap[playerId]["friends"].splice(index, 1);
    if (index2 !== -1) self.friendMap[friendId]["friends"].splice(index2, 1);
    self.emit("save",playerId);
    self.emit("save",friendId);
    return callBack(Code.OK);
}

/**
 * 获取好友模块各分页列表
 * @param playerId
 * @param type
 * @param callBack
 */
pro.getInfoList = function (playerId, type,highPower, callBack) {
    var self = this;
    self.makeRecord(playerId);
    if (type === Consts.FRIEND_TYPE.RECOMMEND) {//系统推荐
        var playerIdList = JSON.parse(JSON.stringify(self.friendMap[playerId]["friends"]));
        playerIdList.push(playerId);
        friendsDao.getRecommend(highPower - 3000, highPower + 3000, playerIdList, function (err, infoList){
            callBack(infoList);
        });
    }else if(type === Consts.FRIEND_TYPE.BAD){//黑名单
        var playerIdList = JSON.parse(JSON.stringify(self.friendMap[playerId]["blackList"]));
        friendsDao.getFullByPlayerId(playerIdList,function(err, infoList){
            callBack(infoList);
        });
    }else if(type === Consts.FRIEND_TYPE.FRIEND){//好友列表
        var playerIdList = JSON.parse(JSON.stringify(self.friendMap[playerId]["friends"]));
        friendsDao.getFullByPlayerId(playerIdList,function(err, infoList){
            _.each(infoList,function(info){
               if( -1 !== _.indexOf(self.friendMap[playerId]["receiveEnergy"],info.playerId )){
                   info.receiveEnergy = 1;
               }else{
                   info.receiveEnergy = 0;
               }
            });
            callBack(infoList);
        });
    }else if(type === Consts.FRIEND_TYPE.REQUEST){//申请列表
        var playerIdList = JSON.parse(JSON.stringify(self.friendMap[playerId]["requests"]));
        friendsDao.getFullByPlayerId(playerIdList,function(err, infoList){
            callBack(infoList);
        });
    }else{
        callBack([]);
    }
}


/**
 * 发送体力
 * @param playerId
 * @param friendIdList
 * @param callBack
 */
pro.sendEnergy = function (playerId, friendIdList, callBack) {
    var self = this;
    self.makeRecord(playerId);
    _.each(friendIdList||[],function(fid){
        self.makeRecord(fid);
        self.friendMap[fid]["receiveEnergy"] = _.union(self.friendMap[fid]["receiveEnergy"],[playerId]);
        self.emit("save",fid);
    });
    return callBack(Code.OK);
}

/**
 * 收取体力
 * @param playerId
 * @param friendIdList
 * @param callBack
 */
pro.acceptEnergy = function (playerId, friendIdList, callBack) {
    var self = this;
    self.makeRecord(playerId);
    var index = 0;
    var rsList = []
    _.each(friendIdList||[],function(fid){
        index = _.indexOf(self.friendMap[playerId]["receiveEnergy"],fid);
        if(index!==-1){
            self.friendMap[playerId]["receiveEnergy"].splice(index,1);
            rsList.push(fid);
        }
    });
    self.emit("save",playerId);
    return callBack(Code.OK,rsList);
}

pro.getFriendIds = function(playerId){
    var self = this;
    self.makeRecord(playerId);
    return self.friendMap[playerId]["friends"];
}

pro.getBlackList = function(playerId){
    var self = this;
    self.makeRecord(playerId);
    return self.friendMap[playerId]["blackList"];
}







