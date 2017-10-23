/**
 * Created by kilua on 14-7-24.
 */

var util = require('util');

var Skill = require('./skill'),
    Hit = require('../report/hit'),
    utils = require('../../utils/utils');

var AdjustCDSkill = function(opts){
    Skill.call(this, opts);
};

util.inherits(AdjustCDSkill, Skill);

var pro = AdjustCDSkill.prototype;

module.exports = AdjustCDSkill;

/*
*   增减 CD 的百分比
* */
pro.getAdjustCDPercent = function(){
    // -1表示减少100%，1不表示增加100%
    return this.param2;
};

/*
*   增减 CD 的概率
* */
pro.getAdjustCDProbability = function(skillLV, skillParam3, targetLV){
    var pair = utils.parseParamPair(skillParam3),
        lvDiff = targetLV - skillLV;
    //最终概率=参数3填写概率 * (1 -(攻击对象等级 - 技能等级) * 削弱系数)
    return pair.coe * (1 - Math.max(0, lvDiff) * pair.val);
};

/*
*   调整 CD 是否生效
* */
pro.mayAdustCD = function(targetLV){
    return (this.rndManager.getSkillRndFloat(this.id, 'adjustCDPro') < this.getAdjustCDProbability(this.level, this.param3, targetLV));
};
/*
 *   影响 CD 的数值
 * */
pro.getCDEffectVal = function(targetLV, restoreTime){
    // 注意正负值
    console.info('######getCDEffectVal targetLV = %s, restoreTime = %s', targetLV, restoreTime);
    if(this.mayAdustCD(targetLV)){
        return this.getAdjustCDPercent() * restoreTime;
    }
    return 0;
};

pro.useAtTarget = function(act, user, target, curTick){
    // 确定是否生效
    var hitData = new Hit(target.entityId),
        targetSkill, cdAdjustVal;
    hitData.bufs.addBatch(target.getBufferInfo());
    hitData.isEffective = this.mayHit(user);

    function beforeReturn(target, hitObj){
        hitObj.hp = target.hp;
        return hitObj;
    }

    if(!hitData.isEffective){
        console.log('user %s skill %s target %s no hit', user.entityId, this.id, target.entityId);
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
    targetSkill = target.getSkillByKind(this.getAdjustCDTargetSkillKind());
    cdAdjustVal = this.getCDEffectVal(target.level, targetSkill.getLeftRestoreTime(curTick));
    // 处理技能效果
    targetSkill.adjustCD(cdAdjustVal);
    // 添加各种效果
    hitData.addEffect(target.entityId, 'cd', cdAdjustVal);
    console.log('user %s skill %s target %s cdAdjustVal %s', user.entityId, this.id, target.entityId, cdAdjustVal);
    return beforeReturn(target, hitData);
};