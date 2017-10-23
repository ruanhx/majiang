/**
 * Created by tony on 2016/10/14.
 */
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
Consts = require('../../consts/consts'),
    DataStatistics  =   require('./dataStatistics'),
    _ = require('underscore'),
    util = require('util'),
    dataUtils = require('../../util/dataUtils'),
    EVENTS = require('../event/events');

var PlayerBehavior = function (vPlayer,vData) {
    DataStatistics.call(this,vPlayer,vData);
    this.setTimeType( Consts.STATISTICS.PERMANENT );
    this.id = 0;
    this.behaviorInfo = [];
};

util.inherits(PlayerBehavior, DataStatistics);

var pro = PlayerBehavior.prototype;

pro.load = function(db)
{
    var self = this;
    if(!!db)
    {
        if(db.length>0)
        {
            var tempList = JSON.parse(db[0].behaviorInfo);
            _.each(tempList,function(data){
                self.behaviorInfo.push(data);
            });
        }
    }
};

/*
 *  存在数据过程
 */
pro.save = function()
{
    this.player.emit('saveSttePlayerBehavior', this.getData());
};

/*
* 刷新数据
* */
pro.doRefresh =function( playerId,heroLv,time, id , parameter1 )
{
    var wastePlayerNote = dataUtils.getOptionValue("wastePlayerNote",1);

    var currLength =  this.behaviorInfo.length;

    if(currLength>0)
    {
        //已经达到上限需要删除最旧的那条
        if( currLength >= wastePlayerNote )
        {
            var cutPos = currLength - wastePlayerNote+1;
            this.behaviorInfo = _.rest(this.behaviorInfo,cutPos);
        }
    }

    var tempJson = {};
    tempJson.heroLv = heroLv;
    tempJson.time = time;
    tempJson.id = id;
    tempJson.parameter1 = parameter1;
    this.behaviorInfo.push(tempJson);
    this.save();
}

/*
 *  存在数据库的数据
 */
pro.getData=function()
{
    return {
        playerId : this.player.id,
        playerName :this.player.playername,
        behaviorInfo:JSON.stringify(this.behaviorInfo),
    };
};

module.exports = PlayerBehavior;