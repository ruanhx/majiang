/**
 * Created by kilua on 14-7-28.
 */

var _ = require('underscore');

var Buffer = require('./buffer'),
    BufferManager = require('./bufferManager');

var EffectManager = function(){
    this.effects = [];
};

EffectManager.prototype.add = function(entityId, prop, val){
    this.effects.push({entityId: entityId, prop: prop, val: val});
    return true;
};

EffectManager.prototype.load = function(effects){
    var self = this;
    effects = effects || [];
    self.effects = [];
    _.each(effects, function(effect){
        self.add(effect.entityId, effect.prop, effect.val);
    });
};

EffectManager.prototype.getData = function(){
    var effectDatas = [];
    _.each(this.effects, function(effect){
        effectDatas.push({entityId: effect.entityId, prop: effect.prop, val: effect.val});
    });
    return effectDatas;
};

var Hit = function(entityId){
    this.entityId = entityId;
    this.effects = new EffectManager();
    this.bufs = new BufferManager();
};

Hit.prototype.addBuff = function(buffId, skillId, val, buffEffects){
    this.addBuf = new Buffer(buffId, skillId, val, buffEffects);
};

Hit.prototype.addEffect = function(entityId, prop, val){
    return this.effects.add(entityId, prop, val);
};

Hit.prototype.addAtkEffect = function(entityId, prop, val){
    return this.effects.add(entityId, prop, val);
};

Hit.prototype.getData = function(){
    var result =  {
        entityId: this.entityId,
        bufs: this.bufs.getData(),
        isEffective: this.isEffective ? 1 : 0,
        isHit: this.isHit ? 1 : 0,
        isDuck: this.isDuck ? 1 : 0,
        isCrit: this.isCrit ? 1 : 0,
        effects: this.effects.getData(),
        hp: this.hp
    };
    if(this.addBuf){
        result.addBuf = this.addBuf.getData();
    }
    return result;
};

module.exports = Hit;