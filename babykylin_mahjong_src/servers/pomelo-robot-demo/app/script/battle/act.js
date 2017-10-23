/**
 * Created with JetBrains WebStorm.
 * User: kilua
 * Date: 13-10-15
 * Time: 下午2:37
 * To change this template use File | Settings | File Templates.
 */

var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var _ = require('underscore'),
    log4js = require('log4js'),
    logger = log4js.getLogger(__filename),
    loggerForAct = log4js.getLogger('act');

var Consts = require('../consts'),
    MobGroupManager = require('./mobGroupManager');

function onDead(actor){
    var act = this;
    if(!actor.checkRebirth()){
        // 移除此对象施放的光环
        var auraSkills = actor.skillMgr.getAuraSkills();
        _.each(auraSkills, function(skillObj){
            act.removeAuraBySkillId(skillObj.id);
        });

        //process.nextTick(function(){
        // 替补上场
        // 应该在导致这个死亡替补事件的技能施放完后，才施放光环技能
        act.checkSubstitution(actor);
        //});
    }
}

// 掉落信息
//"message Drop": {
//    // 掉落类型
//    "optional uInt32 type": 1,
//        // 对于不同掉落类型，有不同的意义
//        "optional uInt32 itemId": 2,
//        // 掉落数量
//        "optional uInt32 count": 3
//},

//"message MobDrop": {
//    "optional uInt32 entityId": 1,
//        "repeated Drop drops": 2
//},

var DropManager = function(mobDrops){
    this.load(mobDrops);
};

DropManager.prototype.load = function(mobDrops){
    var self = this;
    self.dropsByEntityId = {};
    _.each(mobDrops, function(mobDrop){
        self.dropsByEntityId[mobDrop.entityId] = mobDrop.drops;
        logger.debug('load drops %j', mobDrop.drops);
    });
};

var Act = function(opts, barrier){
    EventEmitter.call(this);
    opts = opts || {};
    this.id = opts.id;
    this.barrierId = opts.barrierId || 0;
    this.player = barrier.player;
    this.heroes = barrier.heroes;
    this.heroControllers = barrier.heroControllers;
    this.entitiesByEntityId = {};
    this.typeByEntityId = {};
    this.heroesByEntityId = {};
    this.enterField(this.heroes, Consts.SKILL_TARGET_TYPE.US);
    this.rndManager = barrier.rndManager;
    this.pomelo = barrier.pomelo;
    // 加载怪物
    if(opts.groups) {
        this.mobGroupMgr = new MobGroupManager(opts.groups, barrier.rndManager, this.barrierId, this.id, barrier.pomelo);
    }
//    // 出第一波怪
//    this.refreshMobs();
    // 加载掉落
    if(opts.drops) {
        this.dropMgr = new DropManager(opts.drops);
    }
    this.showEndMsg = false;
    this.report = [];
};

util.inherits(Act, EventEmitter);

var pro = Act.prototype;

/*
*   检查是否有替补并让替补上场
* */
pro.checkSubstitution = function(actor){
    if(actor.type !== Consts.ENTITY_TYPE.HERO){
        return;
    }
    var substitution = this.getEntityByPos(this.heroes, actor.pos);
    if(substitution){
        logger.debug('checkSubstitution substitution = %j', substitution);
        this.addEntity(substitution, Consts.SKILL_TARGET_TYPE.US);
        this.checkUseAuraSkill(this.currentTick);
    }
};

/*
*   搜索我方目标
* */
pro.getUs = function(actor){
    var self = this,
        myType = self.typeByEntityId[actor.entityId];
    return _.filter(self.entitiesByEntityId, function(entity){
        return (self.typeByEntityId[entity.entityId] === myType);
    });
};

/*
*   搜索敌方目标
* */
pro.getEnemies = function(actor){
    var self = this,
        myType = self.typeByEntityId[actor.entityId];
    return _.filter(self.entitiesByEntityId, function(entity){
        return (self.typeByEntityId[entity.entityId] !== myType);
    });
};

/*
*   对象上场
* */
pro.addEntity = function(entity, type){
    entity.removeAllListeners('onDead');  // 防止重复添加
    entity.on('onDead', onDead.bind(this));
    this.entitiesByEntityId[entity.entityId] = entity;
    this.typeByEntityId[entity.entityId] = type;
    logger.debug('addEntity entityId = %s, type = %s', entity.entityId, entity.type);
    if(entity.type === Consts.ENTITY_TYPE.HERO){
        this.heroesByEntityId[entity.entityId] = entity;
    }
};

/*
*   获取上场的对象
*   @param {Array} heroes   对象列表
*   @param {Number} pos     前、中、后，如果没有就使用替补
* */
pro.getEntityByPos = function(entities, pos){
    return _.find(entities, function(entity){
        return (!entity.isDead() && entity.pos % Consts.BATTLE_FIELD_POS.BACK === pos % Consts.BATTLE_FIELD_POS.BACK);
    });
};
/*
*   对象批量上场
*   @param {Array} entities
* */
pro.enterField = function(entities, type){
    var pos, entity;
    entities = _.sortBy(entities, function(entity){
        return entity.pos;
    });
    logger.debug('enterField entities = %j', entities);
    for(pos = Consts.BATTLE_FIELD_POS.FRONT; pos <= Consts.BATTLE_FIELD_POS.BACK; ++pos){
        entity = this.getEntityByPos(entities, pos);
        logger.debug('enterField pos = %s, entity = %j', pos, entity);
        if(entity){
            this.addEntity(entity, type);
        }
    }
};

/*
*   查找场上的目标
* */
pro.getEntityById = function(entityId){
    return this.entitiesByEntityId[entityId];
};

/*
*   从所有上场对象身上移除指定技能ID的光环
* */
pro.removeAuraBySkillId = function(skillId){
    _.each(this.entitiesByEntityId, function(entity){
        entity.buffMgr.removeAuraBySkillId(skillId);
    });
};

/*
*   查询是否暴击
* */
pro.isCrit = function(user, target){
    var critPro = user.getCritPro(target.getHitStdVal()),
        name = 'critPro',
        rndVal = this.rndManager.getRndFloatByPair(user.entityId, target.entityId, name);
    critPro += critPro * target.getCritIncPercent() + user.getGrowCritPro(critPro);
    return (rndVal < critPro) ? 1 : 0;
};

/*
*   获取当前这一波怪
*   @return {Array} 怪物列表
* */
pro.getCurMobs = function(){
    if(this.curGroup){
        return this.curGroup.mobs;
    }
    return [];
};

/*
*   出下一波怪
* */
pro.refreshMobs = function(){
    var curGroup = this.mobGroupMgr.nextGroup();
    if(curGroup){
        curGroup.refresh();
        this.enterField(curGroup.mobs, Consts.SKILL_TARGET_TYPE.ENEMY);
        logger.debug('refreshMobs group %j', curGroup);
    }
    return curGroup;
};

/*
*   清除所有场上对象身上的所有光环
* */
pro.clearAuras = function(){
    _.each(this.entitiesByEntityId, function(entity){
        if(entity.isDead()){
            return;
        }
        entity.buffMgr.clearAuras();
    });
};

pro.actorsCheckUseAuraSkill = function(actors, tick){
    var self = this;
    _.each(actors, function(actor){
        if(actor.isDead()){
            return;
        }
        var auraSkills = actor.skillMgr.getAuraSkills();
        self.report = self.report.concat(actor.controller.useSkills(auraSkills, self, tick, self.pomelo));
    });
};
/*
*   场上人员变动时，检查并使用光环
* */
pro.checkUseAuraSkill = function(tick){
    logger.debug('----------checkUseAuraSkill begin...--------');
    this.clearAuras();
    this.actorsCheckUseAuraSkill(this.heroesByEntityId, tick);
    if(this.curGroup){
        this.curGroup.checkUseAuraSkill(this, tick, this.pomelo);
    }
    logger.debug('------------checkUseAuraSkill end.---------');
};

/*
*   统计死亡数
* */
pro.getDeadCnt = function(actors){
    var stat = _.countBy(actors, function(actor){
        return (actor.isDead() ? 'dead' : 'alive');
    });
    return stat.dead || 0;
};
/*
*   此幕是否胜利
* */
pro.isVictory = function(){
    return (this.getDeadCnt(this.heroes) < this.heroes.length);
};

/*
*   本幕是否结束
* */
pro.isEnd = function(){
    if(this.getDeadCnt(this.heroes) >= this.heroes.length){
        logger.info('isEnd all heroes dead!');
        return true;
    }
    if(!this.curGroup){
        return false;
    }
    if(this.curGroup.isEnd()){
        // 本波结束
        //logger.info('isEnd group %s end!', this.curGroup.id);
        // 没有下一波
        return !this.mobGroupMgr.hasNext();
    }
    // 本波尚未结束
    return false;
};

/*
*   每一帧刷新
* */
pro.onTick = function(currentTick){
    var self = this;
    this.currentTick = currentTick;
    if(self.isEnd()){
        if(!self.showEndMsg){
            loggerForAct.info('onTick act %s end.', self.id);
            self.showEndMsg = true;

            this.emit('end', this);
        }
        return;
    }
    if(!this.curGroup || this.curGroup.isEnd()){
        this.curGroup = this.refreshMobs(currentTick);
        this.checkUseAuraSkill(currentTick);
    }
    // buff 处理
    _.each(self.heroesByEntityId, function(hero){
        self.report = self.report.concat(hero.processBufs(currentTick, self));
    });
    _.each(self.heroControllers, function(controller){
        if(!self.heroesByEntityId[controller.owner.entityId]){
            return;
        }
        self.report = self.report.concat(controller.run(self, currentTick, self.pomelo));
    });
    // buff 处理
    self.report = self.report.concat(self.curGroup.processBufs(currentTick, self));
    self.report = self.report.concat(self.curGroup.runAI(self, currentTick, self.pomelo));
};

module.exports = Act;
