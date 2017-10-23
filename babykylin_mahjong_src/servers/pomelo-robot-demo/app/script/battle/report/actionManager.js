/**
 * Created by kilua on 14-7-24.
 */

var _ = require('underscore');

var BufferManager = require('./bufferManager'),
    Hit = require('./hit');

var Action = function(skillId){
    this.skillId = skillId;
    this.hits = {};
};

Action.prototype.add = function(hitObj){
    var hit = this.hits[hitObj.entityId];
    if(hit){
        return false;
    }
    this.hits[hitObj.entityId] = hitObj;
    return true;
};

Action.prototype.addHit = function(hit){
    if(this.hits[hit.entityId]){
        return;
    }
    this.hits[hit.entityId] = hit;
};

Action.prototype.getHitData = function(){
    var hits = [];
    _.each(this.hits, function(hit){
        hits.push(hit.getData());
    });
    return hits;
};

Action.prototype.getData = function(){
    return {
        skillId: this.skillId,
        hits: this.getHitData()
    };
};

var ActionManager = function(entityId, tick){
    this.entityId = entityId;
    this.actions = [];
    this.bufs = new BufferManager();
    this.tick = tick;
};

var pro = ActionManager.prototype;

pro.getActionCnt = function(){
    return this.actions.length;
};

pro.addAction = function(skillId){
    var action = new Action(skillId);
    this.actions.push(action);
    return action;
};

pro.getActionData = function(){
    var actions = [];
    _.each(this.actions, function(action){
        actions.push(action.getData());
    });
    return actions;
};

pro.getData = function(){
    return {
        entityId: this.entityId,
        bufs: this.bufs.getData(),
        skillId: this.skillId,
        actions: this.getActionData(),
        hp: this.hp,
        tick: this.tick
    };
};

module.exports.create = function(entityId, tick, opts){
    var actions = new ActionManager(entityId, tick);
    if(opts){
        actions.load(opts);
    }
    return actions;
};