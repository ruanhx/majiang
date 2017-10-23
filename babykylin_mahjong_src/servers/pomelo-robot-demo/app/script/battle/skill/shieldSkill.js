/**
 * Created by kilua on 14-8-28.
 */

var util = require('util');

var Skill = require('./skill'),
    Consts = require('../../consts'),
    Hit = require('../report/hit'),
    Shield = require('../buffer/shield');

var ShieldSkill = function(opts){
    Skill.call(this, opts);
};

util.inherits(ShieldSkill, Skill);

var pro = ShieldSkill.prototype;

pro.getHpEffectVal = function(user, target){
    //生命值=施法者攻击力X%+X固定值+施法者生命上限X%+自身生命上限X%(在复活时计算)
    return Math.floor(user.getAtk() * Math.max(0, this.getHurtCoeByRace(target.race)) + this.getHurtValByRace(target.race) +
        user.getMaxHP() * Math.max(0, this.param1) + target.getMaxHP() * Math.max(0, this.param2));
};

pro.useAtTarget = function(act, user, target, tick){
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
    // 计算各种效果
    hpEffectVal = this.getHpEffectVal(user, target);
    // 处理技能效果
    buf = new Shield(target, user, this, tick, hpEffectVal);
    target.addBuf(buf, tick, act, function(rmBufIds, effects){
        hitData.rmBufIds = rmBufIds;
        hitData.addBuff(buf.id, buf.skill.id, buf.hpEffect, effects);
    });
    hitData.hp = target.hp;
    console.log('user %s skill %s target %s hpEffectVal %s', user.entityId, this.id, target.entityId, hpEffectVal);
    return beforeReturn(target, hitData);
};

module.exports = ShieldSkill;