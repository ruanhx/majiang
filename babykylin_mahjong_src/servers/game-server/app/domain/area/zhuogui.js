/**
 * Created by Administrator on 2017/9/12 0012.
 */
var _ = require('underscore');
// var Player = require('./Player');
var roomMgr = require("./roommgr");
// var userMgr = require("./usermgr");
var games = {};
var Zhuogui = function (room) {
    this.room = room;
    this.guiNum = room.gui;
    this.di = room.di;
    this.gui = [];
    this.players = room.member;
    this.seatIndex = 0;
    this.trun = 0;
    this.maxDrank = room.maxCnt;
    this.countBySeat = {};
    this.playersBySeat = _.indexBy(this.players,'index');
    this.thisShootDrank = {};
    this.thisTrunDrank = {};
}
var pro = Zhuogui.prototype;

pro.getGui = function () {
    return this.gui;
}

// pro.init = function (app, guinum, di) {
//     this.app = app;
//     this.guiNum = guinum;
//     this.di = di;
// }
// 定鬼
pro.dingGui2 = function () {
    for (var i = 0; i < this.guiNum; i++) {
        var gui = _.random(1, 6);
        this.gui.push(gui);
    }
    this.room.pushAllRoomMember('room.dingGui',{gui:this.gui});
};
pro.zhangui = function (seatIndex) {
    var memberGuis = [];
    for (var i = 0; i < this.guiNum; i++) {
        var gui = _.random(1, 6);
        memberGuis.push(gui);
    }
    this.countBySeat[seatIndex] = memberGuis;
    this.room.pushAllRoomMember('room.zhangui', {seat: seatIndex, craps: memberGuis});
    if(this.countBySeat.length == this.players.length){
        this.room.pushAllRoomMember('room.zhuogui', {trun: this.trun});
    }
};
pro.addDrankCnt = function (seatIndex, cnt) {
    var hasDrank = this.thisTrunDrank[seatIndex];
    if (hasDrank >= this.maxDrank) {
        return;
    }
    var drankCnt = this.thisShootDrank[seatIndex];
    if (!drankCnt) {
        this.thisShootDrank[seatIndex] = cnt;
    } else {
        this.thisShootDrank[seatIndex] = drankCnt + cnt;
    }
}
//
function shangjiahe(seatIndex) {
    if (seatIndex == 0) {
        this.addDrankCnt(this.players.length - 1, this.di);
    } else {
        this.addDrankCnt(seatIndex - 1, this.di);
    }
}

function xiajiahe(seatIndex) {
    if (seatIndex == this.players.length - 1) {
        this.addDrankCnt(0, this.di);
    } else {
        this.addDrankCnt(seatIndex + 1, this.di);
    }
}

function zijhe(seatIndex) {
    this.addDrankCnt(seatIndex, this.di);
}
function calGuiHe(crap) {
    var keys = _.keys(this.countBySeat);
    _.each(keys,function (data) {
        var craps = this.countBySeat[data];
        for (var i = 0; i < craps.length; i++) {
            if (craps[i] == crap) {
                this.addDrankCnt(data, this.di);
            }
        }
    })
}

pro.addTrun = function () {
    this.trun++;
    if (this.trun > this.players.length) {
        this.pushAll('trunEnd', {trun: this.trun});
        return;
    }
    this.thisTrunDrank = {};
    this.pushAll('trunUpdate', {trun: this.trun});
}

pro.shoot = function (seatIndex) {
    // 清空
    this.thisShootDrank = {};
    var craps = [];
    var totalValue = 0;
    for (var i = 0; i < this.guiNum; i++) {
        var gui = _.random(1, 6);
        craps.push(gui);
        totalValue +=gui;
    }
    // 计算
    // var totalValue = crap1 + crap2;
    switch (totalValue) {
        case 7:
            shangjiahe(seatIndex);
            break;
        case 8:
            xiajiahe(seatIndex);
            break;
        case 9:
            zijhe(seatIndex);
            break;
        default :
            break;
    }
    _.each(craps,function (crap) {
        calGuiHe(crap);
    })
    // calGuiHe(crap1);
    // calGuiHe(crap2);
    // if (zhidingSeat) {
    //     this.addDrankCnt(zhidingSeat, this.di);
    // }
    // this.room.pushAllRoomMember('shootCrap', {trun: this.trun});

    if (!this.thisShootDrank || this.thisShootDrank.length == 0) {
        this.trun++;
    }
    this.room.pushAllRoomMember('room.zhuogui', {trun: this.trun});
    this.room.pushAllRoomMember('room.dranks', {dranks: this.thisShootDrank});
    // return this.thisShootDrank;
}

pro.addPlayer = function (uid) {
    var self = this;
    if (this.players.valueOf(uid) == -1) {
        var player = new Player({uid: uid, seat: self.seatIndex});
        this.players.push(player);
        this.seatIndex++;
    }
}

pro.setReady = function (userId, callback) {
    var roomId = roomMgr.getUserRoom(userId);
    if (roomId == null) {
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }

    roomMgr.setReady(userId, true);

    var game = games[roomId];
    if (game == null) {
        for (var i = 0; i < roomInfo.seats.length; ++i) {
            var s = roomInfo.seats[i];
            if (s.ready == false || userMgr.isOnline(s.userId) == false) {
                return;
            }
        }
        //4个人到齐了，并且都准备好了，则开始新的一局
        this.begin();
    }


}


// pro.pushAll = function (route, msg) {
//     var channelService = this.app.get('channelService');
//     var channel = channelService.getChannel(1, false);
//     channel.pushMessage(route, msg);
// }

pro.begin = function () {
    this.dingGui2();
    this.pushAll('dinggui', {gui: this.gui});
};
module.exports = Zhuogui;

// var _gInstance = null;
// module.exports.getInstance = function () {
//     if (!_gInstance) {
//         _gInstance = new zhuoguiMgr();
//     }
//     return _gInstance;
// }