/**
 * Created by kilua on 14-8-16.
 */

var util = require('util');

var Skill = require('./skill'),
    Hit = require('../report/hit'),
    AdjustCD = require('../buffer/adjustCD'),
    utils = require('../../utils/utils');

var AdjustCDBuffSkill = function(opts){
    Skill.call(this, opts);
};

util.inherits(AdjustCDBuffSkill, Skill);

var pro = AdjustCDBuffSkill.prototype;

/*
 *   增减CD的目标技能类型
 * */
pro.getAdjustCDTargetSkillKind = function(){
    return this.param1;
};

// CD调整的百分比,1表示100%,-1表示-100%
pro.getCDDiffPercent = function(){
    return this.param2;
};

/*
 *   调整 cd 的概率
 * */
pro.getBuffAdjustCDProbability = function(skillLV, skillParam3, targetLV){
    var pair = utils.parseParamPair(skillParam3),
        lvDiff = targetLV - skillLV;
    //最终概率=参数3填写概率 * (1 -(攻击对象等级 - 技能等级) * 削弱系数)
    return pair.coe * (1 - Math.max(0, lvDiff) * pair.val);
};

/*
 *   调整 CD 是否生效
 * */
pro.mayAdustCD = function(targetLV){
    return (this.rndManager.getSkillRndFloat(this.id, 'adjustCDPro') < this.getBuffAdjustCDProbability(this.level, this.param3, targetLV));
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
    buf = new AdjustCD(target, user, this, tick);
    target.addBuf(buf, tick, act, function(rmBufIds){
        hitData.rmBufIds = rmBufIds;
        hitData.addBuff(buf.id, buf.skill.id);
    });
    console.log('useAtTarget user %s skill %s target %s', user.entityId, this.id, target.entityId);
    return beforeReturn(target, hitData);
};

module.exports = AdjustCDBuffSkill;