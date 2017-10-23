/**
 * Created by tony on 2016/7/19.
 */
var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var dataApi = require('../../util/dataApi'),
    dataUtils = require('../../util/dataUtils'),
    Persistent = require('../persistent');
  //  equipWash = require('./equipWash');


/*
 * 洗练数据
 * **/
var EquipWashAll = function (washLish ,player) {
    Persistent.call(this, {});
    //一共有8组
    this.groupData = {};
    this.player = player;
    var self = this;
    washLish.forEach( function(wash){
        var part = wash.part;
        var pos = wash.pos;
        self.groupData[part] = self.groupData[part] || new EquipWashGroup( self.player);
        self.groupData[part].add(wash);
    } );
};
util.inherits(EquipWashAll, Persistent);
EquipWashAll.prototype.clearEquipWashAll=function(){
    delete this.player;

    for(var key in this.groupData){
        var chapter = this.groupData[key];
        chapter.clearEquipWashGroup();
        delete this.groupData[key];
    }
    delete this.groupData;
}
/*
 * 创建一组洗练数据 (在激活的时候用到)
 * **/
EquipWashAll.prototype.add=function( wash )
{
    // var wash = _.sample(washList)
    var part = wash.part;
    this.groupData[part] =this.groupData[part] || new EquipWashGroup( this.player );
    this.groupData[part].add( wash );
};

EquipWashAll.prototype.getLength = function(part)
{
    return   this.groupData[part] == null  ?  0 :  this.groupData[part].getLength();
};

/*
* 已开启的洗练格子总数
* **/
EquipWashAll.prototype.getOpenLength = function()
{
    return _.size( this.groupData );
};

/*
 * 已开启的洗练属性条数
 * **/
EquipWashAll.prototype.getOpenWashPropLength = function()
{
    return this.getOpenLength() * 3;
};

EquipWashAll.prototype.getIsOpen = function(part)
{
    return   this.groupData[part] == null;
};

/*
 * 刷新洗练数据
 * **/
EquipWashAll.prototype.refreshWashList = function ( part ) {
    var tempWashGroup = this.groupData[part];
    var washList = [];
    for(var i = 0 ; i < 3 ; ++i )
    {
        //锁定的不进行洗练
        if( tempWashGroup ==null  || tempWashGroup.getLockState(i)  != 1)
        {
            var wash =  this.randValue( part , i );
            this.add(wash);
            washList.push( wash.getClientInfo() );
        }
    }

    var slot = this.player.armBag.getSlotByPart(part);
    slot.wash();
    return washList;
};

/*
* 如果是小数则 且 没传bitNum 取三位有效小数随机
*
* **/
EquipWashAll.prototype.GetRandValue=function( min,max,bitNum )
{
    var str = min.toString();
    var strList = str.split('.');
    var n = 0;
    if( strList.length==2 )
    {
        n = 3;
        //strList[1].length;
    }
    bitNum = bitNum|| Math.pow(10,n);

    min = min * bitNum;
    max = max * bitNum;
    var value =  _.random(min ,max) / bitNum ;
    return value;
}

/*
 * 随机洗练数据随机
 * **/
EquipWashAll.prototype.randValue = function ( part ,pos ) {
    var washCnt = this.player.armBag.getWashCntByPart(part);
    var washTypeIdList =[];
    if(null != this.groupData[part] )
    {
        washTypeIdList = this.groupData[part].getTypeIdList();
    }

    //策划表数据
    var  rowWash = dataApi.EquipWash.randOneData(washCnt, washTypeIdList);

    //条件
    var  cond   = 0;
    //效果
    var  effect = 0;

    if( rowWash.superNeedTime <= washCnt )
    {
        //随机极品
        var randSuperProbability =  this.GetRandValue(0,1,10000);
        //表示随机到极品
        if( randSuperProbability<= rowWash.superProbability  )
        {
            //效果
            if( rowWash.kinds == 1 )
            {
                cond = this.GetRandValue( rowWash.typeMin,rowWash.typeMax );
                effect = this.GetRandValue( rowWash.superMin,rowWash.superMax );

            }
            //条件
            else if( rowWash.kinds == 2 )
            {
                cond = this.GetRandValue( rowWash.superMin,rowWash.superMax);
                effect =this.GetRandValue( rowWash.effectMin,rowWash.effectMax );
            }
        }
        else
        {
            cond = this.GetRandValue(rowWash.typeMin, rowWash.typeMax);
            effect =this.GetRandValue(rowWash.effectMin, rowWash.effectMax);
        }
    }
    else
    {
        cond = this.GetRandValue(rowWash.typeMin, rowWash.typeMax);
        effect = this.GetRandValue(rowWash.effectMin, rowWash.effectMax);
    }

    //概率
    var  prob   = this.GetRandValue( rowWash.probabilityMin,rowWash.probabilityMax );

    var wash = {};
    wash.cond = cond;
    wash.prob = prob;
    wash.effect = effect;
    wash.pos = pos;
    wash.part = part;
    wash.lockState = 0;
    wash.id = rowWash.id;
    this.groupData[part] =this.groupData[part] || new EquipWashGroup(this.player);
    var equipWash = this.groupData[part].add( wash );
    equipWash.save();
    return equipWash;
};

EquipWashAll.prototype.getClientInfo = function () {
     return _.flatten(  _.map(this.groupData, function (item) {
         return item.getClientInfo();
     }) );
};

EquipWashAll.prototype.setLockState = function( part , pos , lockState )
{
    if( null == this.groupData[part] )
    {
        return null;
    }
    return this.groupData[part].setLockState( pos , lockState);
};

EquipWashAll.prototype.getLockState = function( part , pos  )
{
    if( null == this.groupData[part] )
    {
        return 0;
    }
    return this.groupData[part].getLockState( pos );
};

EquipWashAll.prototype.getLockCnt = function(part)
{
    if( null == this.groupData[part] )
    {
        return 0;
    }
    return this.groupData[part].getLockCnt();
}

module.exports.EquipWashAll = EquipWashAll;

//===================================================组=====================================================================
/*
* 洗练数据
 * **/
var EquipWashGroup = function (player) {
    Persistent.call(this, {});
    this.player = player;
    this.washList = {};
};
EquipWashGroup.prototype.clearEquipWashGroup= function(){
    delete this.player;

    for(var key in this.washList){
        var wash = this.washList[key];
        wash.clearWash();
        delete this.washList[key];
    }
    delete this.washList;
}

EquipWashGroup.prototype.getTypeIdList= function()
{
    var washTypeIdList = [];
    _.each(this.washList, function(washObj){
        washTypeIdList.push( washObj.data.washType);
    });
    return washTypeIdList;
}

EquipWashGroup.prototype.getLength= function()
{
    return this.washList.length;
}
/*
 * 添加或者刷新一条洗练
 * **/
EquipWashGroup.prototype.add = function(wash){
    var part = wash.part;
    var pos = wash.pos;
    this.washList[pos] =this.washList[pos] || new EquipWash(this.player);
    return this.washList[pos].add(wash);
};

EquipWashGroup.prototype.setLockState = function(  pos , lockState )
{
    return this.washList[pos].setLockState( lockState );
};

EquipWashGroup.prototype.getLockState = function(  pos  )
{
    return this.washList[pos].getLockState();
};

/*
 * 通过部位获取当前部位锁定的洗练条数
 * **/
EquipWashGroup.prototype.getLockCnt = function()
{
    var washList =  this.washList;
    var lockCnt = 0;
    _.map(washList,function(wash){
        if( wash.lockState == 1 )
        {
            ++lockCnt;
        }
    });
    return lockCnt;
};

/*
 * 是否激活洗练
 * **/
EquipWashGroup.prototype.isOpen = function () {
    if( null!=this.washList )
    {
        return this.washList.length>0 ;
    }
    return false;
};

EquipWashGroup.prototype.getClientInfo = function () {
    return _.map(this.washList, function (item) {
        return item.getClientInfo();
    });
};

//======================================================================================================================
var EquipWash = function (player) {
    EventEmitter.call(this);
    this.player = player;
    this.playerId = player.id;
};

util.inherits(EquipWash, EventEmitter);
module.exports.EquipWash = EquipWash;
EquipWash.prototype.clearWash = function(){
    delete this.player;
    delete this.playerId;
}

EquipWash.prototype.add=function( equipWashData )
{
    this.pos = equipWashData.pos;
    this.part = equipWashData.part;
    this.id =  equipWashData.id;
    this.lockState = equipWashData.lockState;
    this.cond = equipWashData.cond;
    this.prob = equipWashData.prob;
    this.effect = equipWashData.effect;

    this.data = dataApi.EquipWash.findById( this.id);
    return this;
};
/*
 * 获取洗练数据
 * **/
EquipWash.prototype.getClientInfo = function () {
    return {
        pos: this.pos,
        part: this.part,
        id : this.id,
        lockState: this.lockState,
        cond: this.cond,
        prob: this.prob,
        effect: this.effect
    };
};
EquipWash.prototype.getData = function () {
    return {
        playerId: this.playerId,
        pos: this.pos,
        part: this.part,
        id : this.id,
        lockState: this.lockState,
        cond: this.cond,
        prob: this.prob,
        effect: this.effect
    };
};

/*
 * 刷新已有的洗练数据
 * **/
EquipWash.prototype.refresh = function( wash )
{
    this.id = wash.id; //策划表唯一id
    this.pos= wash.pos,//位置
    this.part= wash.part,//位置
    this.lockState = wash.lockState;//锁定状态
    this.cond =  wash.cond;//条件
    this.prob =  wash.prob;//概率
    this.effect =  wash.effect;//效果
};

EquipWash.prototype.setLockState = function(  lockState )
{
    this.lockState = lockState;
    this.save();
    return this;
};

EquipWash.prototype.getLockState = function()
{
    return  this.lockState;
};

EquipWash.prototype.save = function()
{
    this.player.emit("equipWash.save",this.getData());
}
