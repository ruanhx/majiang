/**
 * Created with JetBrains WebStorm.
 * User: kilua
 * Date: 13-9-30
 * Time: 上午10:17
 * To change this template use File | Settings | File Templates.
 */

var util = require('util');

var _ = require('underscore'),
    log4js = require('log4js'),
    loggerForAct = log4js.getLogger('act');

var Consts = require('../../consts'),
    selector = require('./scopeSelector'),
    utils = require('../../utils/utils'),
    skillKind = require('./skillKind');

var HurtParam = function(coe, val){
    this.coe = coe;
    this.val = val;
};

var HurtParamManager = function(){
    this.indexByRace = {};
};

HurtParamManager.prototype.add = function(race, coe, val){
    if(this.indexByRace[race]){
        return false;
    }
    this.indexByRace[race] = new HurtParam(coe, val);
    return true;
};

HurtParamManager.prototype.get = function(race){
    return this.indexByRace[race];
};

var GrowParam = function(pow, IQ, agi, atk, hp, def, duck, crit, duckPro, critPro, hitPro){
    this.pow = utils.parseParamPair(pow);
    this.IQ = utils.parseParamPair(IQ);
    this.agi = utils.parseParamPair(agi);
    this.atk = utils.parseParamPair(atk);
    this.hp = utils.parseParamPair(hp);
    this.def = utils.parseParamPair(def);
    this.duck = utils.parseParamPair(duck);
    this.crit = utils.parseParamPair(crit);
    this.duckPro = utils.parseParamPair(duckPro);
    this.critPro = utils.parseParamPair(critPro);
    this.hitPro = utils.parseParamPair(hitPro);
};

GrowParam.prototype.getProp = function(prop, val, qualityCoe){
    return (this[prop].coe * val + this[prop].val * qualityCoe);
};

var GrowParamManager = function(){
    this.indexByRace = {};
};

GrowParamManager.prototype.add = function(race, pow, IQ, agi, atk, hp, def, duck, crit, duckPro, critPro, hitPro){
    if(this.indexByRace[race]){
        return false;
    }
    this.indexByRace[race] = new GrowParam(pow, IQ, agi, atk, hp, def, duck, crit, duckPro, critPro, hitPro);
    return true;
};

GrowParamManager.prototype.get = function(race){
    return this.indexByRace[race];
};

GrowParamManager.prototype.getGrowProp = function(targetRace, prop, val, qualityCoe){
    var growParam = this.indexByRace[targetRace];
    if(!growParam){
        console.error('getGrowProp targetRace = %s not found!', targetRace);
        return 0;
    }
    return growParam.getProp(prop, val, qualityCoe);
};

var id = 0;
var Skill = function(opts){
    this.mainSkill = opts.mainSkill;
    this.rndManager = opts.rndManager;
    this.cardQualityCoe = opts.cardQualityCoe;
    this.id = opts.id;
    this.kind = skillKind.createSkillKind(opts.kind);
    this.dataId = opts.SkillID;
    this.name = opts.SkillName;
    this.restoreTime = opts.RestoreTime;                                            // 冷却时间
    this.ignoreDuck = opts.ignoreEva;                                               // 是否无视闪避
    this.ignoreCrit = opts.ignoreCrit;                                              // 是否无视暴击
//    this.preSkillIds = utils.parseParams(opts.preSkillIds);
//    this.sufSkillIds = utils.parseParams(opts.sufSkillIds);
    this.type = opts.SkillType;                                                     // 技能类型
    this.targetType = opts.TargetType;                                              // 目标类型
    this.targetPrior = utils.parseParams(opts.TargetPrior);                               // 目标优先级
    this.scope = opts.SkillScope;                                                   // 目标范围
    this.selector = selector.create(this.scope, this.targetType, this.targetPrior); // 目标选择器
    this.rangeCheck = !!opts.rangeCheck;
    this.hitPro = opts.hitPro;                                                      // 生效概率
    this.bufFlag = opts.bufFlag;                                                    // buffer 生效方式
    this.bufType = opts.bufType;                                                    // buffer 类型，1正面,2负面
    this.lastTime = opts.BufLastTime;                                               // buffer 持续时间,单位毫秒
    this.interval = opts.lastRound;                                                 // buffer 生效间隔
    this.noOverwrite = (opts.noOverwrite === 1);                     // 是否可以叠加
    // 伤害值构成参数
    this.hurtParamMgr = new HurtParamManager();
    this.hurtParamMgr.add(Consts.RACE.HUMAN, opts.hHurtCoe, opts.hHurtVal);
    this.hurtParamMgr.add(Consts.RACE.FAIRY, opts.fHurtCoe, opts.fHurtVal);
    this.hurtParamMgr.add(Consts.RACE.DEMON, opts.dHurtCoe, opts.dHurtVal);
    // 附加参数，根据各种技能，意义有所不同
    this.param1 = opts.Param1;
    this.param2 = opts.Param2;
    this.param3 = opts.Param3;
    // 增幅力量,百分比值#固定值
    this.growParamMgr = new GrowParamManager();
    this.growParamMgr.add(Consts.RACE.HUMAN, opts.hGrowPow, opts.hGrowIQ, opts.hGrowAgi, opts.hGrowAtk, opts.hGrowHp
        , opts.hGrowDef, opts.hGrowDuck, opts.hGrowCrit, opts.hGrowDuckPro, opts.hGrowCritPro, opts.hGrowHitPro);
    this.growParamMgr.add(Consts.RACE.FAIRY, opts.fGrowPow, opts.fGrowIQ, opts.fGrowAgi, opts.fGrowAtk, opts.fGrowHp
        , opts.fGrowDef, opts.fGrowDuck, opts.fGrowCrit, opts.fGrowDuckPro, opts.fGrowCritPro, opts.fGrowHitPro);
    this.growParamMgr.add(Consts.RACE.DEMON, opts.dGrowPow, opts.dGrowIQ, opts.dGrowAgi, opts.dGrowAtk, opts.dGrowHp
        , opts.dGrowDef, opts.dGrowDuck, opts.dGrowCrit, opts.dGrowDuckPro, opts.dGrowCritPro, opts.dGrowHitPro);
    // 初始化技能等级
    this.level = opts.level;
    // 组合技能列表，按先后顺序，包括自身
    this.chainSkills = [];
    // 调整 CD 的值
    this.restoreTimeAdjustVal = 0;
};

var pro = Skill.prototype;

pro.isDuck = function(user, target){
    if(this.ignoreDuck === 1){
        return 0;
    }
    else{
        return target.isDuck(user.getHitStdVal());
    }
};
/*
 *   是否单次生效技能
 * */
pro.isAttach = function(){
    return (this.bufFlag === Consts.BUFF_FLAG.ATTACH);
};

pro.isAura = function(){
    var mainSkill = !!this.mainSkill ? this.mainSkill : this;
    if(this.bufFlag === Consts.BUFF_FLAG.AURA){
        return mainSkill.kind.isAura();
    }
    return false;
};

// 计算技能是否生效
pro.mayHit = function(user){
    return (this.rndManager.getSkillRndFloat(this.id, 'effectivePro') < (this.hitPro + user.getGrowHitPro(this.hitPro))) ? 1 : 0;
};

pro.getGrowProp = function(targetRace, prop, val){
    return this.growParamMgr.getGrowProp(targetRace, prop, val, this.kind.getGrowPropCoe(this.cardQualityCoe));
};

pro.select = function(self, us, enemies, curTick, mainSkillTargets, targetPrior){
    // 默认过滤出活的目标
    us = _.filter(us, function(actor){ return (actor.hp > 0);});
    enemies = _.filter(enemies, function(actor){ return (actor.hp > 0);});
    if(mainSkillTargets){
        mainSkillTargets = _.filter(mainSkillTargets, function(actor){ return (actor.hp > 0);});
    }
    return this.selector.select(self, us, enemies, curTick, this.rangeCheck, mainSkillTargets, targetPrior);
};
/*
*   获取子技能数，包括自身
* */
pro.getSubSkillCnt = function(){
    return this.chainSkills.length;
};

pro.getSkillByIndex = function(idx){
    return this.chainSkills[idx];
};

pro.getRestoreTime = function(){
    return (this.restoreTime + this.restoreTimeAdjustVal);
};

pro.getLeftRestoreTime = function(curTick){
    if(!this.lastUsedTick){
        return 0;
    }else{
        return Math.max(0, (this.getRestoreTime() - (curTick - this.lastUsedTick)));
    }
};

pro.startCD = function(tick){
//    loggerForAct.debug('startCD skillId %s %s', this.id, tick);
    this.lastUsedTick = tick;
};

pro.clearCD = function(){
    if(this.lastUsedTick){
        this.restoreTimeAdjustVal = 0;
    }
    this.lastUsedTick = 0;
};

pro.inCD = function(tick){
    // 子技能忽略CD
    if(!this.kind.inCD(tick)){
        return false;
    }
    // 光环技能忽略CD
    if(this.isAura()){
        return false;
    }
    if(!this.lastUsedTick){
        return false;
    }
    return (this.getLeftRestoreTime(tick) > 0);
};

pro.adjustCD = function(adjustTime){
    if(!adjustTime){
        return;
    }
    console.log('kind = %s, adjustTime = %s', this.kind.kind, adjustTime);
    this.restoreTimeAdjustVal += adjustTime;
};

/*
*   根据目标种族，取得相应的种族伤害百分比
* */
pro.getHurtCoeByRace = function(race){
    var param = this.hurtParamMgr.get(race);
    if(param){
        return param.coe;
    }
    return 0;
};

/*
*   根据目标种族，取得相应的种族伤害固定值
* */
pro.getHurtValByRace = function(race){
    var param = this.hurtParamMgr.get(race);
    if(param){
        return this.kind.getHurtValByRace(param.val, this.cardQualityCoe);
    }
    return 0;
};

/*
*   影响 HP 的数值
* */
pro.getHpEffectVal = function(user, target, isCrit, hitCnt){
    // 子类覆盖此函数,注意正负值
    return 0;
};

/*
*   增减CD的目标技能类型
* */
pro.getAdjustCDTargetSkillKind = function(){
    return this.param1;
};

/*
*   影响 CD 的数值
* */
pro.getCDEffectVal = function(targetLV, restoreTime){
    // 子类覆盖此函数, 注意正负值
    return 0;
};

/*
*   获取技能对象
* */
pro.getSkillById = function(skillId){
    var i, skillObj;
    for(i = 0; i < this.chainSkills.length; ++i){
        skillObj = this.chainSkills[i];
        if(skillObj.id === skillId){
            return skillObj;
        }
    }
    return null;
};
/*
 *   获取后置技能信息
 * */
pro.getSufSkillInfo = function(){
    var i, skill, result = [], suf = false;
    for(i = 0; i < this.chainSkills.length; ++i){
        skill = this.chainSkills[i];
        if(skill === this){
            suf = true;
            continue;
        }
        if(suf){
            result.push(skill.getInfo());
        }
    }
    return result;
};

/*
 *   获取前置技能信息
 * */
pro.getPreSkillInfo = function(){
    var i, skill, result = [];
    for(i = 0; i < this.chainSkills.length; ++i){
        skill = this.chainSkills[i];
        if(skill === this){
            return result;
        }
        result.push(skill.getInfo());
    }
    return result;
};

/*
*   获取下发给客户端的信息
* */
pro.getInfo = function(){
//    "message Skill": {
//        "optional uInt32 id": 1,
//            "optional uInt32 dataId": 2,
//            "optional uInt32 level": 3
//    },
    return {id: this.id, dataId: this.dataId, level: this.level,
        preSkills: this.getPreSkillInfo(), sufSkills: this.getSufSkillInfo()};
};

pro.useAtTarget = function(act, user, target, tick, hitCnt){
    loggerForAct.warn('useAtTarget skill id = %s', this.dataId);
};

module.exports = Skill;