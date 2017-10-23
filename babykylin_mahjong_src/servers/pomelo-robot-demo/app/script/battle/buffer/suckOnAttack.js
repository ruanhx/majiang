/**
 * Created by kilua on 14-8-18.
 */

var util = require('util');

var Buffer = require('./buffer');

var SuckOnAttack = function(owner, user, skill, tick){
    Buffer.call(this, owner, user, skill, tick);
};

util.inherits(SuckOnAttack, Buffer);

var pro = SuckOnAttack.prototype;

pro.getSuckHp = function(hurtVal){
    return this.skill.getSuckHp(this.user, this.owner, hurtVal);
};

module.exports = SuckOnAttack;