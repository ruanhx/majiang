/**
 * Created by kilua on 2016/7/5 0005.
 */

var _ = require('underscore');

var dataApi = require('../../util/dataApi'),
    Consts = require('../../consts/consts'),
    cronTrigger = require('../area/cronTrigger'),
    myUtils = require('../../util/utils');

var exp = module.exports = {};

/*
 *   推算周期性时间的下一周期开始的时间
 * */
function getNextExecTime(refTick, openingTime) {
    var trigger = cronTrigger.createTrigger(openingTime);
    return trigger.nextExcuteTime(refTick);
}

/*
 *   计算指定时间是否在指定区间内
 * */
function betweenPeriod(curTick, period) {
    if (_.isArray(period) && period.length === 2) {
        return (curTick >= period[0] && curTick <= period[1]);
    }
    return false;
}

/*
 *   换算活动的持续时间
 * */
function getActLastTime(lastHours) {
    if (lastHours === -1) {
        return Number.POSITIVE_INFINITY;
    }
    return (lastHours * 60 * 60 * 1000);
}

/*
 *   计算一般活动的可见区间
 * */
function getActVisiblePeriod(actData, visibleStartTick) {
    return [visibleStartTick, visibleStartTick + getActLastTime(actData.lastTime)];
}

/*
 *   计算周期性活动的可见时间区间
 * */
function getPeriodActVisiblePeriod(actData, refTick) {
    var nextOpenTick = getNextExecTime(refTick, actData.openingTime);
    // 当前开始可见时间和开放时间等价
    return getActVisiblePeriod(actData, nextOpenTick);
}

/*
 *   将指定时间，往过去推一个周期
 * */
function getActLastPeriodTick(actData, refTick) {
    var curTime = new Date();
    curTime.setTime(refTick);
    switch (actData.openingTimeType) {
        case Consts.ACTIVITY_OPEN_TYPE.PERIOD_DAY:
            return myUtils.getWeeksFrom(curTime, -1).getTime();
        case Consts.ACTIVITY_OPEN_TYPE.PERIOD_DATE:
            return myUtils.getMonthsFrom(curTime, -1).getTime();
        default :
            return refTick;
    }
}

/*
 *   判断周期性活动是否可见
 * */
function isPeriodActVisible(actData, now) {
    if (betweenPeriod(now, getPeriodActVisiblePeriod(actData, now))) {
        return true;
    }
    var lastPeriodTick = getActLastPeriodTick(actData, now);
    return betweenPeriod(now, getPeriodActVisiblePeriod(actData, lastPeriodTick));
}

/*
* 是否在本周时间内
* */
function isThisWeek(actData,now)
{
    var currWeekStartTime = myUtils.getCurrWeekStartTime();
    var listNums = myUtils.parseParams(actData.strOpeningTime, '#');
    var length = listNums.length;
    var startTimeTemp = 0;
    if( length >=1 )
    {
        startTimeTemp+=(listNums[0]-1) * 24*60*60;
    }
    if(length >= 2 ) {
        startTimeTemp+=listNums[1] * 60*60;
    }

    var openTime = (currWeekStartTime + startTimeTemp)*1000;
    var endTime = openTime+(actData.lastTime*60*60*1000);
    return now>openTime && now<endTime
};

/*
 *   计算开服后指定天开放的活动开始可见的时间
 * */
function getServerDayActVisibleStartTick(actData, curServerDay) {
    var curTime = new Date(),
        diffDay = actData.openingTime.day - curServerDay,
        mSecsPerDay = 24 * 60 * 60 * 1000;
    curTime.setTime(Date.now() + diffDay * mSecsPerDay);
    curTime.setHours(actData.openingTime.hour, 0, 0, 0);
    return curTime.getTime();
}

var isVisible = function (actData, opFlags, serverDay) {
    if (actData.operationFlag && !_.contains(opFlags, actData.operationFlag)) {
        return false;
    }
    var now = Date.now();

    switch (actData.openingTimeType) {
        case Consts.ACTIVITY_OPEN_TYPE.PERIOD_DAY:
        case Consts.ACTIVITY_OPEN_TYPE.PERIOD_DATE:
            return isPeriodActVisible(actData, now);
        case Consts.ACTIVITY_OPEN_TYPE.SERVER_DAY:
            return betweenPeriod(now, getActVisiblePeriod(actData, getServerDayActVisibleStartTick(actData, serverDay)));
        case Consts.ACTIVITY_OPEN_TYPE.DATE:
            return betweenPeriod(now, getActVisiblePeriod(actData, actData.openingTime.getTime()));
        case Consts.ACTIVITY_OPEN_TYPE.SMALL_WEEK:
            var isSmall = !myUtils.getWeekType();
            if(isSmall)
            {
                isSmall = isThisWeek(actData, now);
                return isSmall;
            }
            return false;
        case Consts.ACTIVITY_OPEN_TYPE.BIG_WEEK:
            var isBig = myUtils.getWeekType();
            if(isBig)
            {
                isBig =  isThisWeek(actData, now);
                return isBig;
            }
            return false;
        case Consts.ACTIVITY_OPEN_TYPE.PERMANENT:
            return  true;
        case Consts.ACTIVITY_OPEN_TYPE.NEW_PLAYER:
            return  true;
        default:
            return false;
    }
};

/*
 *   发布活动
 *   定时检查并发布活动或玩家上线时检查发布活动时调用
 * */
exp.publish = function (opFlags, serverDay) {
    var pubActIds = [];
    _.each(dataApi.Activity.all(), function (actData) {
        if (isVisible(actData, opFlags, serverDay)) {
            pubActIds.push(actData.id);
        }
    });
    return pubActIds;
};
