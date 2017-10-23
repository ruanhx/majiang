/**
 * Created by kilua on 14-7-26.
 */

/*
*   技能范围目标选择器
* */
var util = require('util');

var _ = require('underscore'),
    log4js = require('log4js'),
    logger = log4js.getLogger(__filename);

var targetSelector = require('./targetSelector'),
    Consts = require('../../consts');

/*
 *   点、竖、斜类技能目标选择器
 * */
var ScopeSelector = function(scope, targetType, targetPrior){
    this.scope = scope;
    this.targetSelector = targetSelector.create(targetType, targetPrior);
};

/*
*   选择首要目标之外的其他目标
*   @param {Array} others 首要目标之外，其他服务技能目标类型的目标
* */
ScopeSelector.prototype._selectOthers = function(others){
    // 出于简单考虑，这里不模拟真实客户端，进行碰撞检测，仅仅随机从中选择随机个数的目标(包括0,最多取所有目标)
    return _.sample(others, _.random(others.length));
};

ScopeSelector.prototype.select = function(user, us, enemies, curTick, rangeCheck, mainSkillTargets, targetPrior){
    var targetTypeTargets = this.targetSelector.filterTargetsByTargetType(us, enemies, mainSkillTargets),
        firstTargets = this.targetSelector.filterTargetsByPriors(user, targetTypeTargets, curTick, targetPrior),
        others;
    if(firstTargets.length <= 0){
        //若按填写的优先级不能找到目标，但本技能指定的目标阵营还有存活的单位，就随机攻击某个存活的单位
        firstTargets = _.sample(targetTypeTargets, 1);
    }
    if(rangeCheck){
        others = _.difference(targetTypeTargets, firstTargets);
        return firstTargets.concat(this._selectOthers(others));
    }else{
        return firstTargets;
    }
};

/*
*   横类技能目标选择器
* */
var HorizontalSelector = function(scope, targetType, targetPrior){
    ScopeSelector.call(this, scope, targetType, targetPrior);

};

util.inherits(HorizontalSelector, ScopeSelector);

HorizontalSelector.prototype.select = function(self, us, enemies, curTick, rangeCheck, mainSkillTargets, targetPrior){
    var fire = _.random(1);
    if(fire){
        return ScopeSelector.prototype.select.call(this, self, us, enemies, curTick, rangeCheck, mainSkillTargets, targetPrior);
    }else{
        logger.debug('select not touch first target!');
    }
    return [];
};

var NullSelector = function(scope, targetType, targetPrior){
    ScopeSelector.call(this, scope, targetType, targetPrior);

};

util.inherits(NullSelector, ScopeSelector);

NullSelector.prototype.select = function(self, us, enemies, curTick, rangeCheck, mainSkillTargets, targetPrior){
    return [];
};

//// 技能范围类型,从右往左看
//, SKILL_SCOPE_TYPE:{
//    NONE: 0
//        , LEFT_RIGHT: 1 // 横条(左-右)
//        , RIGHT_LEFT: 2 // 横条(右-左)
//        , TOP_DOWN: 3   // 竖条(上-下)
//        , BOTTOM_UP: 4  // 竖条(下-上)
//        , LEFT_DOWN: 5  // 左上-右下
//        , RIGHT_UP: 6   // 右下-左上
//        , LEFT_UP: 7    // 左下-右上
//        , RIGHT_DOWN: 8 // 右上-左上
//        , POINT: 9      // 点
//}
module.exports.create = function(scope, targetType, targetPrior){
    switch (scope){
        case Consts.SKILL_SCOPE_TYPE.LEFT_RIGHT:
        case Consts.SKILL_SCOPE_TYPE.RIGHT_LEFT:
            return new HorizontalSelector(scope, targetType, targetPrior);
        case Consts.SKILL_SCOPE_TYPE.TOP_DOWN:
        case Consts.SKILL_SCOPE_TYPE.BOTTOM_UP:
        case Consts.SKILL_SCOPE_TYPE.LEFT_DOWN:
        case Consts.SKILL_SCOPE_TYPE.RIGHT_UP:
        case Consts.SKILL_SCOPE_TYPE.LEFT_UP:
        case Consts.SKILL_SCOPE_TYPE.RIGHT_DOWN:
        case Consts.SKILL_SCOPE_TYPE.POINT:
            return new ScopeSelector(scope, targetType, targetPrior);
        default :
            return new NullSelector(scope, targetType, targetPrior);
    }
};
