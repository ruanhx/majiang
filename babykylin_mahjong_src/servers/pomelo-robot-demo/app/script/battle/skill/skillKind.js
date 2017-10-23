/**
 * Created by kilua on 14-9-5.
 */

var util = require('util');

var Consts = require('../../consts'),
    utils = require('../../utils/utils');

var SkillKind = function(kind){
    this.kind = kind;
};

SkillKind.prototype.use = function(user){

};

SkillKind.prototype.getHurtValByRace = function(hurtVal, qualityCoe){
    return hurtVal;
};

SkillKind.prototype.getGrowPropCoe = function(qualityCoe){
    return 1;
};

SkillKind.prototype.isAura = function(){
    return true;
};

SkillKind.prototype.inCD = function(tick){
    return true;
};

var SkillKindNull = function(kind){
    SkillKind.call(this, kind);

};

util.inherits(SkillKindNull, SkillKind);

/*
*   子技能忽略CD
* */
SkillKindNull.prototype.inCD = function(tick){
    return false;
};

var SkillKindNormal = function(kind){
    SkillKind.call(this, kind);

};

util.inherits(SkillKindNormal, SkillKind);

var SkillKindSpecial = function(kind){
    SkillKind.call(this, kind);

};

util.inherits(SkillKindSpecial, SkillKind);

var SkillKindSuper = function(kind){
    SkillKind.call(this, kind);

};

util.inherits(SkillKindSuper, SkillKind);

SkillKindSuper.prototype.use = function(user){
    user.buffMgr.eachBuff(function(buff){
        if(buff.mayAdjust()){
            var targetSkills = user.skillMgr.getSkillsByAdjustSkillKind(buff.skill.param1);
            targetSkills.forEach(function(targetSkill){
                var adjustVal = targetSkill.restoreTime * buff.skill.param2;
                targetSkill.adjustCD(adjustVal);
//                console.info('###use adjust skill %s %s', targetSkill.id, adjustVal);
            });
        }
    });
};

SkillKindSuper.prototype.getHurtValByRace = function(hurtVal, qualityCoe){
    return hurtVal * qualityCoe;
};

SkillKindSuper.prototype.getGrowPropCoe = function(qualityCoe){
    return qualityCoe;
};

/*
*   手势技能不可能是光环
* */
SkillKindSuper.prototype.isAura = function(){
    return false;
};

module.exports.createSkillKind = function(kind){
    switch (kind){
        case Consts.SKILL_KIND.NORMAL:
            return new SkillKindNormal(kind);
        case Consts.SKILL_KIND.SPECIAL:
            return new SkillKindSpecial(kind);
        case Consts.SKILL_KIND.SUPER:
            return new SkillKindSuper(kind);
        default:
            return new SkillKindNull(kind);
    }
};