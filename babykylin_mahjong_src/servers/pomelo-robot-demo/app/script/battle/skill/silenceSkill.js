/**
 * Created by kilua on 14-9-2.
 */

var util = require('util');

var Skill = require('./skill'),
    Hit = require('../report/hit'),
    Silence = require('../buffer/silence'),
    utils = require('../../utils/utils'),
    Consts = require('../../consts');

var SilenceSkill = function(opts){
    Skill.call(this, opts);
};

util.inherits(SilenceSkill, Skill);

var pro = SilenceSkill.prototype;

/*
 *   沉默的概率
 * */
pro.getSilencePro = function(targetLV){
    var pair = utils.parseParamPair(this.param3),
        lvDiff = targetLV - this.level;
    //最终概率=参数3填写概率 * (1 -(攻击对象等级 - 技能等级) * 削弱系数)
    return pair.coe * (1 - Math.max(0, lvDiff) * pair.val);
};

/*
 *   眩晕是否生效
 * */
pro.maySilence = function(targetLV){
    return (this.rndManager.getSkillRndFloat(this.id, 'silencePro') < this.getSilencePro(targetLV));
};

pro.adjustSkillCD = function(target, kind){
    var skillObj = target.getSkillByKind(kind);
    if(skillObj){
        skillObj.adjustCD(this.lastTime);
    }
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
    // 未生效
    hitData.isHit = this.maySilence(target.level);
    if(!hitData.isHit){
        console.log('useAtTarget not silence!');
        return beforeReturn(target, hitData);
    }
    // 确定是否闪避
    hitData.isDuck = this.isDuck(user, target);
    if(hitData.isDuck){
        console.log('useAtTarget user %s skill %s target %s duck!', user.entityId, this.id, target.entityId);
        return beforeReturn(target, hitData);
    }
    // 处理技能效果
    buf = new Silence(target, user, this, tick);
    target.addBuf(buf, tick, act, function(rmBufIds){
        hitData.rmBufIds = rmBufIds;
        hitData.addBuff(buf.id, buf.skill.id);
    });
    this.adjustSkillCD(target, Consts.SKILL_KIND.SPECIAL);
    this.adjustSkillCD(target, Consts.SKILL_KIND.SUPER);

    console.log('useAtTarget user %s skill %s target %s', user.entityId, this.id, target.entityId);
    return beforeReturn(target, hitData);
};

module.exports = SilenceSkill;