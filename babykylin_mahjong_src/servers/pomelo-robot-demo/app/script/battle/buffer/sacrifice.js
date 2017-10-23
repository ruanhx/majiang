/**
 * Created by kilua on 14-8-30.
 */

var util = require('util');

var _ = require('underscore');

var Buffer = require('./buffer'),
    Consts = require('../../consts'),
    utils = require('../../utils/utils'),
    scopeSelector = require('../skill/scopeSelector');

var Sacrifice = function(owner, user, skill, tick){
    Buffer.call(this, owner, user, skill, tick);
    this.selector = scopeSelector.create(Consts.SKILL_SCOPE_TYPE.POINT, this.skill.param2,
        utils.parseParams(this.skill.param3));
};

util.inherits(Sacrifice, Buffer);

var pro = Sacrifice.prototype;

pro.getHpEffectVal = function(target){
    return this.skill.getHpEffectVal(this.user, target);
};

pro.apply = function(imediate, tick, act, pomelo){
    this.lastTick = tick;
    // 搜索目标
    var self = this,
        us = act.getUs(self.owner),
        enemies = act.getEnemies(self.owner),
        targets = this.selector.select(self.owner, us, enemies, tick, false),
        buffEffects = [],
        msg;
    // 计算效果
    _.each(targets, function(target){
        var hpEffect = self.getHpEffectVal(target),
            effect = {prop: 'hp', val: hpEffect};
        // 结算效果
        target.setHp(target.hp + hpEffect);
        buffEffects.push({entityId: target.entityId, bufs: target.getBufferInfo(), effect: [effect], hp: target.hp});
    });
    msg = this.getPack(buffEffects, tick);
    if(!imediate && !Consts.BATCH_REPORT){
        this.notifyServer(msg, pomelo);
    }
    return msg;
};

module.exports = Sacrifice;