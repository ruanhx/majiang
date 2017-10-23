/**
 * Created by kilua on 2016/6/22 0022.
 */

var util = require('util');

var Timing = require('./timing');

var SomeDate = function (activity) {
    Timing.call(this, activity);
};

util.inherits(SomeDate, Timing);

var pro = SomeDate.prototype;

pro.getOpenTick = function () {
    return this.activity.getOpenTime().getTime();
};

module.exports = SomeDate;

