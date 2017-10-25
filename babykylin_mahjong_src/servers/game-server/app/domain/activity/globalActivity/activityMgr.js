/**
 * Created by max on 2017/7/8.
 */
var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');
var pomelo = require('pomelo');
var Activity = require('./activity'),
    dataApi = require('../../../util/dataApi'),
    activityDao = require('../../../dao/activityDao'),
    Consts = require('../../../consts/consts'),
    myUtils = require('../../../../mylib/utils/lib/utils'),
    starRank = require('./starRank'),
    powerRank = require('./powerRank'),
    endlessScoreRank = require('./endlessScoreRank'),
    barrierScoreRank = require('./barrierScoreRank'),
    async = require('async'),
    cronTrigger = require('../../area/cronTrigger');


function createActivity(manager, actData) {
    switch (actData.actType) {
        case Consts.ACTIVITY_TYPE.STAR_RANK:
            return new starRank(manager, actData);
        case Consts.ACTIVITY_TYPE.RANK_COMPETITION:
            return new barrierScoreRank(manager, actData);
        case Consts.ACTIVITY_TYPE.POWER_RANK:
            return new powerRank(manager, actData);
        case Consts.ACTIVITY_TYPE.ENDLESS_SCORE:
            return new endlessScoreRank(manager, actData);
        default:
            return new Activity(manager, actData);
    }
}

var Manager = function () {
    this.activityById = {};
};

var pro = Manager.prototype;

pro.getById = function (actId) {
    return this.activityById[actId];
};

/*
 * 通过类型获得活动
 * */
pro.getByType = function (actType) {
    var act = _.filter(this.activityById, function (_act) {
        return _act.getType() == actType;
    });
    if (_.size(act) >= 1) {
        return act[0];
    }
    return act;
};

/*
 *   添加活动
 * */
pro.checkAdd = function (actData) {
    if (this.activityById[actData.id]) {

        return this.activityById[actData.id];
    } else {
        //判断登录天数和通关条件
        actData.isNewAdd = true;
        var activity = (this.activityById[actData.id] = createActivity(this, actData));
        activity.onPublish();
        // activity.save();
        return activity;
    }
};

/*
 *   发布活动
 * */
pro.publish = function (actIds) {
    var self = this;
    actIds = actIds || [];
    //logger.debug('publish actIds = %j', actIds);
    var now = Date.now();
    actIds.forEach(function (actId) {
        var actData = dataApi.Activity.findById(actId);
        if (actData.isGlobal == 1) {
            self.checkAdd(actData);
        }

    });
    self.checkOpen();
};

pro.remove = function (activity) {
    if (activity && this.activityById[activity.id]) {
        activity.save(true);
        delete this.activityById[activity.id];
        // activity.pushRemove();
    }
};

/*
 *   类型为7每日重置
 * */
pro.reset = function () {
    var self = this;
    // self.player.resetDailyActivityEnergyTik();
    _.each(self.activityById, function (activity) {
        if (!!activity.actData) {
            // console.log('---/n/n/n/n %s',JSON.stringify(activity.actData));
            activity.reset();
        }
    })
};

/*
 *   检查并删除已关闭的活动,不推送活动删除
 * */
pro.batchCheckRemove = function (opFlags, serverDay) {
    var self = this;
    _.each(this.activityById, function (activity) {
        if (activity.isOpenByOpFlags(opFlags)) {
            if (activity.isClosed(serverDay)) {
                if (activity.haveAwardsToDraw()) {
                    activity.applyAwards();
                    // 活动在列表中消失
                    logger.info('batchCheckRemove remove activity.id %s after apply awards', activity.id);
                    self.remove(activity);
                } else {
                    // 若无奖励可领取，则活动在列表中消失
                    logger.info('batchCheckRemove directly remove activity.id %s', activity.id);
                    self.remove(activity);
                }
            } else {
                // 活动尚未结束，忽略
            }
        } else {
            // 活动时间过程中，活动运营标识关闭时
            // 活动直接关闭，剩余奖励不发放
            // 如关闭时处于对应活动，则在点击参与按钮（充值、领取等）时，上飘提示“该活动已关闭”
            // 要保留进度数据，所以不删除活动
            //logger.debug('batchCheckRemove do nothing for activity.id %s!', activity.id);
        }
    });
};
/*
 *   检查并开放活动
 * */
pro.checkOpen = function () {
    _.each(this.activityById, function (activity) {
        activity.checkOpen();
    });
};

pro.load = function (dbActList) {
    // this.resetTick = resetTick;
    var self = this;
    dbActList = dbActList || [];
    //logger.debug('load total = %s', dbActList.length);
    dbActList.forEach(function (dbAct) {
        var actData = dataApi.Activity.findById(dbAct.id);
        if (!actData) {
            logger.warn('load activity data not found!id = %s', dbAct.id);
        } else {
            var activity = createActivity(self, actData);
            //logger.debug('load loading activity %s', dbAct.id);
            activity.load(dbAct);
            self.activityById[activity.id] = activity;
        }
    });
};

// pro.getClientInfo = function () {
//     var infoList = [],
//         activityList = _.values(this.activityById);
//     // 排序
//     activityList.sort(function (a, b) {
//         return a.getPriority() - b.getPriority();
//     });
//     _.each(activityList, function (activity) {
//         if (activity.isOpenByOpFlags() && !activity.isAutoClosed()) {
//             // 只有没有运营标志或虽有运营标志且对应运营标志开启的已发布活动，客户端才可以看到
//             infoList.push(activity.getClientInfo());
//         }
//     });
//     return infoList;
// };

pro.clear = function () {
    _.each(this.activityById, function (activity) {
        activity.clear();
    });
};


pro.processOfflineReset = function (activity) {
    var trigger = pomelo.app.get('cronManager').getTriggerById(Consts.AREA_CRON.RESET_ACTIVITY),
        nextExecuteTime, now = Date.now();
    if (!activity.resetTick) {
        // 第一次
        this.reset();
        return;
    }
    if (!!trigger && !!activity.resetTick) {
        nextExecuteTime = trigger.nextExcuteTime(activity.resetTick);
        //logger.debug('processOfflineReset %s', new Date(this.resetTick).toString());
        if (nextExecuteTime < now) {
            this.reset();
        }
    }
};


/*
 *   检查并删除已关闭的活动,不推送活动删除
 * */
pro.checkRemoveActivities = function (app, opFlags, serverDay, cb) {
    var self = this;
    async.each(_.values(self.activityById), function (activity, callback) {
        if (activity.isOpenByOpFlags(opFlags)) {
            if (activity.isClosed(serverDay)) {
                // 若无奖励可领取，则活动在列表中消失
                logger.info('checkRemoveActivities directly remove activity.id %s', activity.id);
                self.remove(activity);
                callback();
                //}
            } else {
                // 活动尚未结束，忽略
                callback();
            }
        } else {
            //活动时间过程中，活动运营标识关闭时
            //活动直接关闭，剩余奖励不发放
            //如关闭时处于对应活动，则在点击参与按钮（充值、领取等）时，上飘提示“该活动已关闭”
            // 要保留进度数据，所以不删除活动
            //logger.debug('checkRemoveActivities do nothing for activity %s!', activity.id);
            callback();
        }
    }, cb);
};
pro.init = function (cb) {
    var self = this;
    // activityDao.load(function (err, rec) {
    //     if (!err) {
    //         // rec.forEach(function (actData) {
    //         //     self.load(actData);
    //         // });
    //         self.load(rec);
    //         cb();
    //     }
    //     // self.publish(publisher.publish(pomelo.app.get('opFlags')));
    // });
};
var g_activityMgr;
module.exports.getInstance = function () {
    if (!g_activityMgr) {
        g_activityMgr = new Manager();
        // g_activityMgr.init();
    }
    return g_activityMgr;
};

function getLastTime(lastHour) {
    if (lastHour === -1) {
        return Number.POSITIVE_INFINITY;
    }
    return (lastHour * 60 * 60 * 1000);
}

/*
 *   根据指定时间，计算下一个周期的开放时间
 *   @param {Number}    refTick 参考时间点
 *   @param {String}    cron time string like '0 0 0 * * *'
 * */
function getNextOpenTick(refTick, openingTime) {
    var trigger = cronTrigger.createTrigger(openingTime);
    return trigger.nextExcuteTime(refTick);
}

/*
 *   计算指定时间是否在某一可见周期中
 *   @param {Number}    now
 *   @param {Number}    openingTimeType
 *   @param {String}    openingTime cron time string like '0 0 0 * * *'
 *   @param {Number}    lastHour
 *   @param {Number}    showHour
 * */
function inVisiblePeriod(now, actData) {
    var lastTime = getLastTime(actData.lastTime),
        lastPeriodTime;
    if (inPeriod(now, now, actData.openingTime, lastTime)) {
        actData.openTick = getNextOpenTick(now, actData.openingTime);
        return true;
    }
    logger.info('inVisiblePeriod now %s not in current period openingTime = %s, lastTime = %s, ', now,
        actData.openingTime, lastTime);
    lastPeriodTime = getLastPeriodTime(now, actData.openingTimeType);
    if (inPeriod(now, lastPeriodTime, actData.openingTime, lastTime)) {
        actData.openTick = getNextOpenTick(lastPeriodTime, actData.openingTime);
        return true;
    }
    return false;
}


function getExpectServerDayOpenTick(expectServerDay, expectHour, curServerDay) {
    var curTime = new Date(),
        diffDay = expectServerDay - curServerDay,
        mSecsPerDay = 24 * 60 * 60 * 1000;
    curTime.setTime(Date.now() + diffDay * mSecsPerDay);
    curTime.setHours(expectHour, 0, 0, 0);
    return curTime.getTime();
}

/*
 *   计算指定时间是否在某一周期中
 *   @param {Number}    now
 *   @param {Number}    refTick
 *   @param {String}    openingTime cron time string like '0 0 0 * * *'
 *   @param {Number}    lastTime
 * */
function inPeriod(now, refTick, openingTime, lastTime) {
    var nextOpenTick = getNextOpenTick(refTick, openingTime);
    return (now >= nextOpenTick && now <= nextOpenTick + lastTime);
}

/*
 *   计算周期性活动的周期
 *   @param {Number} refTime
 *   @return {Number}
 * */
function getLastPeriodTime(refTime, openingTimeType) {
    var curTime = new Date();
    curTime.setTime(refTime);
    switch (openingTimeType) {
        case Consts.ACTIVITY_OPEN_TYPE.PERIOD_DAY:
            return myUtils.getWeeksFrom(curTime, -1).getTime();
        case Consts.ACTIVITY_OPEN_TYPE.PERIOD_DATE:
            return myUtils.getMonthsFrom(curTime, -1).getTime();
        default :
            return refTime;
    }
}
