/**
 * Created by Administrator on 2017/10/26 0026.
 */
var roomDao = require('../../dao/roomDao'),
    Room = require('../entity/room');
    _ = require('underscore');

var roomMgr = function () {
    this.rooms = {};
    this.roomByOwner ={};
};
var pro = roomMgr.prototype;

pro.roomInit = function () {
    var self = this;
    roomDao.getAllRoom(function (err,res) {
        _.each(res,function (data) {
            var room = new Room(data);
            self.rooms[data.id] =  room;
            self.roomByOwner[data.ownerId] =  room;
        });
    });
};

pro.getRoomByOwner = function (playerId) {
    return this.roomByOwner[playerId];
};



pro.setRoomById = function (room) {
    this.rooms[room.id] = room;
    this.roomByOwner[room.ownerId] = room;
};

pro.getRoomById = function (id) {
    return this.rooms[id];
};

var _getInstance;
module.exports.getInstance = function () {
    if (!_getInstance) {
        _getInstance = new roomMgr();
    }
    return _getInstance;
};