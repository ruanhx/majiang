/**
 * Created with JetBrains WebStorm.
 * User: kilua
 * Date: 13-10-16
 * Time: 上午11:01
 * To change this template use File | Settings | File Templates.
 */

var util = require('util');

var logger = require('log4js').getLogger(__filename),
    _ = require('underscore');

var dataApi = require('../../data/dataApi'),
    formula = require('../formula'),
    Skill = require('../battle/skill'),
    Consts = require('../consts'),
    utils = require('../../../mylib/utils/lib/utils');

var card = module.exports = {};

var Card = function(opts){
    this.id = opts.id;
    this.cardId = opts.ID;
    this.name = opts.Name;
    this.initAbilityLV = opts.FLv;
    this.hpRatio = opts.Hp;
    this.atkRatio = opts.Atk;
    this.critRatio = opts.Cri;
    this.race = opts.Race;
    this.quality = opts.Qua;
    this.speed = opts.Spe;
    this.skillId = opts.SkillID;
    this.pos = opts.pos;
    this.superSkillLV = opts.superSkillLV;
    this.createTime = opts.createTime;
    this.entityId = opts.entityId;
};

var pro = Card.prototype;

pro.init = function(entityId, level){
    this.entityId = entityId;
    this.level = level;
    return true;
};

pro.toJSON = function(){
    return {
        id: this.id,
        cardId: this.cardId,
        level: this.level,
        entityId: this.entityId,
        pos: this.pos,
        createTime: this.createTime
    };
};

card.create = function(svrCardInfo){
    var cardOpts = dataApi.cardProperty.findById(svrCardInfo.cardId),
        card;
    if(!cardOpts){
        return null;
    }
    cardOpts.id = svrCardInfo.id;
    cardOpts.Race = cardOpts.race;  // 修正字段名差异
    cardOpts.pos = svrCardInfo.pos;
    cardOpts.superSkillLV = svrCardInfo.superSkillLV;
    card = new Card(cardOpts);
    if(!card.init(svrCardInfo.entityId, svrCardInfo.level)){
        return null;
    }
    return card;
};