/**
 * Created by kilua on 14-9-1.
 */

var util = require('util');

var Buffer = require('./buffer');

var DotAddition = function(owner, user, skill, tick){
    Buffer.call(this, owner, user, skill, tick);
};

util.inherits(DotAddition, Buffer);

var pro = DotAddition.prototype;

pro.getDotAdditionPer = function(){
    return this.skill.getAdditionPercent();
};

pro.getDotAdditionVal = function(){
    return this.skill.getAdditionVal(this.user, this.owner);
};

module.exports = DotAddition;