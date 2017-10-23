/**
 * Created by kilua on 14-8-29.
 */

var util = require('util');

var Skill = require('./skill'),
    Hit = require('../report/hit'),
    CounterStrike = require('../buffer/counterStrike');

var CounterStrikeSkill = function(opts){
    Skill.call(this, opts);
};

util.inherits(CounterStrikeSkill, Skill);

var pro = CounterStrikeSkill.prototype;

pro.getHpEffectVal = function(user, target){
    //生命值=施法者攻击力X%+X固定值+施法者生命上限X%+自身生命上限X%(在复活时计算)
    return -1 * Math.floor(user.getAtk() * Math.max(0, this.getHurtCoeByRace(target.race)) + this.getHurtValByRace(target.race));
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
        console.log('useAtTarget user %s skill %s target %s not hit', user.entityId, this.id, target.entityId);
        return beforeReturn(target, hitData);
    }
    // 确定是否闪避
    hitData.isDuck = this.isDuck(user, target);
    if(hitData.isDuck){
        console.log('useAtTarget user %s skill %s target %s duck!', user.entityId, this.id, target.entityId);
        return beforeReturn(target, hitData);
    }
    // 处理技能效果
    buf = new CounterStrike(target, user, this, tick);
    target.addBuf(buf, tick, act, function(rmBufIds){
        hitData.rmBufIds = rmBufIds;
        hitData.addBuff(buf.id, buf.skill.id);
    });
    console.log('useAtTarget user %s skill %s target %s', user.entityId, this.id, target.entityId);
    return beforeReturn(target, hitData);
};

module.exports = CounterStrikeSkill;