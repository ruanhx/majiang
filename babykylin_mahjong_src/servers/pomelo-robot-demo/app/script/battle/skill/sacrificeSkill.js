/**
 * Created by kilua on 14-8-30.
 */

var util = require('util');

var Skill = require('./skill'),
    Consts = require('../../consts'),
    Hit = require('../report/hit'),
    Sacrifice = require('../buffer/sacrifice');

var SacrificeSkill = function(opts){
    Skill.call(this, opts);
};

util.inherits(SacrificeSkill, Skill);

var pro = SacrificeSkill.prototype;

pro.getHpEffectVal = function(user, target){
    return -1 * Math.floor( user.getAtk() * Math.max(0, this.getHurtCoeByRace(target.race)) +
        this.getHurtValByRace(target.race) + user.getMaxHP() * Math.max(0, this.param1) );
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
    // 处理技能效果
    buf = new Sacrifice(target, user, this, tick);
    target.addBuf(buf, tick, act, function(rmBufIds, effects){
        hitData.rmBufIds = rmBufIds;
        hitData.addBuff(buf.id, buf.skill.id, 0, effects);
    });
    console.log('user %s skill %s target %s', user.entityId, this.id, target.entityId);
    return beforeReturn(target, hitData);
};

module.exports = SacrificeSkill;