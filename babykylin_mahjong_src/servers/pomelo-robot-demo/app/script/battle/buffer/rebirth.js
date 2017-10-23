/**
 * Created by kilua on 14-8-26.
 */

var util = require('util');

var Buffer = require('./buffer');

var Rebirth = function(owner, user, skill, tick){
    Buffer.call(this, owner, user, skill, tick);
};

util.inherits(Rebirth, Buffer);

var pro = Rebirth.prototype;

pro.mayRebirth = function(){
    return this.skill.mayRebirth(this.owner.level);
};

/*
 *   复活后的生命值
 * */
pro.getRebirthHp = function(){
    return this.skill.getRebirthHp(this.user, this.owner);
};

module.exports = Rebirth;