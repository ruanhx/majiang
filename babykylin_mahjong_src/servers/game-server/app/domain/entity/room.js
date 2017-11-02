/**
 * Created by Administrator on 2017/10/26 0026.
 */
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename),
    roomDao = require('../../dao/roomDao'),
    Zhuogui = require('../../domain/area/zhuogui'),
    area = require('../area/area');
var Room = function (opts) {
    opts = opts || {};
    EventEmitter.call(this);
    this.id = opts.id;
    this.di = opts.di;
    this.ownerId = opts.ownerId;
    this.gui = opts.gui;
    this.maxCnt = opts.maxCnt;
    if (opts.member != "" && opts.member != null) {
        this.member = JSON.parse(opts.member);
    } else {
        this.member = [];
    }
};

util.inherits(Room, EventEmitter);
var pro = Room.prototype;

pro.getRoomData = function () {
    var data = {};
    // data.id = this.id;
    data.di = this.di;
    data.ownerId = this.ownerId;
    data.gui = this.gui;
    data.maxCnt = this.maxCnt;
    data.member = JSON.stringify(this.member);
    return data;
};

pro.getRoomClientInfo = function () {
    var data = {};
    data.id = this.id;
    data.di = this.di;
    data.gui = this.gui;
    data.maxCnt = this.maxCnt;
    data.member = this.member;
    data.ownerId = this.ownerId;
    // data.createTime =
    return data;
};

pro.getRoomMemberById = function (playerId) {
    var player = _.find(this.member, function (num) {
        return num.memberId = playerId;
    });
    return player;
};

pro.pushAllRoomMember = function (route, msg) {
    var memberList = _.pluck(this.member, 'memberId');
    _.each(memberList, function (playerId) {
        var player = area.getPlayer(playerId);
        if (player) {
            logger.debug("pushAllRoomMember %s,%s,%j",playerId,route, msg);
            player.pushMsg(route, msg);
        }else {
            logger.debug("pushAllRoomMember error %s",playerId);
        }
    });
};

pro.roomSave = function () {
    roomDao.roomUpdate(this.getRoomData(), function () {

    });
};

pro.test = function () {
    this.pushAllRoomMember('room.addMember', {memberId: 10001, memberName: "rrrr"});
}

pro.enter = function (playerId, playerName) {

    if (this.getRoomMemberById(playerId)) {
        logger.error("getPlayerById");
        return;
    }
    logger.error("enter");
    this.member.push({memberId: playerId, memberName: playerName, isReady: false});
    this.roomSave();
    this.pushAllRoomMember('room.addMember', {memberId: playerId, memberName: playerName});
};

pro.isNotAllReady = function () {
    var isReady = _.find(this.member, function (num) {
        return num.isReady = false;
    });
    return isReady;
};

pro.setReady = function (playerId) {
    var player = this.getRoomMemberById(playerId);
    if (!player) {
        return;
    }
    player.isReady = true;
    this.roomSave();

};

pro.begin = function () {
    // 全部准备好了
    this.game = new Zhuogui(this);
    this.game.dingGui2();
}

module.exports = Room;