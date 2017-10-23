/**
 * Created by kilua on 14-8-28.
 */

var util = require('util');

var Buffer = require('./buffer'),
    Consts = require('../../consts');

var Shield = function(owner, user, skill, tick, hpEffect){
    Buffer.call(this, owner, user, skill, tick);
    this.hpEffect = hpEffect;
};

util.inherits(Shield, Buffer);

var pro = Shield.prototype;

pro.isOver = function(tick){
    if(Buffer.prototype.isOver.call(this, tick)){
        return true;
    }
    return (this.hpEffect <= 0);
};

/*
 *   获取抵消伤害数
 *   @param {Number} orgHurt negative value.
 *   @return {Number} hurt left.negative value.
 * */
pro.reduce = function(ortHurt){
    var reduceHurt = Math.min(Math.abs(ortHurt), this.hpEffect);
    this.hpEffect -= reduceHurt;
    return (ortHurt + reduceHurt);
};

pro.getInfo = function(){
    return {
        id: this.id,
        skillId: this.skill.id,
        value: this.hpEffect
    };
};

module.exports = Shield;