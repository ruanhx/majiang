/**
 * Created by kilua on 14-9-11.
 */

var util = require('util');

var Buffer = require('./buffer');

var MultiHurt = function(owner, user, skill, tick){
    Buffer.call(this, owner, user, skill, tick);
};

util.inherits(MultiHurt, Buffer);

var pro = MultiHurt.prototype;

pro.mayMultiHurt = function(){
    return this.skill.mayMultiHurt(this.owner.level);
};

pro.getAddPer = function(){
    return Math.max(this.skill.param1, 0);
};

pro.getAddVal = function(){
    return this.skill.getAddVal(this.user, this.owner);
};

module.exports = MultiHurt;