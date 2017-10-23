/**
 * Created by kilua on 14-8-26.
 */

var util = require('util');

var Skill = require('./skill'),
    Hit = require('../report/hit'),
    Rebirth = require('../buffer/rebirth'),
    utils = require('../../utils/utils');

var RebirthBuffSkill = function(opts){
    Skill.call(this, opts);
};

util.inherits(RebirthBuffSkill, Skill);

var pro = RebirthBuffSkill.prototype;

pro.getRebirthPro = function(targetLV){
    var pair = utils.parseParamPair(this.param3),
        lvDiff = targetLV - this.level;
    //最终概率=参数3填写概率 * (1 -(攻击对象等级 - 技能等级) * 削弱系数)
    return pair.coe * (1 - Math.max(0, lvDiff) * pair.val);
};

/*
 *   是否复活
 * */
pro.mayRebirth = function(targetLV){
    return (this.rndManager.getSkillRndFloat(this.id, 'rebirthPro') < this.getRebirthPro(targetLV));
};

pro.getRebirthHp = function(user, target){
    //生命值=施法者攻击力X%+X固定值+施法者生命上限X%+自身生命上限X%(在复活时计算)
    return Math.floor(user.getAtk() * Math.max(0, this.getHurtCoeByRace(target.race)) + this.getHurtValByRace(target.race) +
        user.getMaxHP() * Math.max(0, this.param1) + target.getMaxHP() * Math.max(0, this.param2));
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
    buf = new Rebirth(target, user, this, tick);
    target.addBuf(buf, tick, act, function(rmBufIds){
        hitData.rmBufIds = rmBufIds;
        hitData.addBuff(buf.id, buf.skill.id);
    });
    console.log('useAtTarget user %s skill %s target %s', user.entityId, this.id, target.entityId);
    return beforeReturn(target, hitData);
};

module.exports = RebirthBuffSkill;