/**
 * Created with JetBrains WebStorm.
 * User: kilua
 * Date: 13-10-7
 * Time: 上午11:27
 * To change this template use File | Settings | File Templates.
 */

var cmds = require('../../netHandler'),
    Consts = require('../../consts');

var id = 1;

var Buffer = function(owner, user, skill, tick){
    this.id = id++;
    this.owner = owner;
    this.user = user;
    this.skill = skill;
    this.lastTime = skill.lastTime;
    this.interval = skill.interval;
    this.createTick = tick;
    this.lastTick = 0;

    if(this.isNegative()){
        this.owner.setLastAttacker(this.user);
    }
};

var pro = Buffer.prototype;

pro.isNegative = function(){
    return (this.skill.bufType === Consts.BUFF_TYPE.NEGATIVE);
};

pro.strike = function(us, enemies, curTick){
    return [];
};

pro.getType = function(){
    return this.skill.type;
};

pro.isAura = function(){
    return this.skill.isAura();
};

/*
 *   buffer 是否结束。子类可以覆盖。
 * */
pro.isOver = function(tick){
    if(this.isAura()){
        return false;
    }
    var totalLastTime = tick - this.createTick;
    if(totalLastTime > this.lastTime){
        return true;
    }
    return false;
};

/*
 *   buffer 是否可以生效。子类可以覆盖。
 * */
pro.mayApply = function(tick){
    if(this.interval === 0){
        return false;
    }
    if(this.lastTick === 0 || (tick - this.lastTick) >= this.interval){
        return true;
    }
    return false;
};

/*
 *   buffer 处理
 * */
pro.process = function(tick, act, pomelo){
    tick = tick || this.createTick;
    if(this.isOver(tick)){
        return null;
    }
    if(this.mayApply(tick)){
        return this.apply(false, tick, act, pomelo);
    }
    return null;
};

/*
 *   技能ID相同且来源相同，认为是同一个buff
 * */
pro.same = function(skillId, userEntityId){
    return (this.user.entityId === userEntityId && this.skill.id === skillId);
};

pro.apply = function(imediate, tick, act, pomelo){
    // 子类覆盖
    return null;
};

/*
*   组织上传给服务器端的封包数据
* */
pro.getPack = function(buffEffects, tick){
    return {bufferTakeEffect: {entityId: this.owner.entityId, bufId: this.id, effects: buffEffects, tick: tick}};
};
/*
*   通知服务器端，buff 生效
*   @param {Object} msg
* */
pro.notifyServer = function(msg, pomelo){
    var self = this;
    // 发送封包
    cmds.bufferTakeEffect(pomelo, msg, function(data){
        if(data.code === 200){
            console.info('bufferTakeEffect ok!entityId = %s, buf.id = %s', self.owner.entityId, self.id);
        }else{
            console.error('bufferTakeEffect error!code = %s, entityId = %s, buf.id = %s', data.code, self.owner.entityId,
                self.id);
        }
    });
};
/*
*   子类可以覆盖
* */
pro.getInfo = function(){
    return {
        id: this.id,
        skillId: this.skill.id
    };
};

/*
*   暴击加成百分比
* */
pro.getCritIncPercent = function(){
    return 0;
};

/*
 *   获取抵消伤害数
 *   @param {Number} orgHurt negative value.
 *   @return {Number} hurt left.negative value.
 * */
pro.reduce = function(ortHurt){
    return ortHurt;
};

pro.getDotAdditionPer = function(){
    return 0;
};

pro.getDotAdditionVal = function(){
    return 0;
};

/*
 *   增减的属性。子类可以覆盖
 * */
pro.getGrowCritPro = function(critPro){
    return 0;
};

pro.getGrowHitPro = function(hitPro){
    return 0;
};

/*
*   是否触发多倍伤害
* */
pro.mayMultiHurt = function(){
    return false;
};

/*
*   是否触发调整施法者CD
* */
pro.mayAdjust = function(){
    return false;
};

/*
*   追击 buff 增加的伤害倍率
* */
pro.getPursueAddPer = function(){
    return 0;
};

pro.getPursueAddVal = function(){
    return 0;
};

/*
*   调整最终伤害 buff 增加的伤害倍率
* */
pro.getAdjustAddPer = function(){
    return 0;
};

pro.getAdjustAddVal = function(){
    return 0;
};

pro.addMultiCutProps = function(hitCnt){
    // 默认空实现
};

pro.clearMultiCutProps = function(){
    // 默认空实现
};

pro.addProps = function(){
    // 默认空实现
};

pro.clearProps = function(){
    // 默认空实现
};

module.exports = Buffer;