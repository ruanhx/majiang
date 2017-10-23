/**
 * Created by kilua on 14-8-14.
 */

var util = require('util');

var Skill = require('./skill'),
    Hit = require('../report/hit'),
    Daze = require('../buffer/daze'),
    utils = require('../../utils/utils');

var DazeSkill = function(opts){
    Skill.call(this, opts);
};

util.inherits(DazeSkill, Skill);

var pro = DazeSkill.prototype;

/*
 *   眩晕的概率
 * */
pro.getDazeProbability = function(skillLV, skillParam3, targetLV){
    var pair = utils.parseParamPair(skillParam3),
        lvDiff = targetLV - skillLV;
    //最终概率=参数3填写概率 * (1 -(攻击对象等级 - 技能等级) * 削弱系数)
    return pair.coe * (1 - Math.max(0, lvDiff) * pair.val);
};

/*
 *   眩晕是否生效
 * */
pro.mayDaze = function(targetLV){
    return (this.rndManager.getSkillRndFloat(this.id, 'dazePro') < this.getDazeProbability(this.level, this.param3, targetLV));
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
    hitData.isHit = this.mayDaze(target.level);
    if(!hitData.isHit){
        console.log('useAtTarget not daze!');
        return beforeReturn(target, hitData);
    }
    // 确定是否闪避
    hitData.isDuck = this.isDuck(user, target);
    if(hitData.isDuck){
        console.log('useAtTarget user %s skill %s target %s duck!', user.entityId, this.id, target.entityId);
        return beforeReturn(target, hitData);
    }
    // 确定是否暴击
    if(this.ignoreCrit === 1){
        hitData.isCrit = 0;
    }else{
        hitData.isCrit = act.isCrit(user, target);
    }
    // 处理技能效果
    buf = new Daze(target, user, this, tick);
    target.addBuf(buf, tick, act, function(rmBufIds){
        hitData.rmBufIds = rmBufIds;
        hitData.addBuff(buf.id, buf.skill.id);
    });
    console.log('useAtTarget user %s skill %s target %s', user.entityId, this.id, target.entityId);
    return beforeReturn(target, hitData);
};

module.exports = DazeSkill;