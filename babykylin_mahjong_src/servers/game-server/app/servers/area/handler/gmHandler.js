/**
 * Created by Administrator on 2016/3/24 0024.
 */

var fs = require('fs');

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts'),
    flow = require('../../../consts/flow'),
    area = require('../../../domain/area/area'),
    dataApi = require('../../../util/dataApi'),
    dataUtils = require('../../../util/dataUtils'),
    Equip = require('../../../domain/entity/equip');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

pro.enabled = function () {
    return fs.existsSync(this.app.getBase() + '/config/1673f548eb73930cb3e9904d3a59bc1c');
};

pro.addItem = function (msg, session, next) {
    logger.debug('addItem playerId = %s, itemId = %s, count = %s', session.get('playerId'), msg.itemId, msg.count);
    var player = area.getPlayer(session.get('playerId')),
        playerId = player.id;
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    var itemData = dataApi.Items.findById(msg.itemId);
    if (!itemData) {
        logger.debug('addItem Items data with id %s not found!', msg.itemId);
        return next(null, {code: Code.FAIL});
    }
    var item = {playerId: playerId, itemId: msg.itemId, count: msg.count};
    if (!player.bag.canAdd(item)) {
        return next(null, {code: Code.AREA.NOT_ENOUGH_BAG_SLOTS});
    }


    if( itemData.type == Consts.ITEM_TYPE.KEY )
    {
        player.setMoneyByType(itemData.id, player.getMoneyByType(itemData.id) + msg.count,flow.MONEY_FLOW_GAIN.GM);
        return next(null, {code: Code.OK});
    }else  if( itemData.type == Consts.ITEM_TYPE.FRAG_ITME||itemData.type == Consts.ITEM_TYPE.EQUIP_CHIP){
        player.fragBag.addItem(item);
        return next(null, {code: Code.OK});
    }else{
        player.bag.addItem(item);
        return next(null, {code: Code.OK});
    }
};


/**
 *
 * */
pro.addFragItem = function (msg, session, next) {
    logger.debug('addItem playerId = %s, itemId = %s, count = %s', session.get('playerId'), msg.itemId, msg.count);
    var player = area.getPlayer(session.get('playerId')),
        playerId = player.id;
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    var itemData = dataApi.Items.findById(msg.itemId);
    if (!itemData) {
        logger.debug('addItem Items data with id %s not found!', msg.itemId);
        return next(null, {code: Code.FAIL});
    }
    var item = {playerId: playerId, itemId: msg.itemId, count: msg.count};
    if (!player.fragBag.canAdd(item)) {
        return next(null, {code: Code.AREA.NOT_ENOUGH_BAG_SLOTS});
    }


    if( itemData.type == Consts.ITEM_TYPE.KEY )
    {
        player.setMoneyByType(itemData.id, player.getMoneyByType(itemData.id) + msg.count,flow.MONEY_FLOW_GAIN.GM);
        return next(null, {code: Code.OK});
    }else  if( itemData.type == Consts.ITEM_TYPE.FRAG_ITME || itemData.type == Consts.ITEM_TYPE.EQUIP_CHIP){
        player.fragBag.addItem(item);
        return next(null, {code: Code.OK});
    }
    return next(null, {code: Code.FAIL});
};


pro.addHero = function (msg, session, next) {
    logger.debug('addHero playerId = %s, heroId = %s', session.get('playerId'), msg.heroId);
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    var heroData = dataApi.HeroAttribute.findById(msg.heroId);
    if (!heroData) {
        logger.debug('addHero HeroAttribute data with id %s not found!', msg.heroId);
        return next(null, {code: Code.FAIL});
    }
    var player = area.getPlayer(session.get('playerId'));
    if (player.heroBag.isFull()) {
        return next(null, {code: Code.HERO.HERO_BAG_FULL});
    }
   var tmpPos = player.addHero(heroData,null,null,flow.HERO_FLOW.GM_GAIN);
    next(null, {code: Code.OK,pos:tmpPos});
};

pro.setHeroLV = function (msg, session, next) {
    logger.debug('setHeroLV playerId = %s, pos = %s, level = %s', session.get('playerId'), msg.pos, msg.level);
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    var player = area.getPlayer(session.get('playerId')),
        hero = player.heroBag.getItemByPos(msg.pos);
    if (!hero) {
        return next(null, {code: Code.AREA.HERO_NOT_EXIST});
    }
    if (hero.setLevel(msg.level)) {
        player.heroBag.emit('update', hero);
    }
    next(null, {code: Code.OK});
};

pro.addPet = function (msg, session, next) {
    logger.debug('addPet playerId = %s, petId = %s', session.get('playerId'), msg.petId);
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    var petData = dataApi.PetAttribute.findById(msg.petId);
    if (!petData) {
        logger.debug('addPet PetAttribute data with id %s not found!', msg.petId);
        return next(null, {code: Code.FAIL});
    }
    var player = area.getPlayer(session.get('playerId'));
    if (player.petBag.isFull()) {
        return next(null, {code: Code.PET.PET_BAG_FULL});
    }
    player.addPet(petData);
    next(null, {code: Code.OK});
};

pro.setPetLV = function (msg, session, next) {
    logger.debug('setPetLV playerId = %s, pos = %s, level = %s', session.get('playerId'), msg.pos, msg.level);
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    var player = area.getPlayer(session.get('playerId')),
        pet = player.petBag.getItemByPos(msg.pos);
    if (!pet) {
        return next(null, {code: Code.AREA.PET_NOT_EXIST});
    }
    if (pet.setLevel(msg.level)) {
        player.petBag.emit('update', pet);
    }
    next(null, {code: Code.OK});
};

pro.setDiamond = function (msg, session, next) {
    logger.debug('setDiamond playerId = %s, diamond = %s', session.get('playerId'), msg.diamond);
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    var player = area.getPlayer(session.get('playerId'));
    player.setDiamond(Math.max(0, msg.diamond));


    //test
    var roleGradeList  = [1,2,3,4,5,1,2];

    var myGrade =  dataApi.Compose.getRandHero(roleGradeList,dataApi.ComposeRand.all());

    var newRoleId  =  dataApi.Compose.randHeroByGrade(myGrade,dataApi.ComposeRand.findById(myGrade));
    next(null, {code: Code.OK,newRoleId:newRoleId});
    //test
    next(null, {code: Code.OK});
};

pro.setGold = function (msg, session, next) {
    logger.debug('setGold playerId = %s, gold = %s', session.get('playerId'), msg.gold);
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    var player = area.getPlayer(session.get('playerId'));
    player.set('goldCnt', Math.max(0, msg.gold));
    next(null, {code: Code.OK});
};

pro.setSpirit = function (msg, session, next) {
    logger.debug('setSpirit playerId = %s, spirit = %s', session.get('playerId'), msg.spirit);
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    var player = area.getPlayer(session.get('playerId'));
    player.set('energy', Math.max(0, msg.spirit));
    next(null, {code: Code.OK});
};

pro.cleanItemBag = function (msg, session, next) {
    logger.debug('cleanItemBag playerId = %s', session.get('playerId'));
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    var player = area.getPlayer(session.get('playerId'));
    player.bag.clear();
    next(null, {code: Code.OK});
};

pro.cleanHeroBag = function (msg, session, next) {
    logger.debug('cleanHeroBag playerId = %s', session.get('playerId'));
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    var player = area.getPlayer(session.get('playerId'));
    player.heroBag.clear();
    next(null, {code: Code.OK});
};

pro.cleanPetBag = function (msg, session, next) {
    logger.debug('cleanPetBag playerId = %s', session.get('playerId'));
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    var player = area.getPlayer(session.get('playerId'));
    player.petBag.clear();
    next(null, {code: Code.OK});
};

pro.clearCustom = function (msg, session, next) {
    logger.debug('clearCustom playerId = %s, barrierId = %s', session.get('playerId'), msg.barrierId);
    var preBarriers = dataUtils.getPreBarriers(msg.barrierId),
        preChapters = dataUtils.getPreChapters(msg.barrierId),
        player = area.getPlayer(session.get('playerId'));
    //logger.debug('clearCustom preBarriers = %j, preChapters = %j', preBarriers, preChapters);
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    preBarriers.forEach(function (barrierId) {
        player.passedBarrierMgr.forcePassed(barrierId, 3);
    });
    preChapters.forEach(function (chapterId) {
        player.unlockChapterMgr.unlock(chapterId);
    });
    next(null, {code: Code.OK});
};

pro.clearCustomNow = function (msg, session, next) {
    logger.debug('clearCustomNow playerId = %s, barrierId = %s, star = %s', session.get('playerId'), msg.barrierId, msg.star);
    var star = Math.min(3, msg.star),
        player = area.getPlayer(session.get('playerId')),
        barrierData = dataApi.Custom.findById(msg.barrierId);
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    if (!barrierData) {
        return next(null, {code: Code.AREA.INVALID_BARRIER});
    }
    player.passedBarrierMgr.forcePassed(msg.barrierId, msg.star);
    var preChapters = dataUtils.getPreChapters(msg.barrierId);
    preChapters.forEach(function (chapterId) {
        player.unlockChapterMgr.unlock(chapterId);
    });
    next(null, {code: Code.OK});
};

/*
 *   模拟充值
 * */
pro.charge = function (msg, session, next) {
    logger.debug('charge playerId = %s, money = %s, diamond = %s, present = %s', session.get('playerId'), msg.money,
        msg.diamond, msg.present);
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    var player = area.getPlayer(session.get('playerId'));
    player.onCharge(msg.money, msg.diamond, msg.present);
    return next(null, {code: Code.OK, diamond: player.diamondCnt});
};

/*
 *   添加装备
 * */
pro.addEquip = function (msg, session, next) {
    logger.debug('addEquip playerId = %s, equipId = %s, cnt = %s', session.get('playerId'), msg.equipId, msg.cnt);
    var player = area.getPlayer(session.get('playerId')),
        equipData = dataApi.Equip.findById(msg.equipId);
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    if (!equipData) {
        logger.debug('addEquip [Equip] data not found!id = %s', msg.equipId);
        return next(null, {code: Code.FAIL});
    }
    if (player.equipBag.getEmptySlotCnt() < msg.cnt) {
        return next(null, {code: Code.AREA.NOT_ENOUGH_BAG_SLOTS});
    }
    _.each(_.range(msg.cnt), function () {
        var equip = new Equip({playerId: player.id, equipId: msg.equipId,isNew:0});
        player.equipBag.add(equip);
    });
    return next(null, {code: Code.OK});
};

/*
 *   添加战斗勋章
 * */
pro.addChapterKey = function (msg, session, next) {
    logger.debug('addChapterKey playerId = %s, cnt = %s', session.get('playerId'), msg.cnt);
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    var player = area.getPlayer(session.get('playerId'));
    player.set('keyCount', player.keyCount + msg.cnt);
    return next(null, {code: Code.OK});
};

/*
 *   添加竞技点
 * */
pro.addEndlessPkPoint = function (msg, session, next) {
    logger.debug('addEndlessPkPoint playerId = %s, cnt = %s', session.get('playerId'), msg.cnt);
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    var player = area.getPlayer(session.get('playerId'));
    player.set('comPoint', player.comPoint + msg.cnt);
    return next(null, {code: Code.OK});
};

/*
 *   添加熔炼值
 * */
pro.addEquipMeltPoint = function (msg, session, next) {
    logger.debug('addEquipMeltPoint playerId = %s, cnt = %s', session.get('playerId'), msg.cnt);
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    var player = area.getPlayer(session.get('playerId'));
    player.set('meltPoint', player.meltPoint + msg.cnt);
    return next(null, {code: Code.OK});
};

/*
 *   添加洗练石 add by tony
 * */
pro.addWashPoint = function( msg , session , next ){
    logger.debug('washPoint playerId = %s, cnt = %s', session.get('playerId'), msg.cnt);
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    var player = area.getPlayer(session.get('playerId'));
    player.set('washPoint',msg.cnt);// player.washPoint +
    return next(null, {code: Code.OK});
}

/*
 *   添加觉醒材料
 * */
pro.addWakeUpItem = function (msg, session, next) {
    logger.debug('addWakeUpItem playerId = %s, itemId = %s, count = %s', session.get('playerId'), msg.itemId, msg.count);
    var player = area.getPlayer(session.get('playerId')),
        playerId = player.id;
    if (!this.enabled()) {
        return next(null, {code: Code.FAIL});
    }
    var itemData = dataApi.Items.findById(msg.itemId);
    if (!itemData) {
        logger.debug('addWakeUpItem [Item] data with id %s not found!', msg.itemId);
        return next(null, {code: Code.FAIL});
    }
    var item = {playerId: playerId, itemId: msg.itemId, count: msg.count};
    if (!player.wakeUpBag.canAdd(item)) {
        return next(null, {code: Code.AREA.NOT_ENOUGH_BAG_SLOTS});
    }
    player.wakeUpBag.addItem(item);
    return next(null, {code: Code.OK});
};