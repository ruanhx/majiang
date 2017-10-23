/**
 * Created by tony on 2016/11/19.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo'),
    _ = require('underscore'),
    dataApi = require('../../util/dataApi'),
    DailyEquip = require('./dailyEquip'),
    DailyEndless = require('./dailyEndless'),
    DailyUseDiamond = require('./dailyUseDiamond'),
    DailyOthers = require('./dailyOthers'),
    ArmEquipFull =  require('./armEquipFull'),
    NewBarrier =   require('./newBarrier'),
    PlayerBehavior =   require('./playerBehavior'),
    Consts = require('../../consts/consts');


var DataStatisticManager = function (player) {
    this.player = player;

    //存储各个数据采集的对象
    this.dataStatisticsList = {};
};

var pro = DataStatisticManager.prototype;

pro.clearDataStatistics = function(){
    delete this.player;

    for(var key in this.dataStatisticsList){
        for(var i in this.dataStatisticsList[key]){
            this.dataStatisticsList[key][i].clearDailyStatistics();
            delete this.dataStatisticsList[key][i];
        }
        delete this.dataStatisticsList[key];
    }
    delete this.dataStatisticsList;
}

pro.load = function ( dbList )
{
    if(!dbList)
    {
        return;
    }
    var self = this;
    dbList = dbList || [];

    //每日装备数据初始化
    var temp = self.getObjDoRefresh( Consts.STATISTICS.DAILY,Consts.DAILY_STATISTICE.EQUIP);
    temp.load(dbList.equip);

    var endless = self.getObjDoRefresh( Consts.STATISTICS.DAILY,Consts.DAILY_STATISTICE.ENDLESS);
    endless.load(dbList.endless);

    var useDiamond =  self.getObjDoRefresh( Consts.STATISTICS.DAILY,Consts.DAILY_STATISTICE.USE_DIAMOND);
    //useDiamond.load(dbList.useDiamondList);

    var dailyOthers = self.getObjDoRefresh( Consts.STATISTICS.DAILY,Consts.DAILY_STATISTICE.OTHER);
    dailyOthers.load(dbList.dailyOthers);

    var behavior = self.getObjDoRefresh( Consts.STATISTICS.PERMANENT,Consts.PERMANENT_STATISTICE.PLAYER_BEHAVIOR);
    behavior.load(dbList.playerBehavior);
};
/* timeType : STATISTICS
* dailyStatisticType : DAILY_STATISTICE
* 获取数据采集对应然后刷新数据
* modelType
* */
pro.getObjDoRefresh = function( timeType  ,StatisticType  )
{
    var typeList = this.dataStatisticsList[ timeType ];
    if( !typeList )
    {
        typeList = this.dataStatisticsList[ timeType ] = {};
    }
    var temp = typeList[StatisticType];

    if(!!temp)
    {
        return temp;
    }
    //表示需要新建
    //每日部分
    if(timeType == Consts.STATISTICS.DAILY)
    {
        //装备模块
        if(Consts.DAILY_STATISTICE.EQUIP == StatisticType)
        {
            temp =this.dataStatisticsList[ timeType ][StatisticType] =  new DailyEquip( this.player);
        }
        //无尽模块
        else if(Consts.DAILY_STATISTICE.ENDLESS == StatisticType)
        {
            temp =this.dataStatisticsList[ timeType ][StatisticType] =  new DailyEndless( this.player);
        }
        else if(Consts.DAILY_STATISTICE.USE_DIAMOND == StatisticType)
        {
            temp = this.dataStatisticsList[ timeType ][StatisticType] =  new DailyUseDiamond( this.player);
        }
        else if(Consts.DAILY_STATISTICE.OTHER == StatisticType)
        {
            temp = this.dataStatisticsList[ timeType ][StatisticType] =  new DailyOthers( this.player);
        }
    }
    //永久部分
    else if(timeType == Consts.STATISTICS.PERMANENT)
    {
        if(Consts.PERMANENT_STATISTICE.ARM_EQUIP_FULL_TIME == StatisticType)
        {
            temp =this.dataStatisticsList[ timeType ][StatisticType] =  new ArmEquipFull( this.player );
        }
        else if(Consts.PERMANENT_STATISTICE.NEW_BARRIER == StatisticType)
        {
            temp =this.dataStatisticsList[ timeType ][StatisticType] =  new NewBarrier( this.player );
        }
        else if(Consts.PERMANENT_STATISTICE.PLAYER_BEHAVIOR == StatisticType)
        {
            temp =this.dataStatisticsList[ timeType ][StatisticType] =  new PlayerBehavior( this.player );
        }
    }
    return temp;
};

/*
* 每日装备
* */
pro.refreshDailyEquipData = function( EQUIP_STTE , pos , tempLv )
{
    var tempObj = this.getObjDoRefresh( Consts.STATISTICS.DAILY ,Consts.DAILY_STATISTICE.EQUIP );
    if(!tempObj)
    {
        return;
    }
    tempObj.doRefresh(EQUIP_STTE , pos , tempLv);
};

pro.refreshDailyEndlessData = function( ENDLESS_STTE , winState )
{
    var tempObj = this.getObjDoRefresh( Consts.STATISTICS.DAILY ,Consts.DAILY_STATISTICE.ENDLESS );
    if(!tempObj)
    {
        return;
    }
    tempObj.doRefresh( ENDLESS_STTE ,winState );
};

/*
* 记录钻石消耗
* USE_DIAMOND_STTE : 消耗途径
* useDiamond       ：消耗的钻石
* surplusDiamond   ：剩余的钻石
* shopGoodsId      : 商品id
* */
pro.refreshDailyUseDiamond = function( USE_DIAMOND_STTE , useDiamond , surplusDiamond ,shopGoodsId)
{
    var tempObj = this.getObjDoRefresh( Consts.STATISTICS.DAILY ,Consts.DAILY_STATISTICE.USE_DIAMOND  );
    if(!tempObj)
    {
        return;
    }
    tempObj.doRefresh( USE_DIAMOND_STTE ,useDiamond , surplusDiamond , shopGoodsId);
};

pro.refreshDailyOthers = function(OTHER_STTE,tempValue)
{
    var tempObj = this.getObjDoRefresh( Consts.STATISTICS.DAILY ,Consts.DAILY_STATISTICE.OTHER );
    if(!tempObj)
    {
        return;
    }
    tempObj.doRefresh( OTHER_STTE ,tempValue );
};

/*
* 记录注册多久后把8个装备位都装上了装备
* time：穿满所有格子时的时间点
* */
pro.refreshArmEquipFull = function( time )
{
    var tempObj = this.getObjDoRefresh( Consts.STATISTICS.PERMANENT ,Consts.PERMANENT_STATISTICE.ARM_EQUIP_FULL_TIME );
    if(!tempObj)
    {
        return;
    }
    tempObj.doRefresh( time  );
};

/*
 * 记录注册多久后把8个装备位都装上了装备
 * time：穿满所有格子时的时间点
 * */
pro.refreshNewBarrier = function( CHAPTER_TYPE , barrierId  )
{
    var tempObj = this.getObjDoRefresh( Consts.STATISTICS.PERMANENT ,Consts.PERMANENT_STATISTICE.NEW_BARRIER );
    if(!tempObj)
    {
        return;
    }
    tempObj.doRefresh( CHAPTER_TYPE , barrierId   );
};

pro.refreshPlayerBehavior = function(playerId,heroLv,time, SCENCE_ID , parameter1)
{
    var tempObj = this.getObjDoRefresh( Consts.STATISTICS.PERMANENT ,Consts.PERMANENT_STATISTICE.PLAYER_BEHAVIOR );
    if(!tempObj)
    {
        return;
    }
    tempObj.doRefresh( playerId,heroLv,time, SCENCE_ID , parameter1   );
};
module.exports = DataStatisticManager;
