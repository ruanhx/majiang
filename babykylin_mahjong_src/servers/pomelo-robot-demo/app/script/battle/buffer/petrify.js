/**
 * Created by kilua on 14-8-15.
 */

var util = require('util');

var Buffer = require('./buffer');

var Petrify = function(owner, user, skill, tick){
    Buffer.call(this, owner, user, skill, tick);
};

util.inherits(Petrify, Buffer);

var pro = Petrify.prototype;

pro.getCritIncPercent = function(){
    return this.skill.param1;
};

module.exports = Petrify;