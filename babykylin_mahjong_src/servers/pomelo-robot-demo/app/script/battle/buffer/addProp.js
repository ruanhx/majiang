/**
 * Created by kilua on 14-9-5.
 */

var util = require('util');

var Buffer = require('./buffer');

var AddProp = function(owner, user, skill, tick){
    Buffer.call(this, owner, user, skill, tick);
};

util.inherits(AddProp, Buffer);

var pro = AddProp.prototype;

pro.getGrowPow = function(){
    return this.skill.getGrowProp(this.owner.race, 'pow', this.owner.pow);
};

pro.getGrowIQ = function(){
    return this.skill.getGrowProp(this.owner.race, 'IQ', this.owner.IQ);
};

pro.getGrowAgi = function(){
    return this.skill.getGrowProp(this.owner.race, 'agi', this.owner.agi);
};

pro.getGrowAtk = function(){
    return this.skill.getGrowProp(this.owner.race, 'atk', this.owner.baseAtk);
};

pro.getGrowHP = function(){
    return this.skill.getGrowProp(this.owner.race, 'hp', this.owner.baseMaxHP);
};

pro.getGrowDef = function(){
    return this.skill.getGrowProp(this.owner.race, 'def', this.owner.baseDef);
};

pro.getGrowDuck = function(){
    return this.skill.getGrowProp(this.owner.race, 'duck', this.owner.baseDuck);
};

pro.getGrowDuckPro = function(){
    return this.skill.getGrowProp(this.owner.race, 'duckPro', this.owner.baseDuckPro);
};

pro.getGrowCrit = function(){
    return this.skill.getGrowProp(this.owner.race, 'crit', this.owner.baseCrit);
};

/*
 *   在 buff 拥有者使用各种技能时计算
 * */
pro.getGrowCritPro = function(critPro){
    return this.skill.getGrowProp(this.owner.race, 'critPro', critPro);
};

/*
 *   在 buff 拥有者使用各种技能时计算
 * */
pro.getGrowHitPro = function(hitPro){
    return this.skill.getGrowProp(this.owner.race, 'hitPro', hitPro);
};

pro.addProp = function(getFunc, prop, coe){
    var pFunc = this[getFunc],
        addVal;
    coe = coe || 1;
    if(typeof pFunc === 'function'){
        addVal = coe * pFunc.apply(this);
        if(addVal !== 0){
            this.owner[prop] += addVal;
            console.log('addProp entityId %s skillId %s prop %s addVal %s', this.owner.entityId, this.skill.id, prop, addVal);
        }
    }
};

pro.addProps = function(){
    var lastMaxHP = this.owner.getMaxHP(),
        diffMaxHP;
    this.addProp('getGrowPow', 'growPow');
    this.addProp('getGrowIQ', 'growIQ');
    this.addProp('getGrowAgi', 'growAgi');
    this.addProp('getGrowAtk', 'growAtk');
//    this.addProp('getGrowHP', 'hp');
    this.addProp('getGrowHP', 'growHP');
    this.addProp('getGrowDef', 'growDef');
    this.addProp('getGrowDuck', 'growDuck');
    this.addProp('getGrowCrit', 'growCrit');
    this.addProp('getGrowDuckPro', 'growDuckPro');
    // 计算血量变化，相应改变hp
    diffMaxHP = this.owner.getMaxHP() - lastMaxHP;
    this.owner.setHp(this.owner.hp + diffMaxHP);
//    console.log('###addProps diffMaxHP = %s', diffMaxHP);
};

pro.clearProps = function(){
    // 调试用
//    var lastMaxHP = this.owner.getMaxHP(),
//        diffMaxHP;
    this.addProp('getGrowPow', 'growPow', -1);
    this.addProp('getGrowIQ', 'growIQ', -1);
    this.addProp('getGrowAgi', 'growAgi', -1);
    this.addProp('getGrowAtk', 'growAtk', -1);
//    this.addProp('getGrowHP', 'hp', -1);
    this.addProp('getGrowHP', 'growHP', -1);
    if(this.owner.hp > this.owner.getMaxHP()){
        this.owner.setHp(this.owner.getMaxHP());
    }
//    diffMaxHP = this.owner.getMaxHP() - lastMaxHP;
//    console.log('###clearProps diffMaxHP = %s', diffMaxHP);
    this.addProp('getGrowDef', 'growDef', -1);
    this.addProp('getGrowDuck', 'growDuck', -1);
    this.addProp('getGrowCrit', 'growCrit', -1);
    this.addProp('getGrowDuckPro', 'growDuckPro', -1);
};

module.exports = AddProp;