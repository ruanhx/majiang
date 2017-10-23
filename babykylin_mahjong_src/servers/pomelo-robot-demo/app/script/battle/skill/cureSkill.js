/**
 * Created by kilua on 14-7-24.
 */

var util = require('util');

var Skill = require('./skill'),
    Consts = require('../../consts'),
    Hit = require('../report/hit');

var CureSkill = function(opts){
    Skill.call(this, opts);

};

util.inherits(CureSkill, Skill);

var pro = CureSkill.prototype;

pro.getHpEffectVal = function(user, target, isCrit, hitCnt){
    var critBonus = isCrit ? Consts.CRIT_RATIO : 1,
        raceRestrict = 0;
    //治疗值=int( max( (攻击方攻击力 * 系数2 + 系数3) * (1 - 种族相克系数) , 1) * 暴击倍率)
    return Math.floor(Math.max((user.getAtk() * this.getHurtCoeByRace(target.race) +
    this.getHurtValByRace(target.race)) * (1 - raceRestrict), Consts.MIN_HURT) * critBonus);
};

pro.useAtTarget = function(act, user, target){
    // 确定是否生效
    var hitData = new Hit(target.entityId),
        hpEffectVal;
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
    // 计算各种效果
    hpEffectVal = this.getHpEffectVal(user, target, hitData.isCrit);

    // 处理技能效果
    target.setHp(target.hp + hpEffectVal);

    // 添加各种效果
    hitData.addEffect(target.entityId, 'hp', hpEffectVal);
    console.log('user %s skill %s target %s hpEffectVal %s', user.entityId, this.id, target.entityId, hpEffectVal);
    return beforeReturn(target, hitData);
};

module.exports = CureSkill;