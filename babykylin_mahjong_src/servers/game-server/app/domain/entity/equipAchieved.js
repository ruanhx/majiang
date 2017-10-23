/**
 * Created by tony on 2016/8/5.
 */
var util = require('util'),
    Consts = require('../../consts/consts'),
    EventEmitter = require('events').EventEmitter;

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var dataApi = require('../../util/dataApi'),
    dataUtils = require('../../util/dataUtils'),
    Persistent = require('../persistent');

/*
 * 洗练数据
 * **/
var EquipAchievedItem = function ( player ) {
    Persistent.call(this, {});
    this.player = player;
    this.playerId =  this.player.id;
    this.data = {};
};
util.inherits(EquipAchievedItem, Persistent);
EquipAchievedItem.prototype.clearEquipAchievedItem = function(){
    delete this.player;
    delete this.playerId;
    delete this.data;
}

EquipAchievedItem.prototype.load = function( dbData )
{
    this.id = dbData.id;
    this.type = dbData.type;
    this.value = dbData.value;
    this.bindData();
}

EquipAchievedItem.prototype.bindData = function () {
    var data = dataApi.EquipWashAdd.findById(this.id);
    if (!data) {
        logger.error('bindData id %s not found in table [EquipWashAchieved]', this.id);
    }
    this.data = data || {};
};

EquipAchievedItem.prototype.refresh = function(id)
{
    this.id = id;
    this.type = this.data.type;
    this.value = this.data.value;
    this.bindData();
    this.save();
}
EquipAchievedItem.prototype.getClientInfo = function()
{
    return {
        id:this.data.id,
        type:this.data.type,
        value:this.data.value
    };
}
EquipAchievedItem.prototype.getData = function()
{
    return {
        playerId:this.playerId,
        id:this.data.id,
        type:this.data.type,
        value:this.data.value
    };
};

EquipAchievedItem.prototype.save = function()
{
   this.player.emit("equipAchieved.save",this.getData() );
}
module.exports.EquipAchievedItem = EquipAchievedItem;
//============================================================================================================================================================================================================
//                      =====================================================================================================================================================
//============================================================================================================================================================================================================
/*
 * 洗练数据
 * **/
var EquipAchievedMG = function ( dbList ,player ) {
    Persistent.call(this, {});
    this.list = {};
    this.player = player;
    var self = this;

    dbList.forEach( function( dbData ){
        var id = dbData.id;
        var key = dbData.type+"_"+dbData.value;
        self.list[key] = new EquipAchievedItem(  self.player );
        self.list[key].load( dbData );
    } );
};
util.inherits(EquipAchievedMG, Persistent);

EquipAchievedMG.prototype.clearEquipAchieved = function(){

    for(var key in this.list){
        var achievedItem = this.list[key];
        achievedItem.clearEquipAchievedItem();
        delete this.list[key];
    }
    delete this.list;

    delete this.player;

    this.removeAllListeners();
}

EquipAchievedMG.prototype.getClientInfo = function()
{
    return _.map(this.list, function (washAchieved) {
        return washAchieved.getClientInfo();
    });
}
EquipAchievedMG.prototype.getKey = function( id )
{
    logger.debug("id = %s ", id )
    var data = dataApi.EquipWashAdd.findById(id);
    logger.debug("data = %j ", data )
    var key = data.type+"_"+data.value;
    return key;
};


/*
* 是否可以激活
* **/
EquipAchievedMG.prototype.getIsCanAchieved = function( id )
{
    this.data = dataApi.EquipWashAdd.findById(id);
    var needOpenCnt =  this.data.conditionNum;
    var currCnt = 0;
    if( this.data.type == Consts.EQUIP_ACHIEVED_TYPE.OPEN_WASH_CNT )
    {
        currCnt =  this.player.equipWashAll.getOpenLength();
    }
    else if( this.data.type == Consts.EQUIP_ACHIEVED_TYPE.OPEN_WASH_CNT )
    {
        currCnt =  this.player.equipWashAll.getOpenWashPropLength();
    }
    return needOpenCnt <= currOpenCnt;
};

//是否有至少激活过一次
EquipAchievedMG.prototype.IsOpened = function( id )
{
    var key = this.getKey(id);
    return this.list[key] != null;
}

EquipAchievedMG.prototype.refresh = function( id )
{
    var key = this.getKey(id);
    if( !this.IsOpened(id))
    {
        this.list[key] = new EquipAchievedItem(this.player);
    }
    this.list[key].refresh(id);
}

module.exports.EquipAchievedMG = EquipAchievedMG;