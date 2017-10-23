/**
 * Created by tony on 2016/9/23.
 */
var util = require('util');

var Timing = require('./timing'),
    myUtils = require('../../../util/utils');

var Permanent = function (activity) {
    Timing.call(this, activity);
};

util.inherits(Permanent, Timing);

var pro = Permanent.prototype;

///*
// * */
//pro.getLastPeriodTick = function () {
//    return  Date.now() + 999999999;
//};
//
///*
// *   计算活动开放时间
// * */
pro.getOpenTick = function () {
    var pubTick = this.activity.getPubTick();
   return  pubTick;
};

pro.isOpen = function () {
    return true;
};
module.exports = Permanent;