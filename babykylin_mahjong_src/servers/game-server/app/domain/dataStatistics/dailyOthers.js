/**
 * Created by tony on 2016/11/27.
 * 每日使用钻石记录
 */
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
Consts = require('../../consts/consts'),
    DataStatistics  =   require('./dataStatistics'),
    _ = require('underscore'),
    util = require('util'),
    EVENTS = require('../event/events');

var DailyOthers = function (vPlayer,vData) {
    DataStatistics.call(this,vPlayer,vData);
    this.setTimeType( Consts.STATISTICS.DAILY );
    this.taskActiveValue = 0;
    this.getComPoint  = 0;
    this.useComPoint  = 0;

};

util.inherits(DailyOthers, DataStatistics);

var pro = DailyOthers.prototype;

/*
 *  存在数据过程
 */
pro.save = function()
{
    this.player.emit('saveStteDailyOthers', this.getData());
};

pro.load = function ( dbList )
{
    var length = dbList.length;
    var self = this;
    //上阵的装备等级信息
    _.each(dbList,function(db){
        if(db.date == self.getDailyDate() )
        {
            self.taskActiveValue =db.taskActiveValue;
            self.getComPoint =db.getComPoint;
            self.useComPoint =db.useComPoint;
            return;
        }
    })
};

/*
 * */
pro.doRefresh =function( OTHER_STTE,addValue)
{
    if( Consts.OTHER_STTE.TASK_ACTIVE_VALUE == OTHER_STTE )
    {
        this.taskActiveValue += addValue;
    }
    else if( Consts.OTHER_STTE.GET_COMPOINT == OTHER_STTE )
    {
        this.getComPoint += addValue;
    }
    else if( Consts.OTHER_STTE.USE_COMPOINT == OTHER_STTE )
    {
        this.useComPoint += addValue;
    }
    this.save();
}

/*
 *  存在数据库的数据
 */
pro.getData=function()
{
    return {
        playerId : this.player.id,
        date:this.getDailyDate(),
        taskActiveValue:this.taskActiveValue,
        getComPoint:this.getComPoint,
        useComPoint:this.useComPoint,
    };
};

module.exports = DailyOthers;