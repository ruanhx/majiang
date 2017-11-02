/**
 * Created by Administrator on 2017/10/26 0026.
 */
var roomDao = require('../../dao/roomDao'),
    Room = require('../entity/room');
    _ = require('underscore');

var zhuoguiMgr = function () {
    this.zhuoguis = {};
    // this.roomByOwner ={};
};
var pro = zhuoguiMgr.prototype;

pro.zhuoguiInit = function () {
    var self = this;
    // roomDao.getAllRoom(function (err,res) {
    //     _.each(res,function (data) {
    //         var room = new Room(data);
    //         self.rooms[data.id] =  room;
    //         self.roomByOwner[data.ownerId] =  room;
    //     });
    // });
};

pro.addNewGame = function () {

};

pro.setRoomById = function (game) {
    this.zhuoguis[game.id] = game;
};

pro.getGameById = function (id) {
    return this.zhuoguis[id];
};

var _getInstance;
module.exports.getInstance = function () {
    if (!_getInstance) {
        _getInstance = new zhuoguiMgr();
    }
    return _getInstance;
};