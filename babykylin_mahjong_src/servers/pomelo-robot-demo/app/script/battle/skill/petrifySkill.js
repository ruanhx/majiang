/**
 * Created by kilua on 14-8-15.
 */

var util = require('util');

var Skill = require('./skill'),
    Hit = require('../report/hit'),
    Petrify = require('../buffer/petrify'),
    utils = require('../../utils/utils');

var PetrifySkill = function(opts){
    Skill.call(this, opts);
};

util.inherits(PetrifySkill, Skill);

var pro = PetrifySkill.prototype;

/*
 *   石化的概率
 * */
pro.getPetrifyProbability = function(skillLV, skillParam3, targetLV){
    var pair = utils.parseParamPair(skillParam3),
        lvDiff = targetLV - skillLV;
    //最终概率=参数3填写概率 * (1 -(攻击对象等级 - 技能等级) * 削弱系数)
    return pair.coe * (1 - Math.max(0, lvDiff) * pair.val);
};

/*
 *   石化是否生效
 * */
pro.mayPetrify = function(targetLV){
    return (this.rndManager.getSkillRndFloat(this.id, 'petrifyPro') < this.getPetrifyProbability(this.level, this.param3, targetLV));
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
    hitData.isHit = this.mayPetrify(target.level);
    if(!hitData.isHit){
        console.log('useAtTarget not petrify!');
        return beforeReturn(target, hitData);
    }
    // 确定是否闪避
    hitData.isDuck = this.isDuck(user, target);
    if(hitData.isDuck){
        console.log('useAtTarget user %s skill %s target %s duck!', user.entityId, this.id, target.entityId);
        return beforeReturn(target, hitData);
    }

    // 处理技能效果
    buf = new Petrify(target, user, this, tick);
    target.addBuf(buf, tick, act, function(rmBufIds){
        hitData.rmBufIds = rmBufIds;
        hitData.addBuff(buf.id, buf.skill.id);
    });
    console.log('useAtTarget user %s skill %s target %s', user.entityId, this.id, target.entityId);
    return beforeReturn(target, hitData);
};

module.exports = PetrifySkill;