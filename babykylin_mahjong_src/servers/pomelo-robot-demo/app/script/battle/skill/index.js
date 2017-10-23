/**
 * Created by kilua on 14-7-23.
 */

var _ = require('underscore');

var dataApi = require('../../../data/dataApi'),
    Consts = require('../../consts'),
    Skill = require('./skill'),
    HurtSkill = require('./hurtSkill'),
    CureSkill = require('./cureSkill'),
    AdjustCDSkill = require('./adjustCDSkill'),
    NullSkill = require('./nullSkill'),
    DotSkill = require('./dotSkill'),
    HotSkill = require('./hotSkill'),
    DazeSkill = require('./dazeSkill'),
    PetrifySkill = require('./petrifySkill'),
    AdjustCDBuffSkill = require('./adjustCDBuffSkill'),
    SuckOnAttackSkill = require('./suckOnAttackSkill'),
    RebirthBuffSkill = require('./rebirthBuffSkill'),
    ShieldSkill = require('./shieldSkill'),
    CounterStrikeSkill = require('./counterStrikeSkill'),
    SacrificeSkill = require('./sacrificeSkill'),
    DotAdditionSkill = require('./dotAdditionSkill'),
    SilenceSkill = require('./silenceSkill'),
    AddPropSkill = require('./addPropSkill'),
    MultiHurtSkill = require('./multiHurtSkill'),
    AdjustUserCDSkill = require('./adjustUserCDSkill'),
    PursueSkill = require('./pursueSkill'),
    AdjustFinalHurtSkill = require('./adjustFinalHurtSkill'),
    MultiCutSkill = require('./multiCutSkill');

var exp = module.exports = {};

/*
*   创建单个技能
*   @param {Object} opts 服务器端给的技能信息
*   @param {Number} kind 默认 Consts.SKILL_KIND.NONE
* */
function createSimpleSkill(opts, kind, rndManager, mainSkill, cardQualityCoe){
    var skillData = dataApi.skill.findBy('SkillID', opts.dataId); // 这里可以通过修改列明，优化成字典查找
    if(!skillData || !_.isArray(skillData) || skillData.length !== 1){
        return null;
    }
    skillData = skillData[0];
    skillData.id = opts.id;
    skillData.level = opts.level || 1;
    skillData.kind = kind || Consts.SKILL_KIND.NONE;
    skillData.rndManager = rndManager;
    skillData.mainSkill = mainSkill;
    skillData.cardQualityCoe = cardQualityCoe;
    // 根据技能类型，创建相应技能
    switch (skillData.SkillType){
        case Consts.SKILL_TYPE.HURT:
            return new HurtSkill(skillData);
        case Consts.SKILL_TYPE.CURE:
            return new CureSkill(skillData);
        case Consts.SKILL_TYPE.ADJUST_CD:
            return new AdjustCDSkill(skillData);
        case Consts.SKILL_TYPE.DOT:
            return new DotSkill(skillData);
        case Consts.SKILL_TYPE.HOT:
            return new HotSkill(skillData);
        case Consts.SKILL_TYPE.REBIRTH:
            return new RebirthBuffSkill(skillData);
        case Consts.SKILL_TYPE.SHIELD:
            return new ShieldSkill(skillData);
        case Consts.SKILL_TYPE.COUNTER_STRIKE:
            return new CounterStrikeSkill(skillData);
        case Consts.SKILL_TYPE.SACRIFICE:
            return new SacrificeSkill(skillData);
        case Consts.SKILL_TYPE.DOT_ADDITION:
            return new DotAdditionSkill(skillData);
        case Consts.SKILL_TYPE.DAZE:
            return new DazeSkill(skillData);
        case Consts.SKILL_TYPE.PETRIFY:
            return new PetrifySkill(skillData);
        case Consts.SKILL_TYPE.SILENCE:
            return new SilenceSkill(skillData);
        case Consts.SKILL_TYPE.ADD_PROP:
            return new AddPropSkill(skillData);
        case Consts.SKILL_TYPE.MULTI_HURT:
            return new MultiHurtSkill(skillData);
        case Consts.SKILL_TYPE.SUCK_ON_ATTACK:
            return new SuckOnAttackSkill(skillData);
        case Consts.SKILL_TYPE.ADJUST_CD_BUFF:
            return new AdjustCDBuffSkill(skillData);
        case Consts.SKILL_TYPE.ADJUST_USER_CD:
            return new AdjustUserCDSkill(skillData);
        case Consts.SKILL_TYPE.PURSUE:
            return new PursueSkill(skillData);
        case Consts.SKILL_TYPE.ADJUST_FINAL_HURT:
            return new AdjustFinalHurtSkill(skillData);
        case Consts.SKILL_TYPE.MULTI_CUT:
            return new MultiCutSkill(skillData);
        default :
            console.warn('createSimpleSkill unknown SkillType %s', skillData.SkillType);
            return null;
//            return new Skill(skillData);
    }
}

function createSubSkills(mainSkill, skillList, rndManager, cardQualityCoe){
    skillList = skillList || [];
    _.each(skillList, function(skillInfo){
        var skill = createSimpleSkill(skillInfo, Consts.SKILL_KIND.NONE, rndManager, mainSkill, cardQualityCoe);
        if(skill){
            mainSkill.chainSkills.push(skill);
        }
    });
}

exp.createNullSkill = function(){
    return new NullSkill();
};

exp.create = function(opts, kind, cardQualityCoe){
    var mainSkill = createSimpleSkill(opts, kind, opts.rndManager, null, cardQualityCoe);
    if(mainSkill){
        // 加载前置技能
        createSubSkills(mainSkill, opts.preSkills, opts.rndManager, cardQualityCoe);
        mainSkill.chainSkills.push(mainSkill);
        // 加载后置技能
        createSubSkills(mainSkill, opts.sufSkills, opts.rndManager, cardQualityCoe);
    }
    return mainSkill;
};