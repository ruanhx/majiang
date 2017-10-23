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

var NewBarrier = function (vPlayer,vData) {
    DataStatistics.call(this,vPlayer,vData);
    this.setTimeType( Consts.STATISTICS.PERMANENT );
    this.type = 0;
    this.barrierId = 0;
};

util.inherits(NewBarrier, DataStatistics);

var pro = NewBarrier.prototype;

/*
 *  存在数据过程
 */
pro.save = function()
{
    this.player.emit('saveStteNewBarrier', this.getData());
};

/*
 * */
pro.doRefresh =function( CHAPTER_TYPE , barrierId )
{
    this.type = CHAPTER_TYPE;
    this.barrierId= barrierId
    this.save();
}

/*
 *  存在数据库的数据
 */
pro.getData=function()
{
    return {
        playerId : this.player.id,
        type:this.type,
        barrierId:this.barrierId,
    };
};

module.exports = NewBarrier;