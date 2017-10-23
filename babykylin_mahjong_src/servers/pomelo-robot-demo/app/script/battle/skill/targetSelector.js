/**
 * Created by kilua on 14-7-25.
 */

var util = require('util');

var _ = require('underscore');

var Consts = require('../../consts');

/***********************************************************************************************************************
*   技能首要目标选择器
* *********************************************************************************************************************/

function filterAliveTarget(target){
    return !target.isDead();
}
/*
 *   根据位置，查找目标
 * */
function filterTargetsByPos(target){
    return (this.pos === target.pos % Consts.BATTLE_FIELD_POS.BACK && filterAliveTarget(target));
}

function hpPercent(target){
    return ((target.getMaxHP() === 0) ? 0 : target.hp / target.getMaxHP());
}

function hp(target){
    return target.hp;
}

/*
*   获取指定技能类型的剩余CD
* */
function getSkillLeftRestoreTime(target, skillKind, curTick){
    var skillObj = target.skillMgr.getSkillByKind(skillKind);
    return skillObj.getLeftRestoreTime(curTick);
}

function getMaxSkillLeftRestoreTimeTargets(targets, skillKind, curTick){
    var maxCD = 0, result;
    _.each(targets, function(target){
        if(!filterAliveTarget(target)){
            return;
        }
        var curCD = getSkillLeftRestoreTime(target, skillKind, curTick);
        if(curCD >= maxCD){
            maxCD = curCD;
            result = target;
        }
    });
    if(result){
        return [result];
    }
    return [];
}

var Selector = function(targetType, targetPrior){
    this.targetType = targetType;
    this.targetPrior = targetPrior;
};

/*
 *   根据技能目标类型，筛选目标
 *   @param {Array} us
 *   @param {Array} enemies
 *   @return {Array} targets
 */
Selector.prototype.filterTargetsByTargetType = function(us, enemies, mainSkillTargets){
    switch(this.targetType){
        case Consts.SKILL_TARGET_TYPE.ENEMY:
            return enemies;
        case Consts.SKILL_TARGET_TYPE.US:
            return us;
        case Consts.SKILL_TARGET_TYPE.ALL:
            return us.concat(enemies);
        case Consts.SKILL_TARGET_TYPE.FOLLOW_MAIN:
            return mainSkillTargets;
        default:
            return [];
    }
};


/*
 *   根据优先级，筛选目标
 *   @param {Object} self
 *   @param {Array} targets
 *   @param {Number} prior
 *   @return {Array} prior targets
 * */
Selector.prototype._filterTargetsByPrior = function(self, targets, prior, curTick){
    switch(prior){
        case Consts.SKILL_TARGET_PRIOR.FRONT:
            return _.filter(targets, filterTargetsByPos, {pos: Consts.BATTLE_FIELD_POS.FRONT});
        case Consts.SKILL_TARGET_PRIOR.MIDDLE:
            return _.filter(targets, filterTargetsByPos, {pos: Consts.BATTLE_FIELD_POS.MIDDLE});
        case Consts.SKILL_TARGET_PRIOR.BACK:
            return _.filter(targets, filterTargetsByPos, {pos: Consts.BATTLE_FIELD_POS.BACK});
        case Consts.SKILL_TARGET_PRIOR.ALL:
//            console.log('###ALL-------------');
            return _.filter(targets, filterAliveTarget);
        case Consts.SKILL_TARGET_PRIOR.MAX_HP_PERCENT:
            return [_.max(_.filter(targets, filterAliveTarget), hpPercent)];
        case Consts.SKILL_TARGET_PRIOR.MIN_HP_PERCENT:
            return [_.min(_.filter(targets, filterAliveTarget), hpPercent)];
        case Consts.SKILL_TARGET_PRIOR.MAX_HP:
            return [_.max(_.filter(targets, filterAliveTarget), hp)];
        case Consts.SKILL_TARGET_PRIOR.MIN_HP:
            return [_.min(_.filter(targets, filterAliveTarget), hp)];
        case Consts.SKILL_TARGET_PRIOR.SELF:
            return _.filter([self], filterAliveTarget);
        case Consts.SKILL_TARGET_PRIOR.LAST_ATTACKER:
//            console.log('###LAST_ATTACKER-------------');
            if(self.lastAttacker){
                return _.filter([self.lastAttacker], filterAliveTarget);
            }else{
                return [];
            }
        case Consts.SKILL_TARGET_PRIOR.RANDOM_ONE:
            return [_.sample(_.filter(targets, filterAliveTarget))];
        case Consts.SKILL_TARGET_PRIOR.RANDOM_TWO:
            return _.sample(_.filter(targets, filterAliveTarget), 2);
        case Consts.SKILL_TARGET_PRIOR.SUPER:                           // 大招，随机选3个目标攻击
        case Consts.SKILL_TARGET_PRIOR.RANDOM_THREE:
            return _.sample(_.filter(targets, filterAliveTarget), 3);
        case Consts.SKILL_TARGET_PRIOR.NORMAL_SKILL_MAX_CD:
            // 普通技能剩余CD最长
            return getMaxSkillLeftRestoreTimeTargets(targets, Consts.SKILL_KIND.NORMAL, curTick);
        case Consts.SKILL_TARGET_PRIOR.SPECIAL_SKILL_MAX_CD:
            // 特殊技能剩余CD最长
            return getMaxSkillLeftRestoreTimeTargets(targets, Consts.SKILL_KIND.SPECIAL, curTick);
        case Consts.SKILL_TARGET_PRIOR.SUPER_SKILL_MAX_CD:
            // 大招剩余CD最长
            return getMaxSkillLeftRestoreTimeTargets(targets, Consts.SKILL_KIND.SUPER, curTick);
        default:
            console.error('filterTargetsByPrior prior %s not support', prior);
            return [];
    }
};

/*
 *   根据优先级，筛选目标
 *   @param {Object} self
 *   @param {Array} targets
 *   @return {Array} prior targets
 * */
Selector.prototype.filterTargetsByPriors = function(user, targets, curTick, targetPrior){
    var i, result;
    if(this.targetType !== Consts.SKILL_TARGET_TYPE.FOLLOW_MAIN){
        targetPrior = this.targetPrior;
    }
    targetPrior = targetPrior || [];
    for(i = 0; i < targetPrior.length; ++i){
        result = this._filterTargetsByPrior(user, targets, targetPrior[i], curTick);
        if(result.length > 0){
            return result;
        }
    }
    return [];
};

/*
*   选择技能施放目标
*   @param {Array} us
*   @param {Array} enemies
*   @return {Array} targets
* */
//Selector.prototype.select = function(self, us, enemies){
//    var targets = this.filterTargetsByTargetType(us, enemies);
//    return this._filterTargetsByPriors(self, targets);
//};

module.exports.create = function(targetType, targetPrior){
    return new Selector(targetType, targetPrior);
};