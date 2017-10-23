/**
 * Created by kilua on 14-7-29.
 */

var _ = require('underscore');

var random = require('../utils/pseudoRandom');

/*
*   构造函数
*   @param {Number} baseSeed    基础种子
* */
var RandomManager = function(baseSeed){
    this.baseSeed = baseSeed;
    this.baseRndCreator = random.create(baseSeed);
    this.rndCreatorBySkillId = {};
    this.rndCreatorByEntityId = {};
    this.rndCreatorByUserThenTarget = {};
    this.allActors = [];
};

var pro = RandomManager.prototype;

pro._addForSkill = function(skill){
    if(!this.rndCreatorBySkillId[skill.id]){
        this.rndCreatorBySkillId[skill.id] = {};
    }
    this.rndCreatorBySkillId[skill.id]['effectivePro'] = random.create(this.baseRndCreator.nextInt());
    this.rndCreatorBySkillId[skill.id]['adjustCDPro'] = random.create(this.baseRndCreator.nextInt());
    this.rndCreatorBySkillId[skill.id]['dazePro'] = random.create(this.baseRndCreator.nextInt());
    this.rndCreatorBySkillId[skill.id]['petrifyPro'] = random.create(this.baseRndCreator.nextInt());
    this.rndCreatorBySkillId[skill.id]['rebirthPro'] = random.create(this.baseRndCreator.nextInt());
    this.rndCreatorBySkillId[skill.id]['silencePro'] = random.create(this.baseRndCreator.nextInt());
    this.rndCreatorBySkillId[skill.id]['multiHurtPro'] = random.create(this.baseRndCreator.nextInt());
};

pro._addForActor = function(actor){
    var self = this;
    self.allActors.push(actor);

    if(!self.rndCreatorByEntityId[actor.entityId]){
        self.rndCreatorByEntityId[actor.entityId] = {};
    }
    self.rndCreatorByEntityId[actor.entityId]['duckPro'] = random.create(self.baseRndCreator.nextInt());
    // 添加技能的部分
    // 按技能 id 升序排序
    var skills = actor.getAllSkills().sort(function(a, b){
        return (a.id - b.id);
    });
    _.each(skills, function(skill){
        self._addForSkill(skill);
    });
};

pro._addPair = function(user, target){
    if(!this.rndCreatorByUserThenTarget[user.entityId]){
        this.rndCreatorByUserThenTarget[user.entityId] = {};
    }
    if(!this.rndCreatorByUserThenTarget[user.entityId][target.entityId]){
        this.rndCreatorByUserThenTarget[user.entityId][target.entityId] = {};
    }
    this.rndCreatorByUserThenTarget[user.entityId][target.entityId]['critPro'] = random.create(this.baseRndCreator.nextInt());
};

pro._addForPair = function(newMobs){
    var self = this;
    if(!self.allActors){
        return;
    }
    self.allActors = self.allActors.sort(function(a, b){
        return (a.entityId - b.entityId);
    });
    _.each(newMobs, function(user){
        _.each(self.allActors, function(target){
            self._addPair(user, target);
            self._addPair(target, user);
        });
    });
};

/*
*   创建英雄及其技能的各种随机数生成器。关卡初始化时调用。
*   @param {Array}  heroes.
* */
pro.addForHero = function(heroes){
    // 按 entityId 升序排序
    var self = this,
        actors = heroes.sort(function(a, b){
            return (a.entityId - b.entityId);
        });
    self.heroes = actors;
    _.each(actors, function(actor){
        self._addForActor(actor);
    });
    self._addForPair(actors);
};

/*
*   创建怪物及其技能相关的各种随机数生成器。幕创建时调用。
 *   @param {Array} mobs
* */
pro.addForMob = function(mobs){
    // 按 entityId 升序排序
    var self = this,
        actors = mobs.sort(function(a, b){
            return (a.entityId - b.entityId);
        });

    _.each(actors, function(actor){
        self._addForActor(actor);
    });
    self._addForPair(actors);
};

pro.getSkillRndFloat = function(skillId, name){
    var creatorByName = this.rndCreatorBySkillId[skillId],
        creator;
    if(!creatorByName){
        console.error('getSkillRndFloat skillId %s not found!', skillId);
        return -1;
    }
    creator = creatorByName[name];
    if(!creator){
        console.error('getSkillRndFloat name %s not found!', name);
        return -1;
    }
    return creator.nextFloat();
};

pro.getActorRndFloat = function(entityId, name){
    var creatorByName = this.rndCreatorByEntityId[entityId],
        creator;
    if(!creatorByName){
        console.error('getActorRndFloat entityId %s not found!', entityId);
        return -1;
    }
    creator = creatorByName[name];
    if(!creator){
        console.error('getActorRndFloat name %s not found!', name);
        return -1;
    }
    return creator.nextFloat();
};

pro.getRndFloatByPair = function(user, target, name){
    var creatorByTarget = this.rndCreatorByUserThenTarget[user],
        creatorByName, creator;
    if(!creatorByTarget){
        console.error('getRndFloatByPair user %s not found!', user);
        return -1;
    }
    creatorByName = creatorByTarget[target];
    if(!creatorByName){
        console.error('getRndFloatByPair target %s not found!', target);
        return -1;
    }
    creator = creatorByName[name];
    if(!creator){
        console.error('getRndFloatByPair name %s not found!', name);
        return -1;
    }
    return creator.nextFloat();
};

module.exports = RandomManager;