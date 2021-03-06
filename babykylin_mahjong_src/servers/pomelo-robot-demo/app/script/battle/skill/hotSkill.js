/**
 * Created by kilua on 14-8-6.
 */

var util = require('util');

var Skill = require('./skill'),
    Consts = require('../../consts'),
    Hit = require('../report/hit'),
    Hot = require('../buffer/hot');

var HotSkill = function(opts){
    Skill.call(this, opts);
};

util.inherits(HotSkill, Skill);

var pro = HotSkill.prototype;

pro.getHitCntAddPercent = function(hitCnt){
    if(this.param1 === 0){
        return 1;
    }
    return hitCnt;
};

pro.getHpEffectVal = function(user, target, isCrit, hitCnt){
    var critBonus = isCrit ? Consts.CRIT_RATIO : 1,
        raceRestrict = 0;
    //治疗值=int( max( (攻击方攻击力 * 系数2 + 系数3) * (1 - 种族相克系数) , 1) * 暴击倍率)
    return Math.floor(Math.max((user.getAtk() * this.getHurtCoeByRace(target.race)
        + this.getHurtValByRace(target.race)) * (1 - raceRestrict), Consts.MIN_HURT) * critBonus) * this.getHitCntAddPercent(hitCnt);
};

pro.useAtTarget = function(act, user, target, tick, hitCnt){
    // 确定是否生效
    var hitData = new Hit(target.entityId),
        hpEffectVal, buf;
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
    hpEffectVal = this.getHpEffectVal(user, target, hitData.isCrit, hitCnt);
    // 处理技能效果
    buf = new Hot(target, user, this, tick, hpEffectVal);
    target.addBuf(buf, tick, act, function(rmBufIds, effects){
        hitData.rmBufIds = rmBufIds;
        hitData.addBuff(buf.id, buf.skill.id, buf.hpEffect, effects);
    });
    hitData.hp = target.hp;
    console.log('user %s skill %s target %s hpEffectVal %s', user.entityId, this.id, target.entityId, hpEffectVal);
    return beforeReturn(target, hitData);
};

module.exports = HotSkill;