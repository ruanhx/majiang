/**
 * Created by employee11 on 2016/3/2.
 * 简单背包，物品不可堆叠
 */

var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var _ = require('underscore');

var consts = require('../../consts/consts');

var SimpleBag = function (opts) {
    opts = opts || {};

    EventEmitter.call(this);
    this.maxBagCount = opts.maxSlot || consts.BAG_MAX_SLOT;
    this.load(opts.BagData, opts.createItem);
};

util.inherits(SimpleBag, EventEmitter);

var pro = SimpleBag.prototype;

pro.clearHeroBag = function(){
    for(var key in this.bagInfo){
        var hero = this.bagInfo[key];
        hero.clearHero();
        delete this.bagInfo[key];
    }
    delete this.bagInfo;
    this.removeAllListeners();
}
pro.clearPetBag = function(){
    for(var key in this.bagInfo){
        var pet = this.bagInfo[key];
        pet.clearPet();
        delete this.bagInfo[key];
    }
    delete this.bagInfo;
    this.removeAllListeners();
}
pro.clearEquipBag = function(){
    for(var key in this.bagInfo){
        var equip = this.bagInfo[key];
        equip.clearEquip();
        delete this.bagInfo[key];
    }
    delete this.bagInfo;
    this.removeAllListeners();
}

pro.load = function (slots, createItem) {
    var self = this;
    self.bagInfo = {};
    slots = slots || [];
    slots.forEach(function (slot) {
        self.bagInfo[slot.pos] = createItem(slot.posInfo);
    });
};

/*
 *   背包是否有空格
 * */
pro.getEmptySlotCnt = function () {
    // var emptySlotCnt = 0;
    var usedCnt =  _.keys(this.bagInfo).length;
    // for (var i = 1; i <=this.maxBagCount; i++) {
    //     if (!this.bagInfo[i]) {
    //         emptySlotCnt++;
    //     }
    // }
    return this.maxBagCount - usedCnt;
};

pro.isFull = function () {
    return (this.getEmptySlotCnt() === 0);
};

pro.getEmptySlot = function () {
    for (var i = 1; i <= this.maxBagCount; i++) {
        if (!this.bagInfo[i]) {
            return i;
        }
    }

    return 0;
};

/*
 *   添加物品
 * */
pro.add = function (item) {
    if (!item) {
        return 0;
    }
    var emptySlot = this.getEmptySlot();
    if (emptySlot) {
        item.pos = emptySlot;
        this.bagInfo[emptySlot] = item;
        this.emit('update', item);
        return emptySlot;
    }
    return 0;
};

/*
 *   删除物品
 * */
pro.remove = function (index) {
    if (!this.bagInfo[index]) {
        return false;
    }
    this.emit('remove', this.bagInfo[index]);
    delete this.bagInfo[index];
    return true;
};

pro.removeByPosList = function (posList) {
    var self = this;
    posList = posList || [];
    posList.forEach(function (pos) {
        self.remove(pos);
    });
};

/*
 *   组织下发给客户端的数据
 * */
pro.getClientInfo = function () {
    return _.map(this.bagInfo, function (item) {
        return item.getClientInfo();
    });
};

/*
 *   根据格子查找物品
 * */
pro.getItemByPos = function (pos) {
    return this.bagInfo[pos];
};

/**
 * 装备poslist是否存在
 * */
pro.getItemByPosList = function(posList){
    _.each(posList,function (pos) {
        if(!this.getItemByPos(pos)){
            return false
        }
    });
    return true;
};

/*
 *   获取物品列表
 * */
pro.getItemList = function () {
    return _.values(this.bagInfo);
};

pro.forEach = function (cb) {
    _.each(this.bagInfo, cb);
};

pro.clear = function () {
    var self = this;
    _.each(self.bagInfo, function (item, pos) {
        self.remove(pos);
    });
};

pro.filter = function (predicate) {
    return _.filter(this.bagInfo, predicate);
};

//通过参数是否有找到数据
pro.isFindData = function( needCnt , qua  , roleType)
{
    if(!qua )
    {
        return false;
    }
    var self = this;
    var currCnt  = 0;
    _.each(self.bagInfo, function (item, pos) {
        if(item.quality>=qua)
        {
            if(roleType === consts.HERO_TYPE.ANY || roleType === item.data.roleType)
                currCnt += 1;
        }
    });

    return currCnt;
};
/**
 * 符合等级要求的猎魔人数量
 * @param needLv
 * @param roleType
 * @returns {number}
 */
pro.isFindDataByLevel = function( needLv, roleType)
{
    var self = this;
    var currCnt  = 0;
    _.each(self.bagInfo, function (item, pos) {
        if(item.curLevel>=needLv)
        {
            if(roleType === consts.HERO_TYPE.ANY || roleType === item.data.roleType)
                currCnt += 1;
        }
    });

    return currCnt;
};

/*
* heroId不同的英雄数量
* roleType：为空时表示不分类型、不为空时按照类型返回相应的数据
* */
pro.getHeroIdDiffHeroCnt=function( roleType )
{
    var tempList = {};
    var self = this;
    _.each(self.bagInfo, function (item) {
        if( !roleType || (!!roleType &&  roleType == item.data.roleType) )
        {
            if( !tempList[item.roleId] )
            {
                tempList[item.roleId] = item.roleId;
            }
        }
    });
    return _.size(tempList);
};

/*
 *   清除new状态
 * */
pro.clearNew = function (index) {
    if (this.bagInfo[index]) {
        this.bagInfo[index].isNew = 0;
        this.emit('update', this.bagInfo[index]);
    }
};

module.exports = SimpleBag;