/**
 * Created by tony on 2016/11/19.
 */
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
var DailyResetManager = require('../../util/dailyResetManager'),
    Consts = require('../../consts/consts'),
    _ = require('underscore'),
    dataApi = require('../../util/dataApi'),
    utils =  require('../../util/utils'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    EVENTS = require('../event/events');

var DataStatistics = function ( player,vData )
{
    EventEmitter.call(this);
    vData = vData || {};
    this.player = player;
    this.dailyRefineCnt = vData.dailyRefineCnt || 0;
    this.dailyDate = vData.dailyDate || utils.getDataString();
    this.timeType = vData.timeType || 0;
    this.registerTime = vData.registerTime || 0;
    this.playerName = vData.playerName || '';
};
util.inherits(DataStatistics, EventEmitter);
var pro = DataStatistics.prototype;

pro.clearDailyStatistics = function(){
    delete this.player;
    delete this.dailyRefineCnt;
    delete this.dailyDate;
    delete this.timeType;
    delete this.registerTime;
    delete this.playerName;
}

pro.getDailyDate = function()
{
    if( !this.dailyDate )
    {
        this.dailyDate = utils.getDataString();
    }
    return this.dailyDate;
};

/*
 * 玩家的名字
 */
pro.getPlayerName = function()
{
    return this.playerName;
};

/*
 * 玩家注册时间
 */
pro.getRegisterTime = function()
{
    return this.registerTime;
};

pro.setTimeType = function( type )
{
    var d = new Date( Date.now() );
    var tmp = d.getUTCDay();
    this.timeType = type;
}

/*
* 是否为同一天
* */
pro.getIsSameDay = function(){
    return utils.isSameDay( Date.now() ,this.getDailyDate()  );
};

pro.getData = function()
{
    return { playerId: this.player.id,
              dailyRefineCnt:this.dailyRefineCnt,
              dailyDate:this.dailyDate,
              timeType:this.timeType,
            };
}

pro.save = function()
{
    this.player.emit('saveDataStatistics', this.getData());
}

module.exports = DataStatistics;

