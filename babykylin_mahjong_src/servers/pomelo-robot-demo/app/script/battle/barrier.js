/**
 * Created with JetBrains WebStorm.
 * User: kilua
 * Date: 13-10-15
 * Time: 下午2:36
 * To change this template use File | Settings | File Templates.
 */

var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var logger = require('log4js').getLogger(__filename),
    _ = require('underscore');

var Act = require('./act'),
    Consts = require('../consts'),
    dataApi = require('../../data/dataApi'),
    Hero = require('../entity/hero'),
    HeroAI = require('../AI/player/once'),
    RandomManager = require('./randomManager'),
    utils = require('../../../mylib/utils/lib/utils');

var Barrier = function(opts, pomelo){
    EventEmitter.call(this);

    this.id = opts.id;
    this.barrierId = opts.barrierId || 0;
    // load heroes.
    this.rndManager = new RandomManager(opts.baseSeed);
    this.pomelo = pomelo;
    this.player = opts.player;
    this.loadHeroes(opts.heroes);
    this.init();
    this.maxAct = opts.maxAct;
    // load act
    this.act = this.createAct(opts.act);
    logger.info('create barrier id = %s, barrierId = %s, maxAct = %s', this.id, this.barrierId, this.maxAct);
};

util.inherits(Barrier, EventEmitter);

var pro = Barrier.prototype;

pro.createAct = function(actData){
    var act = new Act(actData, this);
    utils.chainEvent(this, 'act.end', act, 'end');
    return act;
};

/*
*   关卡初始化
* */
pro.init = function(){
    var tick = Date.now();
    _.each(this.heroes, function(hero){
        // 初始化英雄
        hero.beforeEnterField(tick);
    });
};

pro.loadHeroes = function(heroes){
    // load heroes
    var self = this;
    self.heroes = [];
    self.heroControllers = [];
    _.each(heroes, function(hero){
        hero.rndManager = self.rndManager;
        hero.pomelo = self.pomelo;
        hero.owner = self.player;
        var heroObj = new Hero(hero),
            controller = new HeroAI(heroObj);
        heroObj.setController(controller);
        self.heroes.push(heroObj);
        self.heroControllers.push(controller);
        heroObj.applyAllEquipProps(self.player);
        logger.debug('load hero %j', heroObj);
    });
    self.rndManager.addForHero(self.heroes);
    self.activateGifts();
};

/*
 *   计算英雄各种天赋的数量
 *   @return {Object} gift stat like {"1": ?, "2": ?};
 * */
pro.getGiftStat = function(){
    var allGifts = [];
    this.heroes.forEach(function(heroObj){
        allGifts = allGifts.concat(heroObj.gifts);
    });
    return _.countBy(allGifts, function(gift){ return gift; });
};

/*
 *   激活卡牌天赋
 * */
pro.activateGifts = function(){
    var giftStat = this.getGiftStat();
    _.each(this.heroes, function(heroObj){
        heroObj.applyGiftGrowProps(giftStat);
    });
};

/*
 *   每一帧刷新
 * */
pro.onTick = function(currentTick){
    if(!!this.act){
        this.act.onTick(currentTick);
    }
};

/*
*   载入下一幕的数据
* */
pro.nextAct = function(actData){
    this.act = this.createAct(actData);
};

pro.hasNextAct = function(){
    return (this.act.id < this.maxAct);
};

module.exports = Barrier;
