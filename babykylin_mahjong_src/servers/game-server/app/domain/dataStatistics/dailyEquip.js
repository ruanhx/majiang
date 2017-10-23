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

var DailyEquip = function (vPlayer,vData) {
    DataStatistics.call(this,vPlayer,vData);
    this.setTimeType( Consts.STATISTICS.DAILY );
};

util.inherits(DailyEquip, DataStatistics);

var pro = DailyEquip.prototype;

pro.load = function ( dbList )
{
    var length = dbList.length;
    var self = this;
    //上阵的装备等级信息
    _.each(dbList,function(db){
        if(db.date == self.getDailyDate() )
        {
            if(!!db.equipLvInfo)
            {
                self.equipLvInfo =   JSON.parse( db.equipLvInfo) ;
            }
            if(!!db.awakeLvInfo)
            {
                self.awakeLvInfo =   JSON.parse( db.awakeLvInfo) ;
            }
            self.dailyRefineCnt = db.dailyRefineCnt;
            return;
        }
    })
    logger.debug(" dailyRefineCnt : %s",self.dailyRefineCnt );
}
/*
 *   刷新部位等级情况
 * */
pro.refreshEquipPartLv = function( part , equipLv )
{
    if( !this.equipLvInfo )
    {
        this.equipLvInfo = {};
    }
    this.equipLvInfo[part] = equipLv;
    this.save();
};

/*
 * 装备觉醒等级情况
 * */
pro.refreshAwakeLv = function( part , awakeLv )
{
    if( !this.awakeLvInfo )
    {
        this.awakeLvInfo = {};
    }
    this.awakeLvInfo[part] = awakeLv;
    this.save();
};

pro.refreshRefineCnt = function()
{
    if( this.getIsSameDay() )
    {
        this.dailyRefineCnt +=1;
    }
    this.save();
}

/*
 *  存在数据过程
 */
pro.save = function()
{
    this.player.emit('saveStteEquip', this.getData());
};

pro.doRefresh =function( EQUIP_STTE , part , tempLv )
{
    if(EQUIP_STTE == Consts.EQUIP_STTE.DAILY_EQUIP_LV )
    {
        if( _.isNull(part) || _.isNull(tempLv) )
        {
            return;
        }
        this.refreshEquipPartLv(part , tempLv);
    }
    else if(EQUIP_STTE == Consts.EQUIP_STTE.DAILY_AWAKE_LV )
    {
        if( _.isNull(part) || _.isNull(tempLv) )
        {
            return;
        }
        this.refreshAwakeLv(part , tempLv);
    }
    else if(EQUIP_STTE == Consts.EQUIP_STTE.DAILY_REFINE_CNT )
    {
        this.refreshRefineCnt();
    }
}

pro.getEquilLvInfo = function()
{
    if( !this.equipLvInfo )
    {
        return null;
    }
    return JSON.stringify(this.equipLvInfo);
}

pro.getAwakeLvInfo = function()
{
    if( !this.awakeLvInfo )
    {
        return null;
    }
    return JSON.stringify(this.awakeLvInfo);
}
/*
 *  存在数据库的数据
 */
pro.getData=function()
{
    return {
        playerId : this.player.id,
        date:this.getDailyDate(),
        equipLvInfo : this.getEquilLvInfo(),
        awakeLvInfo : this.getAwakeLvInfo(),
        dailyRefineCnt : this.dailyRefineCnt
    };
};

module.exports = DailyEquip;