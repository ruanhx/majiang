/**
 * Created by kilua on 14-8-5.
 */

var util = require('util');

var _ = require('underscore'),
    log4js = require('log4js'),
    logger = log4js.getLogger(__filename);

var Mob = require('../entity/mob'),
    MobAI = require('../AI/mob/once'),
    dataParser = require('../../data/dataParser');

/***********************************************************************************************************************
 *   波次结束条件
 * *********************************************************************************************************************/
var GroupEndCondition = function(group, param){
    this.group = group;
    this.param = param;
};

GroupEndCondition.prototype.isEnd = function(){
    // 子类实现
};

/*
 *   默认条件
 * */
var AllDie = function(group, param){
    GroupEndCondition.call(this, group, param);
};

util.inherits(AllDie, GroupEndCondition);

AllDie.prototype.isEnd = function(){
    var deadCnt = 0;
    _.each(this.group.mobs, function(mobObj){
        if(mobObj.isDead()){
            deadCnt += 1;
        }
    });
    return (deadCnt >= this.group.mobs.length);
};

/*
 *   时间条件
 * */
var PassTime = function(group, param){
    GroupEndCondition.call(this, group, param);
};

util.inherits(PassTime, GroupEndCondition);

PassTime.prototype.isEnd = function(){
    return (Date.now() - this.group.startTick >= this.param * 1000);
};

/*
 *   指定 id 的怪全部死亡
 * */
var AllDieByDataId = function(group, param){
    GroupEndCondition.call(this, group, param);
};

util.inherits(AllDieByDataId, GroupEndCondition);

AllDieByDataId.prototype.isEnd = function(){
    var self = this,
        deadCnt = 0, total = 0;
    _.each(self.group.mobs, function(mobObj){
        if(mobObj.dataId === self.param){
            total += 1;
            if(mobObj.isDead()){
                deadCnt += 1;
            }
        }
    });
    return (deadCnt >= total);
};

/*
 *   工厂函数
 * */
function createGroupEndCondition(group, cond, param){
    cond = cond || 0;
    param = param || 0;
    switch (cond){
        case 0:
            return new AllDie(group, param);
        case 1:
            return new PassTime(group, param);
        case 2:
            return new AllDieByDataId(group, param);
        default :
            return new AllDie(group, param);
    }
}

/*
 *   一波怪
 * */
var MobGroup = function(opts){
    this.id = opts.id;
    this.data = opts.data;
    this.defCond = createGroupEndCondition(this);
    this.specialCond = createGroupEndCondition(this, this.data.cond, this.data.condParam);
    this.rndManager = opts.rndManager;
    this.pomelo = opts.pomelo;
    this.load(opts.mobs);
};

MobGroup.prototype.toJSON = function(){
    var mobs = [];
    _.each(this.mobs, function(mob){
        mobs.push(mob.toJSON());
    });
    return mobs;
};

MobGroup.prototype.load = function(mobs){
    var self = this,
        mobDataByPos = _.indexBy(this.data.mobs, 'pos');
    self.mobsByEntityId = {};
    // 建立按前中后排的索引
    self.mobsByPos = {};
    self.mobs = [];
    mobs = mobs || [];
    _.each(mobs, function(mobInfo){
        mobInfo.rndManager = self.rndManager;
        mobInfo.pomelo = self.pomelo;
        mobInfo.coe = mobDataByPos[mobInfo.pos].coe || {hp: 1, atk: 1};
        var mob = new Mob(mobInfo);
        self.mobs.push(mob);
        self.mobsByEntityId[mob.entityId] = mob;
        self.mobsByPos[mob.pos] = mob;
        logger.debug('load mob %j', mob);
    });
};

/*
 *   这波怪刷出来时，初始化
 * */
MobGroup.prototype.refresh = function(){
    var self = this;
    self.startTick = Date.now();
    self.controllers = [];
    _.each(self.mobs, function(mob){
        mob.beforeEnterField(self.startTick);
        var controller = new MobAI(mob);
        mob.setController(controller);
        self.controllers.push(controller);
    });
//    self.rndManager.addForMob(self.mobs);
};

MobGroup.prototype.processBufs = function(tick, act){
    var result = [];
    _.each(this.mobs, function(mob){
        result = result.concat(mob.processBufs(tick, act));
    });
    return result;
};

MobGroup.prototype.runAI = function(act, tick, pomelo){
    var self = this, result = [];
    _.each(self.controllers, function(controller){
        result = result.concat(controller.run(act, tick, pomelo));
    });
    return result;
};

MobGroup.prototype.checkUseAuraSkill = function(act, tick, pomelo){
    _.each(this.controllers, function(controller){
        var mob = controller.owner,
            auraSkills;
        if(mob.isDead()){
            return;
        }
        auraSkills = mob.skillMgr.getAuraSkills();
        act.report = act.report.concat(controller.useSkills(auraSkills, act, tick, pomelo));
    });
};

MobGroup.prototype.isEnd = function(){
    return (this.specialCond.isEnd() || this.defCond.isEnd());
};

/*
 *   波次管理
 * */
var MobGroupManager = function(groups, rndManager, barrierId, actId, pomelo){
    this.barrierId = barrierId;
    this.actId = actId;
    this.rndManager = rndManager;
    this.pomelo = pomelo;
    this.load(groups);
    this.curGroupIdx = 0;
};

MobGroupManager.prototype.load = function(groups){
    var self = this,
        allMobs = [];
    self.groups = [];
    self.groupsById = {};

    groups = groups || [];
    _.each(groups, function(group){
        group.data = dataParser.getMobGroup(self.barrierId, self.actId, group.id);
        group.rndManager = self.rndManager;
        group.pomelo = self.pomelo;
        var mobGroup = new MobGroup(group);
        self.groups.push(mobGroup);
        self.groupsById[mobGroup.id] = mobGroup;

        allMobs = allMobs.concat(mobGroup.mobs);
    });
    self.rndManager.addForMob(allMobs);
    // 按波次 ID 递增排序
    function sortByGroupId(a, b){
        return (a.id - b.id);
    }
    self.groups.sort(sortByGroupId);
};

MobGroupManager.prototype.hasNext = function(){
    return (this.curGroupIdx < this.groups.length - 1);
};

MobGroupManager.prototype.nextGroup = function(){
    return this.groups[this.curGroupIdx++];
};

module.exports = MobGroupManager;