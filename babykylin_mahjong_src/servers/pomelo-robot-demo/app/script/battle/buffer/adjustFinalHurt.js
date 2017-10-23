/**
 * Created by kilua on 14-9-15.
 */

var util = require('util');

var Buffer = require('./buffer');

var AdjustFinalHurt = function(owner, user, skill, tick){
    Buffer.call(this, owner, user, skill, tick);
};

util.inherits(AdjustFinalHurt, Buffer);

var pro = AdjustFinalHurt.prototype;

pro.getAdjustAddPer = function(){
    return Math.max(0, this.skill.param1);
};

pro.getAdjustAddVal = function(){
    return this.skill.getAddVal(this.user, this.owner);
};

module.exports = AdjustFinalHurt;