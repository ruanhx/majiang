/**
 * Created by kilua on 14-9-12.
 */

var util = require('util');

var Buffer = require('./buffer');

var AdjustUserCD = function(owner, user, skill, tick){
    Buffer.call(this, owner, user, skill, tick);
};

util.inherits(AdjustUserCD, Buffer);

var pro = AdjustUserCD.prototype;

pro.mayAdjust = function(){
    return this.skill.mayAdjust(this.owner.level);
};

module.exports = AdjustUserCD;