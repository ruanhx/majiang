/**
 * Created by rhx on 2017/6/16.
 */


var playerDao = require('../../dao/playerDao'),
    _ = require('underscore');

var MiniData = function (dbrec) {
    this.playerId = dbrec.id ? dbrec.id : dbrec.playerId;
    this.playername = dbrec.playername;
    this.headPicId = dbrec.headPicId;
    this.heroId = dbrec.heroId;
    this.highPower = Math.ceil(dbrec.highPower);

};

MiniData.prototype.getClientInfo = function () {
    return {
        playerId: this.playerId,
        playername: this.playername,
        headPicId: this.headPicId,
        heroId: this.heroId,
        highPower: this.highPower
    };
};


// 玩家简要数据
var playerMiniData = function () {
    this.players = {};
    this.powerList = [];
};
var pro = playerMiniData.prototype;

/**
 * 获取最大战斗力
 * @returns {*|number}
 */
pro.getHighPower = function () {
    return this.highPower;
};
// 初始化
pro.init = function () {
    var self = this;
    this.players = {};
    this.powerList = [];
    playerDao.getPlayerMiniDao(function (err, infoList) {
        infoList.forEach(function (rec) {
            var miniData = new MiniData(rec);
            self.players[rec.id] = miniData;
            self.powerList.push(miniData);
        });
        self.powerList.sort(function (a, b) {
            if (a.highPower === b.highPower) {
                return a.id - b.id;
            }
            return b.highPower - a.highPower;
        })
    });
};

/**
 * 获取所有的玩家列表
 * @returns {*}
 */
pro.getAllPlayer = function () {
    var playerList = _.allKeys(this.players);
    return playerList;
};
/**
 * 获取列表中范围内的随机值
 * @param min 下限
 * @param max  上限
 * @param list
 * @returns {null}
 */
function getByRandomIndex(min, max, list) {
    if (list.length <= 0) {
        return null;
    }
    var index = Math.floor(Math.floor(Math.random() * (max - min + 1) + min) * list.length / 100);
    if (list[index]) {
        var clientInfo = list[index].getClientInfo();
        list.splice(index, 1);
        return clientInfo;
    }
    return null;
}
// 获取系统推荐的助战好友
pro.getSysRecommendPlayer = function (playerId, friendList) {
    var playerList = [];
    var playerPowerList = [];
    playerPowerList = this.powerList.slice(0);
    var playerListById = _.indexBy(playerPowerList, 'playerId');
    // 去除好友列表重复的
    for (var i = 0; i < friendList.length; i++) {
        var player = playerListById[friendList[i]];
        if (player) {
            var index = playerPowerList.indexOf(player);
            playerPowerList.splice(index, 1);
        }
    }
    // 去除自己
    var me = playerListById[playerId];
    if (me) {
        var index = playerPowerList.indexOf(me);
        playerPowerList.splice(index, 1);
    }

    var playerMiniData = getByRandomIndex(0, 40, playerPowerList);
    if (playerMiniData) {
        playerList.push(playerMiniData);
    }
    playerMiniData = getByRandomIndex(40, 50, playerPowerList);
    if (playerMiniData) {
        playerList.push(playerMiniData);
    }
    playerMiniData = getByRandomIndex(50, 60, playerPowerList);
    if (playerMiniData) {
        playerList.push(playerMiniData);
    }
    playerMiniData = getByRandomIndex(60, 80, playerPowerList);
    if (playerMiniData) {
        playerList.push(playerMiniData);
    }
    playerMiniData = getByRandomIndex(80, 100, playerPowerList);
    if (playerMiniData) {
        playerList.push(playerMiniData);
    }
    return playerList;
};

pro.getPlayerById = function (playerId) {
    return this.players[playerId];
};

pro.add = function (rec) {
    var playerId = rec.id ? rec.id : rec.playerId;
    var miniData = new MiniData(rec);
    if (playerId == 0) {
        logger.error("playerMiniData player ==0 rec:%j", rec);
        return;
    }
    this.players[playerId] = miniData;
    this.powerList.push(miniData);
};

pro.update = function (rec) {
    var playerId = rec.id ? rec.id : rec.playerId;
    if (!playerId) {
        return;
    }
    var miniData = this.getPlayerById(playerId);
    if (!miniData) {
        this.add(rec);
    }
};
/**
 * 更新战斗力
 * @param rec
 */
pro.updatePower = function (rec) {
    var miniData = this.getPlayerById(rec.playerId);
    if (miniData) {
        miniData.highPower = rec.highPower;
    }
};

pro.checkAndUpdatePlayerName = function (rec) {
    var playerValues = _.values(this.players);
    var nameList = _.indexBy(playerValues,'playername');
    if(nameList[rec.playername]){
        return false;
    }
    var miniData = this.getPlayerById(rec.playerId);
    if (miniData) {
        miniData.playername = rec.playername;
    }
    return true;
};

pro.updateHeroId = function (rec) {
    var miniData = this.getPlayerById(rec.playerId);
    if (miniData) {
        miniData.heroId = rec.heroId;
    }
};

var _getInstance;
module.exports.getInstance = function () {
    if (!_getInstance) {
        _getInstance = new playerMiniData();
    }
    return _getInstance;
};