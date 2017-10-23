/**
 * Created by kilua on 14-8-6.
 */

var util = require('util');

var Buffer = require('./buffer'),
    Consts = require('../../consts');

var Dot = function(owner, user, skill, tick, hpEffect){
    Buffer.call(this, owner, user, skill, tick);
    this.hpEffect = hpEffect;
};

util.inherits(Dot, Buffer);

var pro = Dot.prototype;

pro.apply = function(imediate, tick, act, pomelo){
    this.lastTick = tick;
    this.owner.setHp(this.owner.hp + this.hpEffect);
    // buffer 作用效果
    //"message BufferEffect":{
    //    // 受 buffer 影响的对象 ID
    //    "optional uInt32 entityId": 1,
    //        // 当前身上的所有buf
    //        "repeated Buffer bufs": 2,
    //        // 影响值, 正、负分别表示加、减 HP
    //        "repeated Effect effect": 3,
    //        // buffer 处理后的剩余HP
    //        "optional uInt32 hp": 4
    //},
    var effect = {entityId: this.owner.entityId, prop: 'hp', val: this.hpEffect},
        buffEffect = {entityId: this.owner.entityId, bufs: this.owner.getBufferInfo(), effect: [effect], hp: this.owner.hp},
        buffEffects = [buffEffect],
        msg = this.getPack(buffEffects, tick);
    if(!imediate && !Consts.BATCH_REPORT){
        this.notifyServer(msg, pomelo);
    }
    return msg;
};

pro.getInfo = function(){
    return {
        id: this.id,
        skillId: this.skill.id,
        value: this.hpEffect
    };
};

module.exports = Dot;