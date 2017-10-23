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

var ArmEquipFull = function (vPlayer,vData) {
    DataStatistics.call(this,vPlayer,vData);
    this.setTimeType( Consts.STATISTICS.PERMANENT );
    this.armEquipFullTime = 0;
};

util.inherits(ArmEquipFull, DataStatistics);

var pro = ArmEquipFull.prototype;

/*
 *  存在数据过程
 */
pro.save = function()
{
    this.player.emit('saveStteArmEquipFull', this.getData());
};

/*
 * */
pro.doRefresh =function(time)
{
    this.armEquipFullTime = time;
    this.save();
}

/*
 *  存在数据库的数据
 */
pro.getData=function()
{
    return {
        playerId : this.player.id,
        date:this.armEquipFullTime,
    };
};

module.exports = ArmEquipFull;