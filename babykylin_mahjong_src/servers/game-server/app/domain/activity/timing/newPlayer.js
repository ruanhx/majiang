/**
 * Created by tony on 2016/9/23.
 */
var util = require('util');

var Timing = require('./timing'),
    myUtils = require('../../../util/utils');

var NewPlayer = function (activity) {
    Timing.call(this, activity);
};

util.inherits(NewPlayer, Timing);

var pro = NewPlayer.prototype;

///*
// *   计算活动开放时间
// * */
pro.getOpenTick = function () {
    var pubTick = this.activity.getPubTick();
    var curTime = new Date(pubTick);
    curTime.setHours(0, 0, 0, 0);
   return  curTime.getTime();
};

pro.isOpen = function () {
    return true;
};
module.exports = NewPlayer;