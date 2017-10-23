/**
 * Created by kilua on 14-9-16.
 */

var util = require('util');

var _ = require('underscore'),
    logger = require('log4js').getLogger(__filename);

var Character = require('./character'),
    Consts = require('../consts'),
    dataApi = require('../../data/dataApi'),
    dataParser = require('../../data/dataParser');

var Hero = function(opts){
    var propData = dataApi.cardProperty.findById(opts.dataId);
    if(!propData){
        logger.error('cardProperty not found!card id = %s', opts.dataId);
        return;
    }
    opts = _.extend(opts, propData);
    opts.type = opts.type || Consts.ENTITY_TYPE.HERO;
    Character.call(this, opts);
    this.owner = opts.owner;
    logger.info('create hero %j', this.toJSON());
};

util.inherits(Hero, Character);

var pro = Hero.prototype;

pro.setHp = function(hp){
    if(this.isDead()){
        return;
    }
    this.hp = Math.min(Math.max(hp, 0), this.getMaxHP());
    // 主角不大于指定等级时，卡牌不死亡
    if(!!this.owner && this.owner.level <= dataParser.getOptionValue('fight', 'protectLv', 3)){
        logger.debug('setHp owner.level = %s protected, original hp = %s', this.owner.level, this.hp);
        this.hp = Math.max(1, this.hp);
    }
    if(this.isDead()){
        this.emit('onDead', this);
    }
};

/*
 *   初始化力、智、敏等基础属性
 * */
pro.initBaseProps = function(){
    var abilities = this.getLevelAbilityData(this.getAbilityLV()),
        qualityCoe = this.getQualityCoe(this.quality);
    this.pow = qualityCoe * abilities.StdPow;
    this.IQ = qualityCoe * abilities.StdIQ;
    this.agi = qualityCoe * abilities.StdAgi;
};

module.exports = Hero;