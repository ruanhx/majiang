/**
 * Created with JetBrains WebStorm.
 * User: kilua
 * Date: 13-10-15
 * Time: 下午1:41
 * To change this template use File | Settings | File Templates.
 */

var util = require('util');

var _ = require('underscore'),
    logger = require('log4js').getLogger(__filename);

var Entity = require('./entity'),
    Consts = require('../consts'),
    card = require('./card'),
    EquipBag = require('../bag/equipBag');

var CardManager = function(cards){
    this.cards = this.loadCards(cards);
    var self = this;
    self.cardIds = [];
    _.each(cards, function(card){
        self.cardIds.push(card.id);
    });
};

CardManager.prototype.clear = function(){
    this.cards = {};
    this.cardIds = [];
};

CardManager.prototype.getCard = function(id){
    return this.cards[id];
};

CardManager.prototype.loadCards = function(cards){
    var result = {}, cardObj, cnt = 0;
    _.each(cards, function(cardInfo){
        if(result[cardInfo.id]){
            logger.error('loadCards dup card!card id = %s', cardInfo.id);
        }else{
            cardObj = card.create(cardInfo);
            if(cardObj){
                result[cardObj.id] = cardObj;
                cnt += 1;
            }
        }
    });
    logger.debug('loadCards ok!cnt = %s', cnt);
    return result;
};

CardManager.prototype.toJSON = function(){
    var info = {};
    _.each(this.cards, function(card){
        info[card.id] = card.toJSON();
    });
    return info;
};

/*
*   获取配置的卡牌数
* */
CardManager.prototype.getSelectCardCnt = function(){
    return _.filter(this.cards, function(cardObj){ return (cardObj.pos > 0); }).length;
};

/*
*   随机选定一些卡牌,以进入战斗
* */
CardManager.prototype.getRandomCards = function(maxCard){
    // 随机决定卡牌数，但不能超过所有卡牌数
    var cardIds = this.cardIds.slice(0),
        result = [],
        rndIdx;
    if(cardIds.length <= 0){
        return result;
    }
    _.range(_.random(1, cardIds.length)).forEach(function(idx){
        // 注意:random生成的数，可能包含其参数
        rndIdx = _.random(cardIds.length - 1);
        result.push({id: cardIds[rndIdx], pos: idx + 1});       // 随机选择一张
        // 从池中去除，以免重复选择
        cardIds.splice(rndIdx, 1);
    });
    return result;
};

var Player = function(opts){
    opts.type = opts.type || Consts.ENTITY_TYPE.PLAYER;
    Entity.call(this, opts);

    this.name = opts.name;
    this.level = opts.level;
    this.exp = opts.exp;
    this.maxExp = opts.maxExp;
    this.gender = opts.gender;
    this.energy = opts.energy;
    this.maxEnergy = opts.maxEnergy;
    this.maxCard = opts.maxCard;
    this.passedBarriers = opts.passedBarriers;
//    this.anger = opts.anger;
    this.gold = opts.gold;
    this.diamond = opts.diamond;
//    this.maxAnger = opts.maxAnger;
    this.status = opts.status;
    this.headCardGroupId = opts.headCardGroupId;
    this.drawBoxCnt = opts.drawBoxCnt;
    this.drawBoxTime = opts.drawBoxTime;
    this.globalExp = opts.globalExp;
    this.cardManager = new CardManager(opts.cards);
    this.athleticsCnt = opts.athleticsCnt;
    this.athleticsResetTime = opts.athleticsResetTime;
    this.athleticsRank = opts.athleticsRank;
    this.athleticsDrew = opts.athleticsDrew;
    this.bread = opts.bread;
    this.testTowerResetCnt = opts.testTowerResetCnt;
    this.haveCurrentEvent = opts.haveCurrentEvent;
    this.monthCardLife = opts.monthCardLife;
    this.yearCardLife = opts.yearCardLife;
    this.firstChargeTime = opts.firstChargeTime;
    this.cardConfigs = opts.cardConfigs;
    logger.info('create player %j', this.toJSON());
};

util.inherits(Player, Entity);

var pro = Player.prototype;

pro.loadEquipBag = function(equips){
    this.equipBag = new EquipBag(this, equips);
};

pro.addAnger = function(addCnt){
    this.anger = Math.min(this.anger + addCnt, this.maxAnger);
};

pro.canUseAnger = function(){
    return (this.anger >= this.maxAnger);
};

pro.clear = function(){
    this.name = '';
    this.exp = 0;
    this.maxExp = 0;
    this.gender = 0;
    this.energy = 0;
    this.maxEnergy = 0;
    this.maxCard = 0;
    this.passedBarriers = [];
    this.anger = 0;
    this.maxAnger = 0;
};

pro.toJSON = function(){
    var parentInfo = Entity.prototype.toJSON.call(this),
        info = {
            name: this.name,
            exp: this.exp,
            maxExp: this.maxExp,
            gender: this.gender,
            energy: this.energy,
            maxEnergy: this.maxEnergy,
            maxCard: this.maxCard,
            passedBarriers: this.passedBarriers,
            headCardGroupId: this.headCardGroupId,
            gold: this.gold,
            diamond: this.diamond,
            drawBoxCnt: this.drawBoxCnt,
            drawBoxTime: this.drawBoxTime,
            globalExp: this.globalExp,
            bread: this.bread,
            testTowerResetCnt: this.testTowerResetCnt,
            haveCurrentEvent: this.haveCurrentEvent,
            monthCardLife: this.monthCardLife,
            yearCardLife: this.yearCardLife,
            firstChargeTime: this.firstChargeTime
        };
    return _.extend(parentInfo, info);
};

pro.getHitRndGenerator = function(){
    return this.hitRndGenerator;
};

module.exports = Player;