/**
 * Created by kilua on 14-7-23.
 */

/*
*   普通伤害技能
* */
var util = require('util');

var Skill = require('./skill'),
    Consts = require('../../consts'),
    Hit = require('../report/hit');

var HurtSkill = function(opts){
    Skill.call(this, opts);

};

util.inherits(HurtSkill, Skill);

var pro = HurtSkill.prototype;

pro.getHpEffectVal = function(user, target, isCrit, hitCnt){
    var critBonus = isCrit ? Consts.CRIT_RATIO : 1,
        raceRestrict = Consts.RACE_RESTRICT_MAP[user.race][target.race] * Consts.RACE_RESTRICTION;
    console.log('user entityId = %s, addTotal = %j, growAtk = %s, race = %s, pow = %s, growPow = %s, user.getValK() = %s' +
        ' IQ = %s, growIQ = %s, agi = %s, growAgi = %s, atkRatio = %s, getAtk() = %s',
        user.entityId, user.addTotal, user.growAtk, user.race, user.pow, user.growPow, user.getValK(), user.IQ,
        user.growIQ, user.agi, user.growAgi, user.atkRatio, user.getAtk());
    console.log('skill id = %s raceRestrict = %s, critBonus = %s, getHurtCoeByRace() = %s, getHurtValByRace() = %s',
        this.id, raceRestrict, critBonus, this.getHurtCoeByRace(target.race), this.getHurtValByRace(target.race));
    console.log('target entityId = %s, race = %s, growDef = %s, defRatio = %s, growAgi = %s, agi = %s,' +
        ' getDecHurtPercent() = %s', target.entityId, target.race, target.growDef, target.defRatio, target.growAgi,
        target.agi, target.getDecHurtPercent(user.getValK()));
    //int(max((攻击方攻击力 * 技能表"对应种族伤害百分比数值"字段数值 + 技能表"对应种族伤害固定数值"字段数值) *(1 + 种族相克系数) - 受击方防御力 , 1) * 暴击倍率)
    return -1 * Math.floor(Math.max((user.getAtk() * this.getHurtCoeByRace(target.race) +
            this.getHurtValByRace(target.race)) * (1 + raceRestrict) * (1 - target.getDecHurtPercent(user.getValK())),
            Consts.MIN_HURT) * critBonus);
};

pro.useAtTarget = function(act, user, target, tick, hitCnt){
    // 确定是否生效
    var hitData = new Hit(target.entityId),
        hpEffectVal, adjustCDBuffs, suckBuffs, csEffects;
    hitData.bufs.addBatch(target.getBufferInfo());
    hitData.isEffective = this.mayHit(user);

    function beforeReturn(target, hitObj){
        hitObj.hp = target.hp;
        return hitObj;
    }

    if(!hitData.isEffective){
        console.log('user %s skill %s target %s no effective', user.entityId, this.id, target.entityId);
        return beforeReturn(target, hitData);
    }
    // 确定是否闪避
    hitData.isDuck = this.isDuck(user, target);
    if(hitData.isDuck){
        console.log('user %s skill %s target %s duck!', user.entityId, this.id, target.entityId);
        return beforeReturn(target, hitData);
    }

    // 确定是否暴击
    if(this.ignoreCrit === 1){
        hitData.isCrit = 0;
    }else{
        hitData.isCrit = act.isCrit(user, target);
    }
    // 多人斩增加属性
    user.buffMgr.addMultiCutProps(hitCnt);
    // 计算各种效果
    hpEffectVal = this.getHpEffectVal(user, target, hitData.isCrit);
    console.log('useAtTarget 原始效果 hpEffectVal = %s', hpEffectVal);
    // 移除多人斩效果
    user.buffMgr.clearMultiCutProps();
    // 多倍伤害效果
    hpEffectVal = user.buffMgr.getMultiHurt(hpEffectVal);
    // 追击效果
    if(target.buffMgr.haveNegativeBuff()){
        hpEffectVal = user.buffMgr.getPursueFinalHurt(hpEffectVal);
        console.log('useAtTarget 追击效果 %s', hpEffectVal);
    }
    hpEffectVal = user.buffMgr.getFinalHurt(hpEffectVal);
    // 各种抵消效果
    hpEffectVal = target.buffMgr.reduce(hpEffectVal);
    console.log('useAtTarget 护盾效果 %s', hpEffectVal);
    // 处理技能效果
    target.setHp(target.hp + hpEffectVal);
    target.setLastAttacker(user);
    // 添加各种效果
    hitData.addEffect(target.entityId, 'hp', hpEffectVal);
    // 其他效果
    // 反击
    csEffects = target.buffMgr.counterStrike(act.getUs(target), act.getEnemies(target), tick);
    csEffects.forEach(function(csEffect){
        hitData.addEffect(csEffect.entityId, csEffect.prop, csEffect.val);
        console.log('csEffect %s %s %s', csEffect.entityId, csEffect.prop, csEffect.val);
    });
    // 攻击吸血
    suckBuffs = user.buffMgr.getBuffsByType(Consts.SKILL_TYPE.SUCK_ON_ATTACK);
    suckBuffs.forEach(function(buff){
        var suckHp = buff.getSuckHp(Math.abs(hpEffectVal));
        user.setHp(user.hp + suckHp);
        hitData.addEffect(user.entityId, 'hp', suckHp);
        console.log('suckEffect %s hp %s', user.entityId, suckHp);
    });

    // 调整 CD buff
    adjustCDBuffs = user.buffMgr.getBuffsByType(Consts.SKILL_TYPE.ADJUST_CD_BUFF);
    adjustCDBuffs.forEach(function(buff){
        var targetSkill = user.getSkillByKind(buff.getAdjustCDTargetSkillKind()),
            cdAdjustVal = buff.getCDEffectVal(targetSkill.getLeftRestoreTime(tick));
        // 处理技能效果
        targetSkill.adjustCD(cdAdjustVal);
        // 记录技能效果，暂时这个跟 buff 的先后顺序有关
        hitData.addEffect(user.entityId, 'cd', cdAdjustVal);
        console.log('useAtTarget cdAdjustVal = %s', cdAdjustVal);
    });
    console.log('user %s skill %s target %s hpEffectVal %s hp %s bufs = %j', user.entityId, this.id, target.entityId,
        hpEffectVal, target.hp, user.buffMgr.getInfo());
    return beforeReturn(target, hitData);
};

module.exports = HurtSkill;