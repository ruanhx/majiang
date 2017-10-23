/**
 * Created by kilua on 2016/6/22 0022.
 */

var util = require('util');

var Timing = require('./timing'),
    common = require('../../../util/common');

var ServerDay = function (activity) {
    Timing.call(this, activity);
};

util.inherits(ServerDay, Timing);

var pro = ServerDay.prototype;

pro.getOpenTick = function () {
    var curTime = new Date(),
        openTime = this.activity.getOpenTime(),
        curServerDay = common.getServerDay() || 1,
        diffDay = openTime.day - curServerDay,
        mSecsPerDay = 24 * 60 * 60 * 1000;
    curTime.setTime(Date.now() + diffDay * mSecsPerDay);
    curTime.setHours(openTime.hour, 0, 0, 0);
    var t = curTime.getTime();
    return t;
};

module.exports = ServerDay;
