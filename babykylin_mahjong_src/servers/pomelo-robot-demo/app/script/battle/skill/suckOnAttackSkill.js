/**
 * Created by kilua on 14-8-18.
 */

var util = require('util');

var Skill = require('./skill'),
    Hit = require('../report/hit'),
    SuckOnAttack = require('../buffer/suckOnAttack');

var SuckOnAttackSkill = function(opts){
    Skill.call(this, opts);
};

util.inherits(SuckOnAttackSkill, Skill);

var pro = SuckOnAttackSkill.prototype;

pro.getSuckHp = function(user, target, hurtVal){
    return Math.floor(user.getAtk() * this.getHurtCoeByRace(target.race) + this.getHurtValByRace(target.race) + hurtVal * Math.max(0, this.param1));
};

pro.useAtTarget = function(act, user, target, tick){
    // 确定是否生效
    var hitData = new Hit(target.entityId),
        buf;
    hitData.bufs.addBatch(target.getBufferInfo());
    hitData.isEffective = this.mayHit(user);

    function beforeReturn(target, hitObj){
        hitObj.hp = target.hp;
        return hitObj;
    }

    if(!hitData.isEffective){
        console.log('useAtTarget user %s skill %s target %s not effective', user.entityId, this.id, target.entityId);
        return beforeReturn(target, hitData);
    }
    // 确定是否闪避
    hitData.isDuck = this.isDuck(user, target);
    if(hitData.isDuck){
        console.log('useAtTarget user %s skill %s target %s duck!', user.entityId, this.id, target.entityId);
        return beforeReturn(target, hitData);
    }

    // 处理技能效果
    buf = new SuckOnAttack(target, user, this, tick);
    target.addBuf(buf, tick, act, function(rmBufIds){
        hitData.rmBufIds = rmBufIds;
        hitData.addBuff(buf.id, buf.skill.id);
    });
    console.log('useAtTarget user %s skill %s target %s', user.entityId, this.id, target.entityId);
    return beforeReturn(target, hitData);
};

module.exports = SuckOnAttackSkill;