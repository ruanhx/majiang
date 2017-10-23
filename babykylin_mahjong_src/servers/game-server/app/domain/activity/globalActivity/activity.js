/**
 * Created by kilua on 2016/7/5 0005.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore'),
    pomelo = require('pomelo');

var area = require('../../area/area'),
    activityDao = require('../../../dao/activityDao'),
    timing = require('../timing/index');
var dataApi = require('../../../util/dataApi');
var Activity = function (manager, actData) {
    this.manager = manager;
    this.id = actData.id;
    this.actData = actData;         // 只读
    this.timing = timing.createTiming(this);
    this.timing.on('close', this.onClose.bind(this));
    this.condDict = {};
    this.showType = actData.showType;
};

var pro = Activity.prototype;

pro.loadDetail = function (detail) {
    // TODO: 子类实现
};

pro.needInitialize = function () {
    // TODO: 子类实现
    return false;
};

pro.init = function () {
    // TODO: 子类实现
    return false;
};

pro.getDetailInfo = function () {
    // TODO: 子类实现
    return {};
};

pro.getDetailData = function () {
    // TODO: 子类实现
    return {};
};

pro.getClosedTick = function (serverDay) {
    // TODO: 子类实现
};

pro.haveAwardsToDraw = function () {
    // TODO: 子类实现
    return false;
};

pro.applyAllAvailableAwards = function () {
    // TODO: 子类实现
};

/*
 *   活动是否开放
 * */
pro.isOpen = function () {
    if (this.isOpenByOpFlags(pomelo.app.get('opFlags'))) {
        return this.timing.isOpen();
    }
    return false;
};


pro.showRedSpot = function () {
    return this.getViewTick() === 0 || this.haveAwardsToDraw();
};

pro.getTypeId = function () {
    return this.actData.actTypeId;
};

pro.getOpenTimeType = function () {
    return this.actData.openingTimeType;
};

pro.getName = function () {
    // if (!!this.player.language) {
    //     var name = this.actData[('name_txt_' + this.player.language)];
    //     if (!!name) {
    //         return name;
    //     }
    // }
    // TODO:多语言
    return this.actData.name_txt_cht;
};

pro.getIfTime = function () {
    return this.actData.ifTime;
};
pro.getPriority = function () {
    return this.actData.priority;
};

pro.getType = function () {
    return this.actData.actType;
};

pro.getDesc = function () {
    // if (!!this.player.language) {
    //     var desc = this.actData[('desc_txt_' + this.player.language)];
    //     if (!!desc) {
    //         return desc;
    //     }
    // }
    // TODO:多语言
    return this.actData.desc_txt_cht;
};
pro.getActTypeValue = function () {
    return this.actData.actTypeValue;
};
pro.getActTypeId = function () {
    return this.actData.actTypeId;
};


/*
 *   获取开放时间
 * */
pro.getOpenTime = function () {
    return this.actData.openingTime;
};


/*
 *   获取开放时间
 * */
pro.getStrOpenTime = function () {
    return this.actData.strOpeningTime;
};

/*
 *   获取活动持续时间
 * */
pro.getLastTime = function () {
    if (this.actData.lastTime === -1) {
        return Number.POSITIVE_INFINITY;
    }
    return (this.actData.lastTime * 60 * 60 * 1000);
};
/*
 *   获得是否可见
 * */
pro.isOpenByOpFlags = function (opFlags) {
    opFlags = opFlags || pomelo.app.get('opFlags');
    //logger.debug('id = %s isOpenByOpFlags operationFlag = %s, opFlags = %j', this.id, this.actData.operationFlag, opFlags);
    if (this.actData.operationFlag) {
        if (!_.contains(opFlags, this.actData.operationFlag)) {
            return false;
        }
    }
    return true;
};

/*
 *   推送新活动给客户端
 * */
// pro.pushNew = function () {
//     var self = this;
//     var playerIds = area.getPlayerIds();
//     _.each(playerIds, function (playerId) {
//         var player = area.getPlayer(playerId);
//         if (!!player) {
//             player.pushMsg('activity.new', self.getClientInfo());
//         }
//     });
// };

pro.reset = function () {
    //
};

/*
 *   推送活动删除
 * */
// pro.pushRemove = function () {
//     var self = this;
//     var playerIds = area.getPlayerIds();
//     _.each(playerIds, function (playerId) {
//         var player = area.getPlayer(playerId);
//         if (!!player) {
//             player.pushMsg('activity.remove', {id: self.id});
//         }
//     });
//
// };

pro.checkOpen = function () {
    if (this.isOpen()) {
        if (this.needInitialize() && this.init()) {
            this.save();
            // this.pushNew();
        }
    }
};

// pro.getClientInfo = function () {
//     return {
//         id: this.id,
//         name: this.getName(),
//         showRedSpot: this.showRedSpot() ? 1 : 0,
//         type: this.getType(),
//         closeTick: this.timing.getCloseTick(),
//         desc: this.getDesc(),
//         detail: this.getDetailInfo(),
//         vewTick: this.getViewTick(),
//         actTypeValue: this.getActTypeValue(),
//         actTypeId: this.getActTypeId(),
//         ifTime: this.getIfTime(),
//         showType: this.showType || 0
//     };
// };

pro.setPubTick = function () {
    this.pubTick = Date.now();
};

// pro.getViewTick = function () {
//     return this.viewTick;
// };

// /*
//  *   刷新红点
//  * */
// pro.refreshRedSpot = function (orgRedSpot,player) {
//     var newRedSpot = this.showRedSpot();
//     if (newRedSpot !== orgRedSpot) {
//         player.pushMsg('activity.refreshRedSpot', {id: this.id, showRedSpot: newRedSpot ? 1 : 0});
//     }
// };

// pro.setViewTick = function (curTick) {
//     var orgRedSpot = this.showRedSpot();
//     this.viewTick = curTick;
//     this.refreshRedSpot(orgRedSpot);
//     this.save();
// };

pro.onPublish = function () {
    this.setPubTick();
    // this.setViewTick(0);
    // this.pushNew();
    this.save();
    this.timing.scheduleClose();
};

pro.getPubTick = function () {
    return this.pubTick;
};

pro.getData = function () {
    return {
        id: this.id,
        pubTick: this.pubTick || 0,
        resetTick: this.resetTick,
        detail: this.getDetailData()
    };
};

pro.save = function (remove) {
    var saveData = this.getData();
    if (remove) {
        saveData.remove = true;
    }
    activityDao.save(pomelo.app.get('dbclient'), saveData, function () {

    });
    // this.player.emit('activity.save', saveData);
};

pro.load = function (saveData) {
    this.saveData = saveData;
    this.id = saveData.id;
    this.pubTick = saveData.pubTick;
    this.resetTick = saveData.resetTick;
    this.loadDetail(saveData.detail);
    this.timing.scheduleClose();
};

/*
 *   活动是否关闭。注意，活动不开放和活动关闭不等价。活动不开放可能是尚未开放。
 * */
pro.isClosed = function (serverDay) {
    return (Date.now() > this.getClosedTick(serverDay));
};

/*
 *   活动时间结束了，触发关闭
 * */
pro.onClose = function () {
    //logger.debug('onClose id = %s', this.id);
    if (this.isOpenByOpFlags()) {
        // 活动无运营标识或运营标识未关闭，当活动时间结束时
        if (this.haveAwardsToDraw()) {
            //若有奖励可领取，活动在列表中消失（开启活动界面状态下不刷新），同时将奖励直接发给玩家（不在线的玩家上线时给予）
            this.applyAllAvailableAwards();
            this.manager.remove(this);
        } else {
            //若无奖励可领取，则活动在列表中消失
            this.manager.remove(this);
        }
    } else {
        // 活动时间到的时候，对应标志之前已被关闭，直接删除活动
        this.manager.remove(this);
    }
};

pro.clear = function () {
    this.timing.clear();
};

/*
 *   自动关闭的活动，达到自动关闭的条件，对客户端隐藏
 * */
pro.isAutoClosed = function () {
    return false;
};

module.exports = Activity;