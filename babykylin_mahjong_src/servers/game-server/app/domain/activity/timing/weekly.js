/**
 * Created by kilua on 2016/6/22 0022.
 */

var util = require('util');

var Timing = require('./timing'),
    myUtils = require('../../../util/utils');

var Weekly = function (activity) {
    Timing.call(this, activity);
};

util.inherits(Weekly, Timing);

var pro = Weekly.prototype;

/*
 *   将指定时间往过去推一个星期
 * */
pro.getLastPeriodTick = function (refTick) {
    var curTime = new Date();
    curTime.setTime(refTick);
    return myUtils.getWeeksFrom(curTime, -1).getTime();
};

/*
 *   计算活动开放时间
 * */
pro.getOpenTick = function () {
    var pubTick = this.activity.getPubTick();
    if (this.betweenPeriod(pubTick, this.getNextOpenPeriod(pubTick))) {
        return this.getNextOpenTick(pubTick);
    }
    var lastPeriodTick = this.getLastPeriodTick(pubTick);
    return this.getNextOpenTick(lastPeriodTick);
};

module.exports = Weekly;