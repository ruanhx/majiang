/**
 * Created by kilua on 14-9-5.
 */

var _ = require('underscore'),
    logger = require('log4js').getLogger(__filename);

var skill = require('./skill'),
    Consts = require('../consts');

var SkillManager = function(owner, skills, rndManager, cardQualityCoe){
    this.owner = owner;
    this.rndManager = rndManager;
    this.load(skills, cardQualityCoe);
};

/*
 *   根据类型获取技能
 * */
SkillManager.prototype.getSkillByKind = function(kind){
    return this.skillsByKind[kind] || skill.createNullSkill();
};

/*
*   获取施法者调整CD的目标技能列表
* */
SkillManager.prototype.getSkillsByAdjustSkillKind = function(adjustSkillKind){
    var results = [], skillObj;
    if(adjustSkillKind === Consts.ADJUST_SKILL_KIND.ALL){
        return _.values(this.skillsByKind);
    }else{
        skillObj = this.skillsByKind[adjustSkillKind];
        if(skillObj){
            results.push(skillObj);
        }
    }
    return results;
};

SkillManager.prototype.load = function(skills, cardQualityCoe){
    var self = this;
    self.skillsById = {};   // 包含所有技能
    self.skillsByKind = {}; // 只包含主技能
    self.allSkills = [];
    skills = skills || [];
    _.each(skills, function(skillInfo){
        skillInfo.rndManager = self.rndManager;
        var skillObj = skill.create(skillInfo, skillInfo.kind, cardQualityCoe);
        if(!skillObj){
            return;
        }
//        self.skillsById[skillObj.id] = skillObj;
        self.skillsByKind[skillInfo.kind] = skillObj;
        // 添加所有附属技能
        _.each(skillObj.chainSkills, function(subSkill){
            // subSkill包含主技能自己
            self.skillsById[subSkill.id] = subSkill;
            self.allSkills.push(subSkill);
        });
    });
};

/*
*   过滤出光环技能
* */
SkillManager.prototype.getAuraSkills = function(){
    return _.filter(this.allSkills, function(skillObj){
        return skillObj.isAura();
    });
};

SkillManager.prototype.toJSON = function(){
    var skills = [];
    _.each(this.skillsByKind, function(skill){
        skills.push(skill.getInfo());
    });
    return skills;
};

/*
 *   自动选择技能
 * */
SkillManager.prototype.autoSelect = function(tick){
    var kind, skillObj,
        result = [];
    if(this.owner.buffMgr.haveBufByType(Consts.SKILL_TYPE.DAZE)){
//        logger.debug('run dazing...');
        return result;
    }
    if(this.owner.buffMgr.haveBufByType(Consts.SKILL_TYPE.PETRIFY)){
//        logger.debug('run petrified...');
        return result;
    }
    // 同时可以使用普通攻击和特殊技能时，优先使用特殊技能，再使用普通攻击
    for(kind = Consts.SKILL_KIND.SUPER; kind >= Consts.SKILL_KIND.NORMAL; --kind){
        skillObj = this.skillsByKind[kind];
        if(!skillObj){
            continue;
        }
        // 沉默不能使用特殊技能和大招
        if(this.owner.buffMgr.haveBufByType(Consts.SKILL_TYPE.SILENCE) && kind === Consts.SKILL_KIND.SPECIAL){
//        logger.debug('run silence...');
            continue;
        }
        // 光环技能AI不使用
        if(skillObj.isAura()){
            continue;
        }
        if(!skillObj.inCD(tick)){
            skillObj.clearCD();
            result.push(skillObj);
        }
    }
    return result;
};

/*
 *   让所有技能开始CD
 * */
SkillManager.prototype.startAllCD = function(tick){
    _.each(this.skillsByKind, function(skill){
        // 光环技能，开场不开始CD，立即可以使用
        if(skill.isAura()){
            return;
        }
        skill.startCD(tick);
    });
};

module.exports = SkillManager;