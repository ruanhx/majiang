/**
 * Created by employee11 on 2015/12/11.
 */

var _ = require('underscore');

var Player = require('../entity/player');
var eventManager = require('../event/eventManager');
var teamManager = require('./teamManager');
var roomMgr = require('./roomMgr');
var logger = require('pomelo-logger').getLogger(__filename);
var barrierManager = require('./barrierManager');
var teamTiming = require('./teamTiming'),
    dataApi = require('../../util/dataApi'),
    offlineFightRecordDao = require('../../dao/offlineFightRecordDao'),
    Consts = require('../../consts/consts');


var exp = module.exports;

var id, players, entities;

function onShopChange() {
    _.each(exp.getPlayerIds(), function (playerId) {
        var player = exp.getPlayer(playerId);
        if (player) {
            setTimeout(function () {
                player.pushMsg('playerShop.refresh', {});
            }, _.random(1, 3 * 60 * 1000));
        }
    });
}

//充值表发生了变化
function onRechargeChange() {
    _.each(exp.getPlayerIds(), function (playerId) {
        var player = exp.getPlayer(playerId);
        if (player) {
            setTimeout(function () {
                player.pushMsg('playerReacharge.refresh', {});
            }, _.random(1, 3 * 60 * 1000));
        }
    });
}

exp.init = function (opts) {
    id = opts.id;
    players = {};
    entities = {};
    /*初始化队伍管理器*/
    teamManager.init();
    /*初始化战斗管理器*/
    barrierManager.init();
    /*初始化定时器*/
    teamTiming.init();

    var timerId = setInterval(function () {
        if (!dataApi.Shop || !dataApi.Goods) {
            return;
        }
        clearInterval(timerId);

        dataApi.Shop.on('change', onShopChange);
        dataApi.Goods.on('change', onShopChange);
        dataApi.Recharge.on('change', onRechargeChange);
    }, 1000);
};

exp.clear = function () {
    players = {};
    entities = {};
    /*释放队伍管理器*/
    teamManager.clear();
    /*释放战斗管理器*/
    barrierManager.clear();
    /*释放定时器*/
    teamTiming.clear();
};

/*获取玩家信息*/
exp.getPlayer = function (playerId) {
    var entityId = players[playerId];
    if (!!entityId) {
        return entities[entityId];
    }
    return null;
};

exp.addEntity = function (entity) {
    var entityId = entity.entityId;
    if (!entity || !entityId) {
        logger.error('addEntity entity = %j, entityId = %s', entity, entityId);
        return false;
    }
    if (entities[entityId]) {
        logger.error('addEntity entityId %s duplicated!', entityId);
        return false;
    }
    eventManager.addEvent(entity);
    entities[entityId] = entity;
    if (entity.type === 1) {
        players[entity.id] = entityId;
    }
    return true;
};

/*从玩家列表中移除玩家*/
exp.removeEntity = function (entityId) {
    var entity = entities[entityId];
    if (!entity) {
        return true;
    }
    eventManager.clearEvent(entity);
    if (entity.type === 1) {
        delete players[entity.id];
    }

    //清空所有对象的内容
    entity.activityMgr.clearActivityMgr();

    //清空player所有属性
    for(var key in entity){
        delete entity[key];
    }
    delete entities[entityId];
    return true;
};

/*添加玩家到玩家列表中*/
exp.addPlayer = function (dbPlayer) {
    var player = new Player(dbPlayer);
    if (!exp.addEntity(player)) {
        return null;
    }
    player.setMaxListeners(1000);//设置坚挺最大值
    return player;
};

exp.getPlayerIds = function () {
    return Object.keys(players);
};

/*程序退出踢玩家下线*/
exp.removePlayer = function (playerId) {
    var entityId = players[playerId],
        player;
    if (!!entityId) {
        player = entities[entityId];
    }
    var oldSessionId = player.sessionId, oldFrontId = player.frontendId;
    if (player) {
        player.leaveTime = setTimeout(function () {
            // player.onLogoff();
            var room = roomMgr.getInstance().getRoomById(player.roomId);
            room.setReady(playerId,1);
            // player.flush(function () {
            //     if (oldSessionId === player.sessionId && oldFrontId === player.frontendId) {
            //         console.log('removePlayer erase player %s.', player.id);
            //         return exp.removeEntity(entityId);
            //     }
            // });
        }, 2000);
    }
};

