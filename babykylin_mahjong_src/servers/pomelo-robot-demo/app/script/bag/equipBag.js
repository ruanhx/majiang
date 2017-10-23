/**
 * Created by kilua on 2014-12-23.
 */
var dataApi = require('../../data/dataApi'),
    Consts = require('../consts'),
    Equip = require('./equip');

var EquipBag = function(player, equips){
    this.player = player;
    this.equipsByGroupAndPos = {};
    this.load(equips);
};

var pro = EquipBag.prototype;

function makeKey(cardGroup, pos){
    return [cardGroup, pos].join('_');
}

function getEquipKey(cardGroup, itemId){
    var equipData = dataApi.equip.findById(itemId);
    return makeKey(cardGroup, equipData.pos);
}

pro.isEquip = function(itemId){
    return (itemId > Consts.EQUIP_MAX_ITEM_ID);
};

pro.canEquip = function(cardGroup, itemId){
    var equipObj = this.equipsByGroupAndPos[getEquipKey(cardGroup, itemId)];
    return (!equipObj);
};

pro.getEquipByPos = function(cardGroup, pos){
    return this.equipsByGroupAndPos[makeKey(cardGroup, pos)];
};

pro.add = function(svrEquip){
    if(!this.isEquip(svrEquip.itemId)){
        return false;
    }
    var equipData = dataApi.equip.findById(svrEquip.itemId);
    if(!equipData){
        // 无此装备数据
        return false;
    }
    var key = makeKey(svrEquip.cardGroup, equipData.pos),
        equipObj = this.equipsByGroupAndPos[key];
    if(equipObj){
        // 此位置上已有装备
        return false;
    }
    console.log('add %j', svrEquip);
    equipObj = new Equip({itemId: svrEquip.itemId, itemData: equipData, cardGroup: svrEquip.cardGroup, level: svrEquip.level});
    this.equipsByGroupAndPos[key] = equipObj;
    return true;
};

pro.load = function(svrEquips){
    var self = this;
    svrEquips = svrEquips || [];
    svrEquips.forEach(function(svrEquip){
        self.add(svrEquip);
    });
};

module.exports = EquipBag;