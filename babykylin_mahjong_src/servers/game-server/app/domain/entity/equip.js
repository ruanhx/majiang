/**
 * Created by kilua on 2016/6/30 0030.
 */

var util = require('util');

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var dataApi = require('../../util/dataApi'),
    dataUtils = require('../../util/dataUtils'),
    Persistent = require('../persistent');

var Equip = function (equipData) {
    Persistent.call(this, {});
    equipData = equipData || {};
    this.playerId = equipData.playerId;
    this.pos = equipData.pos;
    this.dataId = equipData.equipId;
    this.lv = equipData.lv;
    this.quality = equipData.quality;
    this.isNew = equipData.isNew;
    this.bindData();
};

util.inherits(Equip, Persistent);

var pro = Equip.prototype;
pro.clearEquip = function(){
    delete this.playerId;
    delete this.pos;
    delete this.dataId;
    delete this.lv;
    delete this.quality;
    delete this.isNew;

    if(!!this.data){
        delete this.data;
    }
    this.removeAllListeners();
}

pro.checkInitLV = function () {
    // 获得装备时，随机固化一个强化等级
    if (!this.lv) {
        this.lv = _.random(this.data.lowlv, this.data.toplv);
        var randNum = _.random(0,100)*0.01;
        this.quality =dataUtils.getIndexByGroup(this.data.qualityRates,randNum);
    }
};

pro.bindData = function () {
    var equipData = dataApi.Equip.findById(this.dataId);
    if (!equipData) {
        logger.error('bindData id %s not found in table [Equip]', this.dataId);
    }
    this.data = equipData || {};
    this.checkInitLV();
};

/*
* 装备品质
* */
pro.getQuality = function()
{
    if( !!this.quality)
    {
        return this.quality;
    }
    return 1;
};

pro.getData = function () {
    return {
        playerId: this.playerId,
        pos: this.pos,
        dataId: this.dataId,
        lv: this.lv,
        quality: this.getQuality(),
        isNew : this.isNew
    };
};

pro.getClientInfo = function () {
    return {
        pos: this.pos,
        dataId: this.dataId,
        lv: this.lv,
        quality: this.getQuality(),
        isNew : this.isNew
    };
};

pro.getLevel = function () {
    return this.lv;
};

pro.getPart = function () {
    return this.data.part;
};

/*
 *   生命上限
 *   equipRefineLevel:装备精炼等级
 * */
pro.getMaxHP = function (wakeupData,equipRefineLevel,strengthenLV) {
    if(!wakeupData) return 0;
    // 生命上限=初始生命+生命成长*（等级-1）
    var basicHp = this.data.basichp || 0,
        hpUp = this.data.hpgrow || 0,
        strengthenHpGrow = this.data.strengthenHpGrow || 0,
        starAllAdd = wakeupData.starAllAdd || 0,
        allAdd = wakeupData.allAdd || 0;
    if (this.getPart() < 4) {
        // 攻击装备，生命觉醒加成修正为0
        starAllAdd = 0;
        allAdd = 0;
    }
    var Equip_QualityAdd = dataUtils.getEquipQuaAdd( this.getQuality()  );
    return( (basicHp + hpUp * equipRefineLevel + strengthenHpGrow * strengthenLV) * (1 + starAllAdd) + allAdd );// * Equip_QualityAdd;//无用了，注释掉，咨询包凯
};

/*
 *   攻击值
 * */
pro.getAtk = function (wakeupData,equipRefineLevel,strengthenLV) {
    if(!wakeupData) return 0;
    // 攻击值=初始攻击+攻击成长*（等级-1）
    var basicAtk = this.data.basicatk || 0,
        atkUp = this.data.atkgrow || 0,
        strengthenAtkGrow = this.data.strengthenAtkGrow || 0,
        starAllAdd = wakeupData.starAllAdd || 0,
        allAdd = wakeupData.allAdd || 0;
    if (this.getPart() >= 4) {
        // 生命装备，攻击觉醒加成修正为0
        starAllAdd = 0;
        allAdd = 0;
    }
    var Equip_QualityAdd = dataUtils.getEquipQuaAdd( this.getQuality()  );
    return( (basicAtk + atkUp * equipRefineLevel + strengthenAtkGrow * strengthenLV) * (1 + starAllAdd) + allAdd );// * Equip_QualityAdd;
};

pro.getPower = function (wakeupData,equipRefineLevel,strengthenLV) {
    if(!wakeupData) return 0;
    //战力=装备生命*生命战力系数+装备攻击*攻击战力系数
    // logger.debug('getPower pos = %s, lv = %s, dataId = %s, addPer = %j, getMaxHP = %s, getAtk = %s', this.pos, this.lv, this.dataId, wakeupData, this.getMaxHP(wakeupData), this.getAtk(wakeupData));
    return this.getMaxHP(wakeupData,equipRefineLevel,strengthenLV) * dataUtils.getOptionValue('Battle_hpfight', 0.2) + this.getAtk(wakeupData,equipRefineLevel,strengthenLV) * dataUtils.getOptionValue('Battle_atkfight', 1);
};

/*
 *   吃掉这个装备精炼时，需要消耗的金币
 * */
pro.getRefineGold = function () {
    return  Math.ceil(dataUtils.getOptionValue('equip_refineCostMoney', 100) * this.data.refine);
};

pro.getRefineExp = function () {
    return this.data.refine;
};

/*
 *   熔炼装备可以获得的熔炼值
 * */
pro.getMeltPoint = function () {
    return this.data.melting;
};
/*
 *   熔炼之后，获得新装备id，不获得装备时，返回0
 * */
pro.getMeltNewEquip = function () {
    if (Math.random() < this.data.meprobability) {
        // 可以获得新装备
        var randVal = Math.random();
        if (randVal < this.data.probability1) {
            return this.data.reward1;
        }
        return this.data.reward2;
    }
    return 0;
};

module.exports = Equip;
