/**
 * Created by tony on 2016/9/8.
 */


var util = require('util'),
    Consts = require('../../../consts/consts');
var cronTrigger = require('../../area/cronTrigger');
var Timing = require('./timing'),
    myUtils = require('../../../util/utils');

var BigSmallWeek = function (activity) {
    Timing.call(this, activity);
};

util.inherits(BigSmallWeek, Timing);

var pro = BigSmallWeek.prototype;

/*
 *   将指定时间往过去推2个星期
 * */
pro.getLastPeriodTick = function (refTick) {
    var openTimeType = this.activity.getOpenTimeType()
    var bigOrSmallWeek = myUtils.getWeekType();
    var currWeekStartTime = myUtils.getCurrWeekStartTime();
    var tempTime = currWeekStartTime;
    if(  Consts.ACTIVITY_OPEN_TYPE.SMALL_WEEK  == openTimeType )
    {
        tempTime = !bigOrSmallWeek ? currWeekStartTime : currWeekStartTime+myUtils.getOneWeekSecs() ;
    }
    else if(  Consts.ACTIVITY_OPEN_TYPE.SMALL_WEEK  == openTimeType )
    {
        tempTime =  bigOrSmallWeek ? currWeekStartTime : currWeekStartTime+ myUtils.getOneWeekSecs();
    }
    return  myUtils.getOneWeekSecs()*1000;

    //var curTime = new Date();
    //curTime.setTime(refTick);
    //return myUtils.getWeeksFrom(curTime, 2).getTime();
};

/*
 *   计算活动开放时间
 * */
pro.getOpenTick = function () {
    var openTimeType = this.activity.getOpenTimeType()
    var bigOrSmallWeek = myUtils.getWeekType();
    var currWeekStartTime = myUtils.getCurrWeekStartTime();
    var tempTime = currWeekStartTime;
    if(  Consts.ACTIVITY_OPEN_TYPE.SMALL_WEEK  == openTimeType )
    {
        tempTime =  !bigOrSmallWeek ? currWeekStartTime : currWeekStartTime+myUtils.getOneWeekSecs();;
    }
    else if(  Consts.ACTIVITY_OPEN_TYPE.BIG_WEEK  == openTimeType )
    {
        tempTime =  bigOrSmallWeek ? currWeekStartTime : currWeekStartTime+myUtils.getOneWeekSecs();;
    }

    var startTime = this.activity.getStrOpenTime();

    var listNums = myUtils.parseParams(startTime, '#');

    var length = listNums.length;
    var startTimeTemp = 0;
    if( length >=1 )
    {
        startTimeTemp+=(listNums[0]-1) * 24*60*60;
    }
    if(length >= 2 ) {
        startTimeTemp+=listNums[1] * 60*60;
    }
    return ( (tempTime+startTimeTemp) * 1000);
};
module.exports = BigSmallWeek;
