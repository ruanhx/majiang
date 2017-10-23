/**
 * Created with JetBrains WebStorm.
 * User: kilua
 * Date: 13-10-15
 * Time: 下午2:16
 * To change this template use File | Settings | File Templates.
 */

var util = require('util');

var _ = require('underscore'),
    logger = require('log4js').getLogger(__filename);

var Character = require('./character'),
    Consts = require('../consts'),
    dataApi = require('../../data/dataApi');

var Mob = function(opts){
    var propData = dataApi.cardProperty.findById(opts.dataId);
    if(!propData){
        logger.error('cardProperty not found!card id = %s', opts.dataId);
        return;
    }
    opts = _.extend(opts, propData);
    opts.type = opts.type || Consts.ENTITY_TYPE.MOB;
    this.coe = opts.coe;
    Character.call(this, opts);
//    this.AIController = new OnceAIController(this);
    logger.info('create mob %j', this.toJSON());
};

util.inherits(Mob, Character);

var pro = Mob.prototype;

pro.getMaxHP = function(){
    return Math.floor(this.addTotal.get(this._getMaxHP(), 'growHP') * this.coe.hp + this.growHP);
};

pro.getAtk = function(){
    return Math.floor(this.addTotal.get(this._getAtk(), 'growAtk') * this.coe.atk + this.growAtk);
};

/*
 *   初始化力、智、敏等基础属性
 * */
pro.initBaseProps = function(){
    var abilities = this.getLevelAbilityData(this.getAbilityLV()),
        qualityCoe = this.getQualityCoe(this.quality);
    this.pow = qualityCoe * abilities.StdPowMob;
    this.IQ = qualityCoe * abilities.StdIQMob;
    this.agi = qualityCoe * abilities.StdAgiMob;
};

module.exports = Mob;
