/**
 * Created by kilua on 2016/6/22 0022.
 */

var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var _ = require('underscore');

var cronTrigger = require('../../area/cronTrigger');
var Consts   = require('../../../consts/consts');
var Utils =  require('../../../util/utils');
var Timing = function (activity) {
    EventEmitter.call(this);
    this.activity = activity;
};

util.inherits(Timing, EventEmitter);

var pro = Timing.prototype;

pro.clear = function () {
    if (this.timer) {
        clearTimeout(this.timer);
        this.timer = 0;
    }
};

pro.scheduleClose = function () {
    var self = this;
    if( self.activity.actData.openingTimeType == Consts.ACTIVITY_OPEN_TYPE.PERMANENT )
    {
        return;
    }
    else if( self.activity.actData.openingTimeType == Consts.ACTIVITY_OPEN_TYPE.BIG_WEEK||self.activity.actData.openingTimeType == Consts.ACTIVITY_OPEN_TYPE.SMALL_WEEK  )
    {
        var tempCloseTick = 1;
        if( self.getOpenTick() < Date.now() )
        {
            var closeTick = self.getCloseTick();
            if( (Utils.getWeekType() && self.activity.actData.openingTimeType == Consts.ACTIVITY_OPEN_TYPE.BIG_WEEK )   ||
                ( !Utils.getWeekType() && self.activity.actData.openingTimeType == Consts.ACTIVITY_OPEN_TYPE.SMALL_WEEK)
            )
            {
                tempCloseTick = closeTick -  Date.now();
            }
        }
        self.timer = setTimeout(function () {
            self.emit('close');
            self.clear();
        }, Math.max(1,tempCloseTick));
        return;
    }

    self.timer = setTimeout(function () {
        self.emit('close');
        self.clear();
    }, Math.max(1, self.getCloseTick() - Date.now()));

};

/*
 *   将指定时间往过去推一个星期
 * */
pro.getLastPeriodTick = function (refTick) {
    // TODO:子类实现
};

pro.getOpenTick = function () {
    // TODO: 子类实现
};

/*
 *   计算活动剩余时间
 * */
pro.getLeftTime = function () {
    return this.getCloseTick() - Date.now();
};

/*
 *   计算活动结束时间
 * */
pro.getCloseTick = function () {
    var closeTick = this.getOpenTick() + this.activity.getLastTime();
    // if(this.activity.getName()==="新号7天登录")
    //     console.error("closeTick:"+closeTick+",getOpenTick:"+this.getOpenTick()+",getLastTime:"+this.activity.getLastTime()+",name:"+this.activity.getName());
    return closeTick;
};

/*
 *   计算指定时间是否在指定区间内
 * */
pro.betweenPeriod = function (curTick, period) {
    if (_.isArray(period) && period.length === 2) {
        var isOpenTime =  (curTick >= period[0] && curTick <= period[1])
        return isOpenTime;
    }
    return false;
};

/*
 *   推算周期性时间的下一周期开始的时间
 * */
pro.getNextOpenTick = function (refTick) {
    var trigger = cronTrigger.createTrigger(this.activity.getOpenTime());
    return trigger.nextExcuteTime(refTick);
};

/*
 *   推算下一开放周期
 * */
pro.getNextOpenPeriod = function (refTick) {
    var openTick = this.getNextOpenTick(refTick);
    return [openTick, openTick + this.activity.getLastTime()];
};

/*
 *   获取当前开放区间
 * */
pro.getOpenPeriod = function () {
    var curOpenTick = this.getOpenTick();
    return [curOpenTick, curOpenTick + this.activity.getLastTime()];
};

/*
 *   活动是否开放
 * */
pro.isOpen = function () {
    return this.betweenPeriod(Date.now(), this.getOpenPeriod());
};

module.exports = Timing;