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
    EVENTS = require('../event/events'),
    useDiamondDao  = require('../../dao/useDiamondDao');

var DailyUseDiamond = function (vPlayer,vData) {
    DataStatistics.call(this,vPlayer,vData);
    this.setTimeType( Consts.STATISTICS.DAILY );
    this.useWay = 0;
    this.useDiamond = 0;
    this.surplusDiamond = 0;
    this.shopGoodsId = 0;
};

util.inherits(DailyUseDiamond, DataStatistics);

var pro = DailyUseDiamond.prototype;

//pro.load = function ( dbList )
//{
//    //if(!dbList)
//    //{
//    //    return;
//    //}
//    //var self = this;
//    //_.each(dbList,function(db){
//    //    if(db.date == self.getDailyDate() )
//    //    {
//    //        self.useWay = db.useWay;
//    //        self.useDiamond = db.useDiamond;
//    //        self.surplusDiamond = db.surplusDiamond;
//    //        return;
//    //    }
//    //})
//}


/*
 *  存在数据过程
 */
pro.save = function()
{
    useDiamondDao.saveDailyUseDiamond(this.getData(),function(err,success){});
   // this.player.emit('saveStteUseDiamond', this.getData());
};

/*
 * ENDLESS_STTE 无尽模式
 * winState ： 为1表示赢 为0表示失败
 * */
pro.doRefresh =function( USE_DIAMOND_STTE ,useDiamond ,surplusDiamond,shopGoodsId)
{
    //if( this.getIsSameDay() )
    //{
    //    if( !this.buyInfoList[USE_DIAMOND_STTE] )
    //    {
    //        this.buyInfoList[USE_DIAMOND_STTE] = {};
    //        this.buyInfoList[USE_DIAMOND_STTE].useDiamond = 0;
    //    }
    //    this.buyInfoList[USE_DIAMOND_STTE].useDiamond += useDiamond;
    //    this.buyInfoList[USE_DIAMOND_STTE].surplusDiamond = surplusDiamond;
    //}
    this.useWay = USE_DIAMOND_STTE;
    this.useDiamond = useDiamond;
    this.surplusDiamond = surplusDiamond;
    this.shopGoodsId = shopGoodsId;
    this.save();
}


//pro.getBuyInfo = function()
//{
//    if( !this.buyInfoList )
//    {
//        return null;
//    }
//    return JSON.stringify(this.buyInfoList);
//}

/*
 *  存在数据库的数据
 */
pro.getData=function()
{
    return {
        playerId : this.player.id,
        date:this.getDailyDate(),
        time:Date.now(),
        useWay:this.useWay,
        useDiamond:this.useDiamond,
        surplusDiamond:this.surplusDiamond,
        shopGoodsId:this.shopGoodsId
    };
};

module.exports = DailyUseDiamond;