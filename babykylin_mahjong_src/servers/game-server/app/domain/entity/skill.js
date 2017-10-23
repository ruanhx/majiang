/**
 * Created by Administrator on 2016/3/3 0003.
 */

var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var dataApi = require('../../util/dataApi'),
    Consts = require('../../consts/consts');

var Skill = function (opts) {
    EventEmitter.call(this);

    opts = opts || {};
    this.id = opts.id;
    this.dataId = this.id;
    this.lv = opts.lv;
    this.type = opts.type;
    this.bindData();
};

util.inherits(Skill, EventEmitter);

var pro = Skill.prototype;

pro.clearSkill = function(){
    delete this.id;
    delete this.dataId;
    delete this.lv;
    delete this.type;

    delete this.data;
}

pro.bindData = function () {
    if( this.dataId > 0 ){
        this.data = dataApi.Skill.findById(this.dataId);
        if (!this.data) {
            logger.error('bindData failed!data not found!dataId = %s', this.dataId);
        }
    }
};

pro.getLevel = function () {
    return this.lv;
};

pro.getData = function () {
    return {id: this.id, lv: this.lv};
};

pro.getClientInfo = function () {
    return {id: this.id, lv: this.lv};
};

pro.levelUp = function (addLV) {
    this.lv += addLV;
    // 触发更新战斗力
    this.emit('updatePower');
};

pro.getPower = function (curHeroQuality) {
    var skillLockData = dataApi.HeroSkillLock.findById(this.type);
    if (!skillLockData) {
        return 0;
    }
    //logger.debug('###getPower id = %s, dataId = %s, curHeroQuality = %s, lv = %s, skillLockData.fight = %s, skillLockData.unlockfight = %s, skillLockData.unlockQua = %s',
    //    this.id, this.dataId, curHeroQuality, this.lv, skillLockData.fight, skillLockData.unlockfight, skillLockData.unlockQua);
    return (this.lv - 1) * skillLockData.fight + skillLockData.unlockfight * ((curHeroQuality >= skillLockData.unlockQua) ? 1 : 0);
};

pro.getSkillAdd = function () {
    if (!this.data) {
        return 0;
    }
    var curLV = this.lv;
    return _.reduce(this.data.logicEffects, function (memo, effectId) {
        var effectData = dataApi.SkillEffect.findById(effectId);
        if (effectData && effectData.type === Consts.SKILL_EFFECT.SCORE_ADD) {
            //logger.debug('###getSkillAdd memo = %s, effectRates = %s, lv add = %s', memo, effectData.effectRates, dataApi.SkillEffect.getEffectRateAddTotalByLevel(effectData, curLV));
            return memo + effectData.effectRates + dataApi.SkillEffect.getEffectRateAddTotalByLevel(effectData, curLV);
        }
        return memo;
    }, 0);
};

pro.isUnlock = function (heroQuality) {
    var unlockReqRoleQua = dataApi.HeroSkillLock.getUnlockQua( this.type );//  Consts.HERO_SKILL_UNLOCK_QUALITY[this.type - 1] || 1;
    return heroQuality >= unlockReqRoleQua;
};

//获取技能产生的hp
pro.getHp = function(quality){
    var ret = 0;
    var self = this;
    if(this.isUnlock(quality)){
        this.data.logicEffects.forEach(function(effectId){
            var effectData = dataApi.SkillEffect.findById(effectId);
            if (effectData && effectData.type === Consts.SKILL_EFFECT.HP_ADD) {
                ret = ret + effectData.effectValues + dataApi.SkillEffect.getEffectValueAddTotalByLevel(effectData, self.lv) * (self.lv - 1) ;
            }
        });
    }
    return ret;
}

//获取技能产生的hpRate
pro.getHpRate = function(quality){
    var ret = 0;
    var self = this;
    if(this.isUnlock(quality)){
        this.data.logicEffects.forEach(function(effectId){
            var effectData = dataApi.SkillEffect.findById(effectId);
            if (effectData && effectData.type === Consts.SKILL_EFFECT.HP_ADD) {
                ret = ret + effectData.effectRates + dataApi.SkillEffect.getEffectRateAddTotalByLevel(effectData, self.lv) * (self.lv - 1);
            }
        });
    }
    return ret;
}

//获取技能产生的atk
pro.getAtk = function(quality){
    var ret = 0;
    var self = this;
    if(this.isUnlock(quality)){
        this.data.logicEffects.forEach(function(effectId){
            var effectData = dataApi.SkillEffect.findById(effectId);
            if (effectData && effectData.type === Consts.SKILL_EFFECT.ATK_ADD) {
                ret = ret + effectData.effectValues + dataApi.SkillEffect.getEffectValueAddTotalByLevel(effectData, self.lv) * (self.lv - 1) ;
            }
        });
    }
    return ret;
}

//获取技能产生的atkRate
pro.getAtkRate = function(quality){
    var ret = 0;
    var self = this;
    if(this.isUnlock(quality)){
        this.data.logicEffects.forEach(function(effectId){
            var effectData = dataApi.SkillEffect.findById(effectId);
            if (effectData && effectData.type === Consts.SKILL_EFFECT.ATK_ADD) {
                ret = ret + effectData.effectRates + dataApi.SkillEffect.getEffectRateAddTotalByLevel(effectData, self.lv) * (self.lv - 1);
            }
        });
    }
    return ret;
}

//获取技能产生的全属性增加值
pro.getTotalAddValue = function(quality){
    var ret = 0;
    var self = this;
    if(this.isUnlock(quality)){
        this.data.logicEffects.forEach(function(effectId){
            var effectData = dataApi.SkillEffect.findById(effectId);
            if (effectData && effectData.type === Consts.SKILL_EFFECT.TOTAL_ADD) {
                ret = ret + effectData.effectValues + dataApi.SkillEffect.getEffectValueAddTotalByLevel(effectData, self.lv) * (self.lv - 1) ;
            }
        });
    }
    return ret;
}

//获取技能产生的全属性增加百分比
pro.getTotalAddRate = function(quality){
    var ret = 0;
    var self = this;
    if(this.isUnlock(quality)){
        this.data.logicEffects.forEach(function(effectId){
            var effectData = dataApi.SkillEffect.findById(effectId);
            if (effectData && effectData.type === Consts.SKILL_EFFECT.TOTAL_ADD) {
                ret = ret + effectData.effectRates + dataApi.SkillEffect.getEffectRateAddTotalByLevel(effectData, self.lv) * (self.lv - 1);
            }
        });
    }
    return ret;
}

module.exports = Skill;