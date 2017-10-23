/**
 * Created by kilua on 14-8-29.
 */

var util = require('util');

var _ = require('underscore');

var Buffer = require('./buffer'),
    scopeSelector = require('../skill/scopeSelector'),
    Consts = require('../../consts'),
    utils = require('../../utils/utils');

var CounterStrike = function(owner, user, skill, tick){
    Buffer.call(this, owner, user, skill, tick);
    var targetPrior = utils.parseParams(this.skill.param3);
    // 根据策划需求，反击写死成“点”技能
    this.selector = scopeSelector.create(Consts.SKILL_SCOPE_TYPE.POINT, this.skill.param2, targetPrior);
};

util.inherits(CounterStrike, Buffer);

var pro = CounterStrike.prototype;

pro.getHpEffectVal = function(target){
    return this.skill.getHpEffectVal(this.owner, target);
};

pro.strike = function(us, enemies, curTick){
    var self = this,
        targets = self.selector.select(self.owner, us, enemies, curTick, false),
        effects = [];
    targets.forEach(function(target){
        var hpEffectVal = self.getHpEffectVal(target);
        target.setHp(target.hp + hpEffectVal);
        effects.push({entityId: target.entityId, prop: 'hp', val: hpEffectVal});
    });
    return effects;
};

module.exports = CounterStrike;