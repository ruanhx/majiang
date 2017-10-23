/**
 * Created by kilua on 14-9-12.
 */

var util = require('util');

var Skill = require('./skill'),
    Hit = require('../report/hit'),
    AdjustUserCD = require('../buffer/adjustUserCD'),
    utils = require('../../utils/utils');

var AdjustUserCDSkill = function(opts){
    Skill.call(this, opts);
};

util.inherits(AdjustUserCDSkill, Skill);

var pro = AdjustUserCDSkill.prototype;

pro.getAdjustPro = function(targetLV){
    var pair = utils.parseParamPair(this.param3),
        lvDiff = targetLV - this.level;
    return pair.coe * (1 - Math.max(0, lvDiff) * pair.val);
};

pro.mayAdjust = function(targetLV){
    return (this.rndManager.getSkillRndFloat(this.id, 'adjustCDPro') < this.getAdjustPro(targetLV));
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
    buf = new AdjustUserCD(target, user, this, tick);
    target.addBuf(buf, tick, act, function(rmBufIds){
        hitData.rmBufIds = rmBufIds;
        hitData.addBuff(buf.id, buf.skill.id);
    });
    console.log('useAtTarget user %s skill %s target %s', user.entityId, this.id, target.entityId);
    return beforeReturn(target, hitData);
};

module.exports = AdjustUserCDSkill;