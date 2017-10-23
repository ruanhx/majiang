/**
 * Created by tony on 2016/11/27.
 * 每日装备详细养成统计
 */
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
Consts = require('../../consts/consts'),
    DataStatistics  =   require('./dataStatistics'),
    _ = require('underscore'),
    util = require('util'),
    EVENTS = require('../event/events');

var DailyEndless = function (vPlayer,vData) {
    DataStatistics.call(this,vPlayer,vData);
    this.setTimeType( Consts.STATISTICS.DAILY );
    this.endlessInfo = {};
};

util.inherits(DailyEndless, DataStatistics);

var pro = DailyEndless.prototype;

pro.load = function ( dbList )
{
    var length = dbList.length;
    var self = this;
    //上阵的装备等级信息
    _.each(dbList,function(db){
        if(db.date == self.getDailyDate() )
        {
            if(!!db.endlessInfo)
            {
                self.endlessInfo =   JSON.parse( db.endlessInfo) ;
            }
            return;
        }
    })
}


/*
 *  存在数据过程
 */
pro.save = function()
{
    this.player.emit('saveStteEndless', this.getData());
};

/*
* ENDLESS_STTE 无尽模式
* winState ： 为1表示赢 为0表示失败
* */
pro.doRefresh =function( ENDLESS_STTE ,winState )
{
    if( this.getIsSameDay() )
    {
        if( !this.endlessInfo[ENDLESS_STTE] )
        {
            this.endlessInfo[ENDLESS_STTE] = {};
            this.endlessInfo[ENDLESS_STTE].type = ENDLESS_STTE;
            this.endlessInfo[ENDLESS_STTE].cnt = 0;
            this.endlessInfo[ENDLESS_STTE].winCnt = 0;
        }

        this.endlessInfo[ENDLESS_STTE].cnt +=1;

        this.endlessInfo[ENDLESS_STTE].winCnt += winState;
    }
    this.save();
}


pro.getEndlessInfo = function()
{
    if( !this.endlessInfo )
    {
        return null;
    }
    return JSON.stringify(this.endlessInfo);
}

/*
 *  存在数据库的数据
 */
pro.getData=function()
{
    return {
        playerId : this.player.id,
        date:this.getDailyDate(),
        endlessInfo:this.getEndlessInfo()
    };
};

module.exports = DailyEndless;