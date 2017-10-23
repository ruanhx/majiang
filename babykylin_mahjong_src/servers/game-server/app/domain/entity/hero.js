/**
 * Created by employee11 on 2015/12/15.
 */

var util = require('util');

var _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename);

var dataApi = require('../../util/dataApi'),
    dataUtils = require('../../util/dataUtils'),
    Skill = require('./skill'),
    Consts = require('../../consts/consts'),
    Entity = require('./entity');

var Hero = function (opts) {
    Entity.call(this, {type: 2});

    opts = opts || {};
    this.playerId = opts.playerId;
    this.pos = opts.pos || 0;
    this.roleId = opts.roleId;
    this.curLevel = opts.curLevel;
    this.curExperience = opts.curExperience;
    this.quality = opts.quality;
    this.isNew = opts.isNew;
    this.bindData();
    this.loadSkills(opts);
};

util.inherits(Hero, Entity);

var pro = Hero.prototype;

pro.clearHero = function(){
    delete this.playerId;
    delete this.pos;
    delete this.roleId;
    delete this.curLevel;
    delete this.curExperience;
    delete this.quality;
    delete this.isNew;

    delete this.data;

    for(var key in this.skillsById){
        this.skillsById[key].clearSkill();
        delete this.skillsById[key];
    }
    delete this.skillsById;

    for(var key in this.skillsByType){
        delete this.skillsByType[key];
    }
    delete this.skillsByType;

    this.removeAllListeners();
}

pro.bindData = function () {
    var heroData = dataApi.HeroAttribute.findByIndex({heroId: this.roleId, quality: this.quality});
    this.data = heroData || {};
    if (!heroData) {
        logger.error('bindData failed!data not found! roleId = %s, quality = %s', this.roleId, this.quality);
    }
};

pro.loadSkill = function (skillType, skillId, saveSkill) {
    if(skillId<=0){
        return;
    }

    var skillInitData = {id: skillId, lv: 1, type: skillType};


    if (saveSkill) {
        skillInitData.lv = saveSkill.lv;
    }
    var skill = new Skill(skillInitData),
        self = this;
    skill.on('updatePower', function () {
        self.emit('updatePower');
    });
    this.skills.push(skill);
    this.skillsById[skill.id] = skill;
    if (!this.skillsByType[skillType]) {
        this.skillsByType[skillType] = [];
    }
    this.skillsByType[skillType].push(skill);

};

pro.loadSkills = function (saveData) {
    var self = this,
        saveSkillById = _.indexBy(saveData.skills || [], 'id');
    self.skills = [];
    self.skillsById = {};
    self.skillsByType = {};

    self.loadSkill(Consts.HERO_SKILL_TYPES.SUPER, self.data.bigSkill, saveSkillById[self.data.bigSkill]);
    var roleAck = dataApi.RoleAtkType.findById(self.data.atkType);
    if(!!roleAck){//加载特性技能
        self.loadSkill(Consts.HERO_SKILL_TYPES.FEATURE, roleAck.skillId, saveSkillById[roleAck.skillId]);
    }

    self.data.jumpSkill.forEach(function (jumpSkill) {
        self.loadSkill(Consts.HERO_SKILL_TYPES.JUMP, jumpSkill, saveSkillById[jumpSkill]);
    });
    self.data.skills.forEach(function (skillId,idx) {
        self.loadSkill(Consts.HERO_SKILL_TYPES.PASSIVE1+idx, skillId, saveSkillById[skillId]);
    });
    self.data.smallSkills.forEach(function (skillId) {
        self.loadSkill(Consts.HERO_SKILL_TYPES.ADVANCE_SMALL, skillId, saveSkillById[skillId]);
    });

    //logger.debug('loadSkills cnt = %s', self.skills.length);
};

pro.getData = function () {
    var heroInfo = {};
    heroInfo.playerId = this.playerId;
    heroInfo.pos = this.pos;
    heroInfo.roleId = this.roleId;
    heroInfo.curLevel = this.curLevel;
    heroInfo.curExperience = this.curExperience;
    heroInfo.quality = this.quality;
    heroInfo.skills = [];
    this.skills.forEach(function (skill) {
        heroInfo.skills.push(skill.getData());
    });
    heroInfo.isNew = this.isNew;
    return heroInfo
};

pro.getClientInfo = function () {
    var clientInfo = {};
    clientInfo.pos = this.pos;
    clientInfo.dataId = this.getHeroId();
    clientInfo.heroId = this.roleId;
    clientInfo.quality = this.quality;
    clientInfo.curLevel = this.curLevel;
    clientInfo.curExperience = this.curExperience;
    clientInfo.skills = [];
    this.skills.forEach(function (skill) {
        clientInfo.skills.push(skill.getClientInfo());
    });
    clientInfo.isNew = this.isNew;
    return clientInfo;
};

pro.getSkillById = function (skillId) {
    return this.skillsById[skillId];
};

pro.getSkillByType = function (type) {
    return this.skillsByType[type];
};

/**
 * 获取核心技能
 * @returns {*}
 */
pro.getMainSkill = function () {
    var mainSkill;
    if(this.data.roleType === Consts.HERO_TYPE.HERO ){
        mainSkill = this.getSkillByType(Consts.HERO_SKILL_TYPES.SUPER)[0];
    }else{
        mainSkill = this.getSkillByType(Consts.HERO_SKILL_TYPES.FEATURE)[0];
    }
    return mainSkill;
};

pro.getLV = function () {
    return this.curLevel;
};

/**
 * 通过英雄类型获取等级
 * */
pro.getLvByType = function ( type ) {
    if(type == this.data.roleType )
    {
        return this.getLV();
    }
    return 0;
};

pro.getMaxLV = function () {
    return this.data.maxLevel || 1;
};

pro.levelUp = function (addExp,maxLevel) {
    var i, upgradeData, leftExp = addExp,
        curLV = this.getLV(), curExp = this.curExperience;
    for (i = this.getLV(); i < maxLevel; ++i) {
        upgradeData = dataApi.UpgradeExp.findById(i);
        if (upgradeData) {
            if (curExp + leftExp < upgradeData.heroUpgradeExp) {
                curExp += leftExp;
                break;
            }
            leftExp -= upgradeData.heroUpgradeExp - curExp;
            curLV += 1;
            curExp = 0;
        }
    }
    // 满级截断
    if (curLV === maxLevel) {
        upgradeData = dataApi.UpgradeExp.findById(curLV);
        if (upgradeData) {
            curExp = Math.min(curExp, upgradeData.heroUpgradeExp);
        }
    }
    // 统一结算
    this.setLevel(curLV);
    this.curExperience = curExp;
    this.emit('updatePower');
};

pro.getTotalExp = function () {
    var i, totalExp = 0, upgradeData;
    for (i = 1; i < this.getLV(); ++i) {
        upgradeData = dataApi.UpgradeExp.findById(i);
        if (upgradeData) {
            totalExp += upgradeData.heroUpgradeExp;
        }
    }
    totalExp += this.curExperience;
    return totalExp;
};

/*
 *   获取突破需要的材料列表
 * */
pro.getBreakThroughReqItems = function () {
    var items = [];
    if (this.data && this.data.needMat1) {
        items.push({itemId: this.data.needMat1, count: this.data.needMat1Num});
    }
    return items;
};

/*
 *   获取突破需要的同名猎魔人列表
 * */
pro.getBreakThroughReqHeroes = function () {
    var heroes = [];
    if (this.data && this.data.needMat2) {
        heroes.push({heroId: this.data.needMat2, count: this.data.needMat2Num});
    }
    return heroes;
};

/*
 *   获取突破需要的金币
 * */
pro.getBreakThroughReqGold = function () {
    return (this.data ? this.data.needMoney : Number.POSITIVE_INFINITY);
};

pro.getHeroId = function () {
    if (this.data) {
        return this.data.id;
    }
    return 0;
};

pro.getRealHeroId = function () {
    if (this.data) {
        return this.data.heroId;
    }
    return 0;
};

pro.getBasicExp = function () {
    return (this.data ? this.data.basicExp : 0);
};

pro.breakThrough = function () {
    this.quality += 1;
    this.curExperience = 0;
    this.isBreakThrough = 1;//此字段判断是不是来源突破 --为了识别是不是要new
    this.bindData();
    // 注意：必须等重新绑定数据后再更新战斗力，否则计算战斗力用的策划表数据将是旧的
    this.emit('updatePower');
};

/*
 *   复活
 * */
pro.revive = function () {
    // 由于服务器不进行具体验证，暂不对复活进行处理
};

pro.setLevel = function (level) {
    if (this.curLevel !== level) {
        this.curLevel = level;
        this.emit('updatePower');
        return true;
    }
    return false;
};

/*
 *   生命上限
 * */
pro.getMaxHP = function () {
    // 生命上限=初始生命+生命成长*（等级-1）
    var self = this,
        basicHp = this.data.basicHp || 0,
        hpUp = this.data.hpUp || 0;

    // [139195]【服务端】突破技能战力相关计算配合
    var skillHp = _.reduce(this.skillsByType, function (memo, typeSkills) {
        return memo + _.reduce(typeSkills, function (memo1, typeSkill) {
                return memo1 + typeSkill.getHp(self.quality);
            }, 0);
    }, 0);
    var skillHpRate = _.reduce(this.skillsByType, function (memo, typeSkills) {
        return memo + _.reduce(typeSkills, function (memo1, typeSkill) {
                return memo1 + typeSkill.getHpRate(self.quality);
            }, 0);
    }, 0);

    //return basicHp + hpUp * (this.curLevel - 1);
    return (basicHp + hpUp * (this.curLevel - 1))*(1 + skillHpRate) + skillHp;
};

/*
 *   攻击值
 * */
pro.getAtk = function () {
    // 攻击值=初始攻击+攻击成长*（等级-1）
    var self = this,
        basicAtk = this.data.basicAtk || 0,
        atkUp = this.data.atkUp || 0;

    // [139195]【服务端】突破技能战力相关计算配合
    var skillAtk = _.reduce(this.skillsByType, function (memo, typeSkills) {
        return memo + _.reduce(typeSkills, function (memo1, typeSkill) {
                return memo1 + typeSkill.getAtk(self.quality);
            }, 0);
    }, 0);
    var skillAtkRate = _.reduce(this.skillsByType, function (memo, typeSkills) {
        return memo + _.reduce(typeSkills, function (memo1, typeSkill) {
                return memo1 + typeSkill.getAtkRate(self.quality);
            }, 0);
    }, 0);

    //return basicAtk + atkUp * (this.curLevel - 1);
    return (basicAtk + atkUp * (this.curLevel - 1))*(1 + skillAtkRate) + skillAtk;
};

/*
 *   技能的全属性增加值
 * */
pro.getSkillTotalAddValue = function () {
    var self = this;
    return _.reduce(this.skillsByType, function (memo, typeSkills) {
        return memo + _.reduce(typeSkills, function (memo1, typeSkill) {
                return memo1 + typeSkill.getTotalAddValue(self.quality);
            }, 0);
    }, 0);
}

/*
 *   技能的全属性增加百分比
 * */
pro.getSkillTotalAddRate= function () {
    var self = this;
    return _.reduce(this.skillsByType, function (memo, typeSkills) {
        return memo + _.reduce(typeSkills, function (memo1, typeSkill) {
                return memo1 + typeSkill.getTotalAddRate(self.quality);
            }, 0);
    }, 0);
}

/*
 *   战斗力
 * */
pro.getPower = function () {
    var self = this,
        propPower = Math.floor(this.getMaxHP() * dataUtils.getOptionValue('Battle_hpfight', 0.2))
            + Math.floor(this.getAtk() * dataUtils.getOptionValue('Battle_atkfight', 1)),
        skillPower = _.reduce(this.skillsByType, function (memo, typeSkills) {
            var skill = typeSkills[0];
            if(skill) {
                if(skill.type === Consts.HERO_SKILL_TYPES.JUMP){
                    return memo + skill.getPower(self.quality);
                }else if(skill.type === Consts.HERO_SKILL_TYPES.ADVANCE_SMALL){
                    return memo + _.reduce(typeSkills, function (memo1, typeSkill) {
                            return memo1 + typeSkill.getPower(self.quality);
                        }, 0);
                }else if(skill.type === Consts.HERO_SKILL_TYPES.FEATURE){
                    return memo + skill.getPower(self.quality);
                }
            }
            return memo + _.reduce(typeSkills, function (memo1, typeSkill) {
                    return memo1 + typeSkill.getPower(self.quality);
                }, 0);
        }, 0);
    var temp = propPower + skillPower;


    temp = Math.floor(temp);
    //logger.error('###计算角色战力 heroId=%j,propPower=%j,skillPower=%j',this.roleId, propPower, skillPower);
    return temp;
};

// pro.getReturnSkillLevelUpGold = function () {
//     var totalCost = 0;
//     _.each(this.skillsByType, function (typeSkills, skillType) {
//         var firstTypeSkill = _.first(typeSkills);
//         if (firstTypeSkill) {
//             totalCost += dataApi.SkillUpLevel.getLevelUpCost(skillType, 1, firstTypeSkill.getLevel() - 1);
//         }
//     });
//     return totalCost;
// };
pro.getAdvanceSkillHeroCore = function(){
    //计算花费
    var totalCost = 0;
    var mainSkill,smallSkills ;
    mainSkill = this.getMainSkill();
    if(this.data.roleType === Consts.HERO_TYPE.HERO){
        mainSkill = this.getSkillByType(Consts.HERO_SKILL_TYPES.SUPER)[0];
    }else{
        mainSkill = this.getSkillByType(Consts.HERO_SKILL_TYPES.FEATURE)[0];
    }
    var SkillUpLevel = dataApi.SkillUpLevel.findById(mainSkill.lv-1);
    if(!SkillUpLevel) return 0;
    var skillUpRate = dataUtils.getOptionListValueByIndex("Skill_GradeForSkillUpRate",this.data.roleGrade - 1,"#");
    totalCost +=  Math.ceil(SkillUpLevel.centerSkillUseCoreNum * skillUpRate);
    smallSkills = this.getSkillByType(Consts.HERO_SKILL_TYPES.ADVANCE_SMALL);
    _.each(smallSkills,function(sk){
        SkillUpLevel = dataApi.SkillUpLevel.findById(sk.lv-1);
        totalCost += Math.ceil(SkillUpLevel.smallSkillUseCoreNum * skillUpRate);
    });

    return totalCost;
}

pro.getScoreAdd = function () {
    var skillAdd = 0, hero = this;
    this.skills.forEach(function (skill) {
        if (skill.isUnlock(hero.quality)) {
            skillAdd += skill.getSkillAdd();
        }
    });
    //logger.debug('###skillAdd = %s, base = %s, hero lv add = %s', skillAdd, this.data.scoreAdd, this.data.scoreUp * (this.getLV() - 1));
    return this.data.scoreAdd + this.data.scoreUp * (this.getLV() - 1) + skillAdd;
};

//添加契合度技能
pro.addAppropriateSkill = function(skillId,needUpdatePower){
    if(skillId<=0){
        return;
    }
    needUpdatePower = needUpdatePower != undefined ? needUpdatePower : true;//默认要更新
    var skillType = Consts.HERO_SKILL_TYPES.APPROPRIATE;

    var skillInitData = {id: skillId, lv: 1, type:skillType};

    var skill = new Skill(skillInitData),
        self = this;

    this.skills.push(skill);
    this.skillsById[skill.id] = skill;
    if (!this.skillsByType[skillType]) {
        this.skillsByType[skillType] = [];
    }
    this.skillsByType[skillType].push(skill);

    if(needUpdatePower){
        self.emit('updatePower');//通知修改战斗力
    }
};

//清空契合度技能
pro.clearAppropriateSkill = function(){
    var self = this;
    if(this.skillsByType[Consts.HERO_SKILL_TYPES.APPROPRIATE]){
        this.skillsByType[Consts.HERO_SKILL_TYPES.APPROPRIATE].forEach(function(skill){
            for(var i = 0 ; i < self.skills.length ; i ++){
                if(skill.dataId == self.skills[i].dataId){
                    self.skills.splice(i,1);
                    break;
                }
            }
            delete self.skillsById[skill.id];
        });
        delete this.skillsByType[Consts.HERO_SKILL_TYPES.APPROPRIATE];
    }
};

module.exports = Hero;

