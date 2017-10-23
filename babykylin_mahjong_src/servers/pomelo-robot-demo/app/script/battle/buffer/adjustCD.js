/**
 * Created by kilua on 14-8-16.
 */

var util = require('util');

var Buffer = require('./buffer');

var AdjustCD = function(owner, user, skill, tick){
    Buffer.call(this, owner, user, skill, tick);
};

util.inherits(AdjustCD, Buffer);

var pro = AdjustCD.prototype;

// CD调整的百分比,1表示100%,-1表示-100%
pro.getCDDiffPercent = function(){
    return this.skill.getCDDiffPercent();
};

/*
 *   增减CD的目标技能类型
 * */
pro.getAdjustCDTargetSkillKind = function(){
    return this.skill.getAdjustCDTargetSkillKind();
};

/*
 *   调整 CD 是否生效
 * */
pro.mayAdustCD = function(){
    return this.skill.mayAdustCD(this.owner.level);
};

/*
 *   影响 CD 的数值
 * */
pro.getCDEffectVal = function(restoreTime){
    // 注意正负值
    if(this.mayAdustCD()){
        return this.getCDDiffPercent() * restoreTime;
    }
    return 0;
};

module.exports = AdjustCD;