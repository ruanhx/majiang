/**
 * Created by kilua on 14-9-13.
 */

var util = require('util');

var Buffer = require('./buffer');

var Pursue = function(owner, user, skill, tick){
    Buffer.call(this, owner, user, skill, tick);
};

util.inherits(Pursue, Buffer);

var pro = Pursue.prototype;

pro.getPursueAddPer = function(){
    return Math.max(0, this.skill.param1);
};

pro.getPursueAddVal = function(){
    return this.skill.getAddVal(this.user, this.owner);
};

module.exports = Pursue;