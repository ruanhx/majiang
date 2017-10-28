/**
 * Created by Administrator on 2017/10/26 0026.
 */
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore'),
    area = require('../area/area');
var Room = function (opts) {
    opts = opts || {};
    EventEmitter.call(this);
    this.id = opts.id;
    this.di = opts.di;
    this.ownerId = opts.ownerId;
    this.gui = opts.gui;
    this.maxCnt = opts.maxCnt;
    if(opts.member != "" && opts.member != null){
        this.member = JSON.parse(opts.member);
    }else {
        this.member = [];
    }
};

util.inherits(Room, EventEmitter);
var pro = Room.prototype;

pro.getRoomData = function () {
    var data = {};
    data.id = this.id;
    data.di = this.di;
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
    return data;
};

pro.isInRoom = function (playerId) {
    var isInRoom = _.find(this.member,function (num) {
        return num.memberId = playerId;
    });
    return isInRoom;
};

pro.pushAllRoomMember = function (route,msg) {
    var memberList = _.pluck(this.member,'memberId');
    _.each(memberList,function (playerId) {
        var player = area.getPlayer(playerId);
        if(player){
            player.pushMsg(route,msg);
        }
    });
};

pro.enter = function (playerId,playerName) {
    this.member.push({memberId:playerId,memberName:playerName});
    this.pushAllRoomMember('room.addMember',{memberId:playerId,memberName:playerName});
};

module.exports = Room;