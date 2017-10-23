/**
 * Created by kilua on 14-7-24.
 */

var util = require('util');

var Skill = require('./skill');

var NullSkill = function(){

};

util.inherits(NullSkill, Skill);

var pro = NullSkill.prototype;

pro.getLeftRestoreTime = function(){
    return 0;
};

pro.adjustCD = function(curTick, adjustTime){
    // do nothing.
};

pro.useAtTarget = function(act, user, target, tick, hitCnt){

};

module.exports = NullSkill;