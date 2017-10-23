/**
 * Created by employee11 on 2016/2/29.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts'),
    flow = require('../../../consts/flow'),
    dataApi = require('../../../util/dataApi'),
    barrierManager = require('../../../domain/area/barrierManager'),
    utils = require('../../../util/utils'),
    dataUtils = require('../../../util/dataUtils'),
    dropUtils = require('../../../domain/area/dropUtils');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

/*解锁英雄*/
pro.openHeroLock = function ( msg , session , next ){
    var playerId = session.get('playerId');
    var player = area.getPlayer(playerId);
    //角色表的id
    var id = msg.id;
    var heroData = dataApi.HeroAttribute.findById(id);
    var heroId = heroData.heroId;
    //猎魔人不存在
    if(!heroData)
    {
        logger.error("not found id :%s by HeroAttribute.json",id);
        return next(null, {code: Code.AREA.HERO_NOT_EXIST});
    }

    var isConfigHeroLock = dataUtils.isConfigHeroLockById(id);
    if( !isConfigHeroLock )
    {
        return next(null, {code: Code.HERO.HERO_NOT_CONFIG_LOCK});
    }
    if (player.heroBag.isFull()) {
        return next(null, {code: Code.HERO.HERO_BAG_FULL, heroId: msg.heroId});
    }
    //解锁条件
    var removeLock = heroData.removeLock;
    var missionData = dataApi.Mission.findById( removeLock );
    if(!missionData)
    {
        logger.error("not found id :%s by Mission.json",removeLock);
        return next(null, {code: Code.MISSION.MISSION_ID_NOT_EXIST});
    }
    var missionType = missionData.missionType,
        groupType = missionData.groupType,
        conditionType = missionData.conditionType;

    var needCondition = missionData.conditionValue1;//missionData.conditionValue2;

    var currCondition = player.missionMgr.getCurrProgress(conditionType,missionType,groupType);

    //已经解锁过
    if(player.isOpenLockHero(heroId))
    {
        return next(null, {code: Code.HERO.HERO_OPEN_LUCK_OK});
    }

    if( currCondition < needCondition )
    {
        //logger.debug("Did not openHeroLock the conditions ");
        //return next(null, {code: Code.HERO.HERO_OPEN_LUCK_NOT_CONDITION});

        var heroData = dataApi.HeroAttribute.findById(id);
        if(player.diamondCnt < heroData.unlockDiamond){//钻石是否足够
            return next(null, {code: Code.DIAMOND_NUM_NOT_ENOUGH});
        }
        else{//扣除钻石
            player.addFreeBuyHero(id);
            // player.updateCanFetchFirstBuy(Consts.FETCH_TYPE.CAN_FETCH);

            var slot = player.addHero(heroData,null,null,flow.HERO_FLOW.HERO_OPEN_LOCK_GAIN);
            if (!slot) {
                return next(null, {code: Code.HERO.ADD_HERO_FAILED});
            }
            player.setDiamond(player.diamondCnt - heroData.unlockDiamond);

        }
    }

    player.addLockHero( heroId );
    return next(null, {code: Code.OK});
};

/*购买英雄*/
pro.buyHero = function (msg, session, next) {
    var playerId = session.get('playerId');
    var player = area.getPlayer(playerId);

    if (player.heroBag.isFull()) {
        return next(null, {code: Code.HERO.HERO_BAG_FULL, heroId: msg.heroId});
    }
    var heroData = dataApi.HeroAttribute.findById(msg.heroId);
    if (!heroData) {
        return next(null, {code: Code.HERO.HERO_IS_NOT_EXIST, heroId: msg.heroId});
    }

    var removeLock = heroData.removeLock;

    if(removeLock!=-1){
        var isConfigHeroLock = dataUtils.isConfigHeroLockById(msg.heroId);
        if( !isConfigHeroLock )
        {
            return next(null, {code: Code.HERO.HERO_NOT_CONFIG_LOCK});
        }

        //未解锁
        if(!player.isOpenLockHero(heroData.heroId))
        {
            return next(null, {code: Code.HERO.HERO_NOT_OPEN_LUCK});
        }
    }

    if (player.hasBuyHeroById(msg.heroId)) {
        if (player.getMoneyByType(heroData.buyMoneyType) < heroData.buyMoneyNum) {
            return next(null, {code: Code.AREA.LACK_MONEY, heroId: msg.heroId});
        }
        player.setMoneyByType(heroData.buyMoneyType, player.getMoneyByType(heroData.buyMoneyType) - heroData.buyMoneyNum,flow.MONEY_FLOW_COST.HERO_BUY);
        player.recordBuyHeroCount(msg.heroId);
        var slot = player.addHero(heroData,null,null,flow.HERO_FLOW.HERO_BUG_GAIN);
        if (!slot) {
            return next(null, {code: Code.HERO.ADD_HERO_FAILED, heroId: msg.heroId});
        }
        next(null, {code: Code.OK, cost: heroData.buyMoneyNum, heroId: msg.heroId, pos: slot});
    }
    else {
        if (player.getMoneyByType(heroData.firstBuyMoneyType) < heroData.firstBuyMoneyNum) {
            return next(null, {code: Code.DIAMOND_NUM_NOT_ENOUGH, heroId: msg.heroId});
        }
        // player.addHasBuyHero(msg.heroId);
        player.recordBuyHeroCount(msg.heroId);
        player.setMoneyByType( heroData.firstBuyMoneyType, player.getMoneyByType( heroData.firstBuyMoneyType ) - heroData.firstBuyMoneyNum,flow.MONEY_FLOW_COST.HERO_BUY);
        var slot = player.addHero(heroData,null,null,flow.HERO_FLOW.HERO_BUG_GAIN);
        if (!slot) {
            return next(null, {code: Code.HERO.ADD_HERO_FAILED, heroId: msg.heroId});
        }
        next(null, {code: Code.OK, cost: heroData.firstBuyMoneyNum, heroId: msg.heroId, pos: slot});
    }

    //player.missionMgr.progressUpdate(Consts.MISSION_CONDITION_TYPE.GET_XX_DIFF_HERO,Consts.MISSION_PROGRESS_VALUE_TYPE.TOTAL_VALUE);
    //player.missionMgr.progressUpdate(Consts.MISSION_CONDITION_TYPE.TO_XX_QUA_HERO_XX_CNT,Consts.MISSION_PROGRESS_VALUE_TYPE.TOTAL_VALUE);
};

/*获得购买英雄奖励*/
pro.drawFirstBuyAward = function (msg, session, next) {
    var playerId = session.get('playerId');
    var player = area.getPlayer(playerId);
    var configId = msg.configId;

    if (player.isBagFullVague()) {
        return next(null, {code: Code.AREA.SOMEONE_BAG_FULL});
    }

    if (!player.canDrwaBuyHeroAward(configId)) {
        return next(null, {code: Code.HERO.HERO_NOT_BUY});
    }
    if(player.hasDrwaBuyHeroAward(configId)){
        return next(null, {code: Code.HERO.HERO_AWARD_HAS_DRAW});
    }

    var heroData = dataApi.HeroAttribute.findById(configId);
    if (!heroData) {
        return next(null, {code: Code.HERO.HERO_IS_NOT_EXIST});
    }

    player.drawHasBuyHeroAward(configId);

    var drops = dropUtils.getDropItems(heroData.firstBuyRewardId);
    return next(null, {code: Code.OK, drops:player.applyDrops(drops,null,flow.ITEM_FLOW.FIRST_BUY_HERO)});
}

/*
 *   升级技能
 * */
pro.levelUpSkill = function (msg, session, next) {
    logger.debug('levelUpSkill playerId = %s, pos = %s, skillType = %s, addLV = %s', session.get('playerId'), msg.pos,
        msg.skillType, msg.addLV);
    var player = area.getPlayer(session.get('playerId')),
        heroBag = player.heroBag,
        hero = heroBag.getItemByPos(msg.pos),
        typeSkills;
    msg.addLV = msg.addLV || 1;
    if (!hero) {
        return next(null, {code: Code.AREA.HERO_NOT_EXIST});
    }
    typeSkills = hero.getSkillByType(msg.skillType);
    if (!typeSkills) {
        return next(null, {code: Code.AREA.HERO_SKILL_NOT_FOUND});
    }
    var unlockReqRoleQua = dataApi.HeroSkillLock.getUnlockQua( msg.skillType );// Consts.HERO_SKILL_UNLOCK_QUALITY[msg.skillType - 1] || 1;
    if (hero.quality < unlockReqRoleQua) {
        logger.debug('levelUpSkill hero.quality = %s, unlockReqRoleQua = %s', hero.quality, unlockReqRoleQua);
        return next(null, {code: Code.AREA.HERO_SKILL_LOCK});
    }
    var limitQua = unlockReqRoleQua-1;//Consts.HERO_SKILL_LV_LIMIT_QUALITY[msg.skillType - 1] || 1,
        roleData = dataApi.HeroAttribute.findByIndex({heroId: hero.roleId, quality: limitQua});
    if (!roleData) {
        logger.debug('levelUpSkill roleId = %s, limitQua = %s', hero.roleId, limitQua);
        return next(null, {code: Code.HERO.HERO_IS_NOT_EXIST});
    }
    var skill = _.first(typeSkills);
    if (!skill) {
        logger.debug('levelUpSkill the hero(pos = %s) has no the skill type %s', msg.pos, msg.skillType);
        return next(null, {code: Code.AREA.HERO_SKILL_NOT_FOUND});
    }
    if (skill.lv + msg.addLV > hero.curLevel - (roleData.maxLevel || 10) + 10) {
        logger.debug('levelUpSkill skill.lv = %s, hero.curLevel = %s, roleData.maxLevel = %s', skill.lv, hero.curLevel,
            roleData.maxLevel);
        return next(null, {code: Code.AREA.HERO_SKILL_REACH_MAX});
    }
    var cost = dataApi.SkillUpLevel.getLevelUpCost(msg.skillType, skill.getLevel(), msg.addLV);
    if (cost > player.goldCnt) {
        logger.debug('levelUpSkill cost = %s, goldCnt = %s', cost, player.goldCnt);
        return next(null, {code: Code.AREA.GOLD_NOT_ENOUGH});
    }
    player.set('goldCnt', player.goldCnt - cost);
    typeSkills.forEach(function (typeSkill) {
        typeSkill.levelUp(msg.addLV)
    });

    player.missionMgr.progressUpdate( Consts.MISSION_CONDITION_TYPE.HERO_UP_SKILL_CNT );
    //typeSkills.levelUp(msg.addLV);
    heroBag.emit('update', hero);
    next(null, {code: Code.OK, cost: cost, addLV: msg.addLV});


};

/**
 *   技能进阶
 * */
pro.advanceSkill = function (msg, session, next) {
    logger.debug('收到技能进阶指令：player：%s ,msg:%j', session.get('playerId'), msg);
    var player = area.getPlayer(session.get('playerId')),
        heroBag = player.heroBag,
        hero = heroBag.getItemByPos(msg.pos);
    if (!hero) {
        logger.warn("进阶角色不存在 msg:%j",msg);
        return next(null, {code: Code.AREA.HERO_NOT_EXIST});
    }
    var skill =  hero.getSkillById(msg.skillId);
    if(!skill) {
        logger.warn("进阶技能不存在 msg:%j",msg);
        return next(null, {code: Code.AREA.HERO_SKILL_NOT_FOUND});
    }
    if(skill.type !== msg.skillType ){
        logger.warn("技能类型不匹配 msg:%j",msg);
        return next(null, {code: Code.AREA.HERO_SKILL_NOT_FOUND});
    }
    var addLv = msg.addLV;
    var costCore = Number.POSITIVE_INFINITY;//花费的核心数
    var curMoney = player.getMoneyByType(Consts.MONEY_TYPE.HERO_CORE);
    switch (msg.skillType){
        case Consts.HERO_SKILL_TYPES.SUPER:
        case Consts.HERO_SKILL_TYPES.FEATURE:
        {
            if(msg.addLV > 1){
                logger.warn("主技能只能升1级 msg:%j",msg);
                return next(null, {code: Code.FAIL});
            }
            //核心技能
            if(skill.lv >= dataUtils.getOptionListValueByIndex("Skill_LvMax",hero.data.roleGrade - 1,"#")){
                logger.warn("已经到达最大等级 ");
                return next(null, {code: Code.AREA.LV_UPPER_LIMIT});
            }
            var smallSkills = hero.getSkillByType(Consts.HERO_SKILL_TYPES.ADVANCE_SMALL);
            var sLimitLv = dataUtils.getOptionListValueByIndex("Skill_SmallSkillLvMax",skill.lv - 1,"#");//获取小技能最高限制等级
            var skillUpLevel = dataApi.SkillUpLevel.findById(skill.lv+msg.addLV);
            if(!skillUpLevel){
                logger.warn("skillUpLevel 数据不存在  skill.lv:%j ，msg.addLV：%j",skill.lv,msg.addLV);
                return next(null, {code: Code.FAIL});
            }
            var canAdvance = true;
            _.each(smallSkills,function(sk){
                canAdvance &= (sk.lv === sLimitLv);
            });
            if(!canAdvance) {
                logger.warn("小技能未升级满");
                return next(null, {code: Code.AREA.LV_NOT_ENOUGH});
            }
            costCore = dataApi.SkillUpLevel.getLevelUpCost(msg.skillType,skill.lv,addLv,dataUtils.getOptionListValueByIndex("Skill_GradeForSkillUpRate",hero.data.roleGrade - 1,"#"));
            var i = 0;
            while(costCore>curMoney && addLv>0){
                if(i>1000) break;//防止死循环
                costCore = dataApi.SkillUpLevel.getLevelUpCost(msg.skillType,skill.lv,--addLv,dataUtils.getOptionListValueByIndex("Skill_GradeForSkillUpRate",hero.data.roleGrade - 1,"#"));
                i++;
            }
        }
            break;
        case Consts.HERO_SKILL_TYPES.ADVANCE_SMALL:
            //进阶小技能
        {
            var mainSkill = hero.getMainSkill();
            var sLimitLv = dataUtils.getOptionListValueByIndex("Skill_SmallSkillLvMax",mainSkill.lv - 1,"#");//获取小技能最高限制等级
            if(skill.lv >= sLimitLv){
                logger.warn("已经到达最大等级 ");
                return next(null, {code: Code.AREA.LV_UPPER_LIMIT});
            }
            if(sLimitLv<skill.lv+msg.addLV)
                addLv = sLimitLv-skill.lv;

            costCore = dataApi.SkillUpLevel.getLevelUpCost(msg.skillType,skill.lv,addLv,dataUtils.getOptionListValueByIndex("Skill_GradeForSkillUpRate",hero.data.roleGrade - 1,"#"));
            var i = 0;
            while(costCore>curMoney && addLv>0){
                if(i>1000) break;//防止死循环
                costCore = dataApi.SkillUpLevel.getLevelUpCost(msg.skillType,skill.lv,--addLv,dataUtils.getOptionListValueByIndex("Skill_GradeForSkillUpRate",hero.data.roleGrade - 1,"#"));
                i++;
            }
        }
            break;
        default:
            logger.warn("此技能类型无法升级 skillType=%s",msg.skillType);
            return next(null, {code: Code.FAIL});
    }

    if(addLv <= 0){
        logger.warn("消耗不够 costCore："+costCore);
        return next(null, {code: Code.AREA.LACK_MONEY});
    }
    player.setMoneyByType(Consts.MONEY_TYPE.HERO_CORE,curMoney - costCore,flow.MONEY_FLOW_COST.HERO_ADVANCE_SKILL);
    skill.levelUp(addLv);
    player.heroBag.emit('update', hero);
    //处理活动事件
    var curDress = [];//当前穿戴
    curDress.push(player.heroBag.getItemByPos(player.curHeroPos));
    _.each(player.curBrotherHeros,function(brother){
        curDress.push(player.heroBag.getItemByPos(brother.pos));
    });
    player.emit('onActHeroSkillUp' ,curDress);
    player.missionMgr.progressUpdate(Consts.MISSION_CONDITION_TYPE.SKILL_LV_UP_CNT,Consts.MISSION_PROGRESS_VALUE_TYPE.ADD_VALUE);
    player.missionMgr.progressUpdate(Consts.MISSION_CONDITION_TYPE.ANY_XX_HERO_SKILL_TO_XX_LV,Consts.MISSION_PROGRESS_VALUE_TYPE.MATH_MAX,0,[]);
    return next(null, {code: Code.OK,costCore:costCore,addLv:addLv});
}

/*
 *   是否有足够的材料
 * */
function haveEnoughItems(player, items) {
    return _.every(items || [], function (item) {
        var bagItem = player.bag.getItem(item.pos);
        return (!!bagItem && bagItem.getType() === Consts.ITEM_TYPE.HERO_EXP_ITEM
        && bagItem.itemCount >= item.count);
    });
}

/*
 *   计算材料总经验
 * */
function getItemTotalExp(player, items) {
    return _.reduce(items, function (memo, item) {
        var bagItem = player.bag.getItem(item.pos);
        if (bagItem && bagItem.getType() === Consts.ITEM_TYPE.HERO_EXP_ITEM) {
            return memo + bagItem.getValue() * item.count;
        }
        return memo;
    }, 0);
}

function getHeroTotalBasicExp(player, heroPosList) {
    return _.reduce(heroPosList, function (memo, heroPos) {
        var hero = player.heroBag.getItemByPos(heroPos);
        if (hero) {
            return memo + hero.getBasicExp() + hero.getTotalExp();
        }
        return memo;
    }, 0);
}

function isItemsValid(items) {
    var itemsByPos = _.groupBy(items, 'pos');
    return _.every(itemsByPos, function (itemList) {
        return itemList.length === 1;
    });
}

function isHeroPosListValid(heroPosList) {
    var heroPosInfoListByPos = _.groupBy(heroPosList, function (pos) {
        return pos;
    });
    return _.every(heroPosInfoListByPos, function (posInfoList) {
        return posInfoList.length === 1;
    });
}

function allHeroExists(player, heroPosList) {
    return _.every(heroPosList, function (heroPos) {
        return !!player.heroBag.getItemByPos(heroPos);
    });
}

/*
 *   升级猎魔人
 * */
pro.levelUp = function (msg, session, next) {
    logger.debug('levelUp playerId = %s, pos = %s, items = %j, heroPosList = %j', session.get('playerId'), msg.pos,
        msg.items, msg.heroPosList);
    var player = area.getPlayer(session.get('playerId')),
        items = msg.items || [],
        heroPosList = msg.heroPosList || [];
    if (!isItemsValid(items)) {
        return next(null, {code: Code.FAIL});
    }
    if (!isHeroPosListValid(heroPosList) || _.contains(heroPosList, msg.pos)) {
        logger.debug('levelUp heroPosList invalid!');
        return next(null, {code: Code.FAIL});
    }
    if (!allHeroExists(player, heroPosList)) {
        return next(null, {code: Code.AREA.HERO_NOT_EXIST});
    }
    if (!haveEnoughItems(player, items)) {
        var itemClient = null;//[139121]【客户端】升级时点的很快，就会出现code3012
        for(var i = 0 ; i < items.length ; i ++){
            var bagItem = player.bag.getItem(items[i].pos);
            if(!!bagItem && bagItem.getType() === Consts.ITEM_TYPE.HERO_EXP_ITEM && bagItem.itemCount >= items[i].count){
                itemClient = bagItem.getClientInfo();
                break;
            }
        }
        return next(null, {code: Code.AREA.ITEM_NOT_ENOUGH,lackItem:itemClient});
    }
    var itemTotalExp = getItemTotalExp(player, items),
        heroTotalBasicExp = getHeroTotalBasicExp(player, heroPosList),
        totalCost = Math.ceil((itemTotalExp + heroTotalBasicExp) * dataUtils.getOptionValue(Consts.CONFIG.LV_UP_COST_COE, 1));
    if (totalCost > player.goldCnt) {
        logger.debug('levelUp totalCost = %s, player.goldCnt = %s', totalCost, player.goldCnt);
        return next(null, {code: Code.AREA.GOLD_NOT_ENOUGH});
    }
    var hero = player.heroBag.getItemByPos(msg.pos);
    if (!hero) {
        return next(null, {code: Code.AREA.HERO_NOT_EXIST});
    }
    // [140361]改进：角色升级突破的规则修改  等级上限改为根据通关章节获取
    var newBarrierId = player.passedBarrierMgr.getNewBarrierId(Consts.CHAPTER_TYPE.NORMAL);
    var maxLevel = dataUtils.getOptionValue("Role_InityalLvMax", 15);
    if (newBarrierId !== 0) {
        var barrierData = dataApi.Custom.findById(newBarrierId);
        maxLevel = dataApi.Chapter.getMaxLevelByBarrier(newBarrierId,barrierData.chapterId);
        // maxLevel = chapterData.maxLevel;
    }
    if (hero.getLV() >= maxLevel) {
        logger.debug('levelUp lv Limit curLevel: %s > maxLevel:%s  pos:%s quality:%s',hero.getLV(),maxLevel,hero.pos,hero.quality);
        return next(null, {code: Code.AREA.HERO_REACH_MAX_LV});
    }
    // 计算猎魔人升级技能消耗
    var totalReturn = 0;//TODO:返还技能升级消耗--涉及到旧的升级逻辑先按0处理
    // var totalReturn = _.reduce(heroPosList, function (memo, heroPos) {
    //     var hero = player.heroBag.getItemByPos(heroPos);
    //     if (hero) {
    //         return memo += hero.getReturnSkillLevelUpGold();
    //     }
    //     return memo;
    // }, 0);
    player.set('goldCnt', player.goldCnt - totalCost + totalReturn);
    player.bag.removeItems(items);
    player.heroBag.removeByPosList(heroPosList);
    hero.levelUp(itemTotalExp + heroTotalBasicExp,maxLevel);
    player.checkUpdateLV(hero.curLevel);
    player.heroBag.emit('update', hero);

    player.missionMgr.progressUpdate( Consts.MISSION_CONDITION_TYPE.HERO_UP_CNT );
    switch (hero.data.roleType){
        case Consts.HERO_TYPE.HERO:
            player.missionMgr.progressUpdate(Consts.MISSION_CONDITION_TYPE.HERO_MAX_LV,Consts.MISSION_PROGRESS_VALUE_TYPE.MATH_MAX,hero.getLV(),[{type:Consts.MAIL_PARAM_TYPE.CONFIG_VALUE,value:hero.data.id,dropType:Consts.DROP_TYPE.HERO}]);
            break;
        case Consts.HERO_TYPE.ARMOR:
            player.missionMgr.progressUpdate(Consts.MISSION_CONDITION_TYPE.HAVE_XX_ARMOR_TO_XX_LV,Consts.MISSION_PROGRESS_VALUE_TYPE.MATH_MAX,hero.getLV(),[{type:Consts.MAIL_PARAM_TYPE.CONFIG_VALUE,value:hero.data.id,dropType:Consts.DROP_TYPE.HERO}]);
            break;
        case Consts.HERO_TYPE.AEROCRAFT:
            player.missionMgr.progressUpdate(Consts.MISSION_CONDITION_TYPE.HAVE_XX_AEROCRAFT_TO_XX_LV,Consts.MISSION_PROGRESS_VALUE_TYPE.MATH_MAX,hero.getLV(),[{type:Consts.MAIL_PARAM_TYPE.CONFIG_VALUE,value:hero.data.id,dropType:Consts.DROP_TYPE.HERO}]);
            break;
        case Consts.HERO_TYPE.ARMS:
            player.missionMgr.progressUpdate(Consts.MISSION_CONDITION_TYPE.HAVE_XX_ARMS_TO_XX_LV,Consts.MISSION_PROGRESS_VALUE_TYPE.MATH_MAX,hero.getLV(),[{type:Consts.MAIL_PARAM_TYPE.CONFIG_VALUE,value:hero.data.id,dropType:Consts.DROP_TYPE.HERO}]);
            break;
        default:
            break;
    }
    player.missionMgr.progressUpdate(Consts.MISSION_CONDITION_TYPE.HERO_ANY_MAX_LV,Consts.MISSION_PROGRESS_VALUE_TYPE.MATH_MAX,hero.getLV(),[{type:Consts.MAIL_PARAM_TYPE.CONFIG_VALUE,value:hero.data.id,dropType:Consts.DROP_TYPE.HERO}]);
    var curDress = [];//当前穿戴
    curDress.push(player.heroBag.getItemByPos(player.curHeroPos));
    _.each(player.curBrotherHeros,function(brother){
        curDress.push(player.heroBag.getItemByPos(brother.pos));
    });
    player.emit('onActHeroLevelUp' ,curDress);

    //28 猎魔人升至某级
    // player.missionMgr.progressUpdate( Consts.MISSION_CONDITION_TYPE.HERO_LEVEL_UP, );

    next(null, {code: Code.OK, cost: totalCost, retGold: totalReturn});
};

/*
 *   猎魔人突破
 * */
pro.breakThrough = function (msg, session, next) {
    logger.debug('breakThrough playerId = %s, pos = %s, items = %j, heroPosList = %j', session.get('playerId'), msg.pos,
        msg.items, msg.heroPosList);
    var player = area.getPlayer(session.get('playerId')),
        items = msg.items || [],
        heroPosList = msg.heroPosList || [];
    if (!isItemsValid(items)) {
        logger.debug('breakThrough items invalid!');
        return next(null, {code: Code.FAIL});
    }
    if (!isHeroPosListValid(heroPosList) || _.contains(heroPosList, msg.pos)) {
        logger.debug('breakThrough heroPosList invalid!');
        return next(null, {code: Code.FAIL});
    }
    // 是否达到突破等级
    var hero = player.heroBag.getItemByPos(msg.pos);
    if (!hero) {
        return next(null, {code: Code.AREA.HERO_NOT_EXIST});
    }
    logger.debug('breakThrough current quality = %s', hero.quality);
    if (hero.getLV() < hero.getMaxLV()) {
        return next(null, {code: Code.AREA.HERO_LV_LOW});
    }

    // 转换材料列表
    function getSpecifiedItemCountByItemId(items) {
        var itemCountByItemId = {};
        items.forEach(function (item) {
            var bagItem = player.bag.getItem(item.pos);
            if (!bagItem) {
                return;
            }
            if (!itemCountByItemId[bagItem.itemId]) {
                itemCountByItemId[bagItem.itemId] = 0;
            }
            itemCountByItemId[bagItem.itemId] += Math.min(item.count, bagItem.itemCount);
        });
        return itemCountByItemId;
    }

    // 所需材料是否足够
    var reqItems = hero.getBreakThroughReqItems(),
        specifiedItemCountByItemId = getSpecifiedItemCountByItemId(items);

    function isItemEnough(reqItem) {
        var specifiedItemCount = specifiedItemCountByItemId[reqItem.itemId];
        return (specifiedItemCount && reqItem.count <= specifiedItemCount
        && reqItem.count <= player.bag.getItemTotal(reqItem.itemId));
    }

    if (!_.every(reqItems, isItemEnough)) {
        return next(null, {code: Code.AREA.ITEM_NOT_ENOUGH});
    }
    // 同名卡是否足够
    function getSpecifiedHeroCountByHeroId(heroPosList) {
        var heroCountByHeroId = {};
        heroPosList.forEach(function (heroPos) {
            var hero = player.heroBag.getItemByPos(heroPos);
            if (hero) {
                if (!heroCountByHeroId[hero.getHeroId()]) {
                    heroCountByHeroId[hero.getHeroId()] = 0;
                }
                heroCountByHeroId[hero.getHeroId()] += 1;
            }
        });
        return heroCountByHeroId;
    }

    function getBagHeroTotal(heroId) {
        var total = 0;
        player.heroBag.forEach(function (hero) {
            if (hero.getHeroId() === heroId) {
                total += 1;
            }
        });
        return total;
    }

    var reqHeroes = hero.getBreakThroughReqHeroes(),
        specifiedHeroCountByHeroId = getSpecifiedHeroCountByHeroId(heroPosList);

    function isHeroEnough(reqHero) {
        var specifiedHeroCount = specifiedHeroCountByHeroId[reqHero.heroId];
        return (specifiedHeroCount && reqHero.count <= specifiedHeroCount && reqHero.count <= getBagHeroTotal(reqHero.heroId));
    }

    logger.debug('breakThrough reqHeroes = %j, specifiedHeroCountByHeroId = %j', reqHeroes, specifiedHeroCountByHeroId);
    if (!_.every(reqHeroes, isHeroEnough)) {
        return next(null, {code: Code.AREA.LACK_HERO});
    }
    // 游戏币是否足够
    var cost = hero.getBreakThroughReqGold();
    if (player.goldCnt < cost) {
        return next(null, {code: Code.AREA.GOLD_NOT_ENOUGH});
    }
    // 扣除游戏币
    //player.set('goldCnt', player.goldCnt - cost);
    // 扣除材料
    player.bag.removeItems(items);
    // 计算猎魔人升级技能消耗
    var totalHeroCore = _.reduce(heroPosList, function (memo, heroPos) {
        var hero = player.heroBag.getItemByPos(heroPos);
        if (hero) {
            return memo += hero.getAdvanceSkillHeroCore();
        }
        return memo;
    }, 0);
    // 扣除同名卡
    player.heroBag.removeByPosList(heroPosList);


    // 返还技能加点消耗的武装核心,只返还作为材料的猎魔人的部分，作为突破目标的部分不返还
    player.setMoneyByType(Consts.MONEY_TYPE.HERO_CORE, player.heroCore + totalHeroCore,flow.MONEY_FLOW_GAIN.HERO_BREAKTHROUGH_GAIN);
    player.setMoneyByType(Consts.MONEY_TYPE.GOLD, player.goldCnt - cost,flow.MONEY_FLOW_COST.HERO_BREAKTHROUGH_COST);
    // 给与新卡
    hero.breakThrough();
    player.heroBag.emit('update', hero);

   // player.missionMgr.progressUpdate(Consts.MISSION_CONDITION_TYPE.TO_XX_QUA_HERO_XX_CNT,Consts.MISSION_PROGRESS_VALUE_TYPE.TOTAL_VALUE);
    // 完成成就

    switch (hero.data.roleType){
        case Consts.HERO_TYPE.HERO:
            player.missionMgr.progressUpdate(Consts.MISSION_CONDITION_TYPE.TO_XX_QUA_HERO_XX_CNT,Consts.MISSION_PROGRESS_VALUE_TYPE.TOTAL_VALUE,null,[]);
            break;
        case Consts.HERO_TYPE.ARMOR:
            player.missionMgr.progressUpdate(Consts.MISSION_CONDITION_TYPE.HAVE_XX_ARMOR_TO_XX_QUA,Consts.MISSION_PROGRESS_VALUE_TYPE.TOTAL_VALUE,null,[]);
            break;
        case Consts.HERO_TYPE.AEROCRAFT:
            player.missionMgr.progressUpdate(Consts.MISSION_CONDITION_TYPE.HAVE_XX_AEROCRAFT_TO_XX_QUA,Consts.MISSION_PROGRESS_VALUE_TYPE.TOTAL_VALUE,null,[]);
            break;
        case Consts.HERO_TYPE.ARMS:
            player.missionMgr.progressUpdate(Consts.MISSION_CONDITION_TYPE.HAVE_XX_ARMS_TO_XX_QUA,Consts.MISSION_PROGRESS_VALUE_TYPE.TOTAL_VALUE,null,[]);
            break;
        default:
            break;
    }
        player.missionMgr.progressUpdate(Consts.MISSION_CONDITION_TYPE.HERO_ANY_HAVE_XX_TO_XX_QUA,Consts.MISSION_PROGRESS_VALUE_TYPE.TOTAL_VALUE,null,[]);

    // player.missionMgr.progressUpdateHero( hero );

    var curDress = [];//当前穿戴
    curDress.push(player.heroBag.getItemByPos(player.curHeroPos));
    _.each(player.curBrotherHeros,function(brother){
        curDress.push(player.heroBag.getItemByPos(brother.pos));
    });
    player.emit('onActHeroBreak' ,curDress);

    next(null, {code: Code.OK, cost: cost, totalHeroCore: totalHeroCore, heroId: hero.getHeroId()});
};

/*
 *   复活猎魔人
 * */
pro.revive = function (msg, session, next) {
    logger.debug('revive playerId = %s, pos = %s', session.get('playerId'), msg.pos);
    var player = area.getPlayer(session.get('playerId')),
        hero = player.heroBag.getItemByPos(msg.pos),
        barrier = barrierManager.getBarrier(player.id);
    if (!barrier) {
        return next(null, {code: Code.AREA.NOT_IN_BARRIER});
    }
    if (!hero) {
        return next(null, {code: Code.AREA.HERO_NOT_EXIST});
    }
    if (barrier.reviveCnt >= dataUtils.getOptionValue(Consts.CONFIG.REVIVE_MAX, 0)) {
        logger.debug('revive barrier.reviveCnt = %s, option = %s', barrier.reviveCnt, dataUtils.getOptionValue(Consts.CONFIG.REVIVE_MAX, 0));
        return next(null, {code: Code.AREA.REACH_REVIVE_MAX});
    }
    var cost = dataUtils.getOptionListValueByIndex(Consts.CONFIG.REVIVE_COST, barrier.reviveCnt);
    if (player.diamondCnt < cost) {
        return next(null, {code: Code.DIAMOND_NUM_NOT_ENOUGH});
    }
    barrier.doRevive();

    player.setMoneyByType(Consts.MONEY_TYPE.DIAMOND,player.diamondCnt - cost,flow.MONEY_FLOW_COST.FIGHT_RESURRECTION);
    hero.revive();
    next(null, {code: Code.OK, cost: cost});
};

//角色-拆分
pro.splittingUp = function (msg , session ,next ) {
    var playerId =session.get('playerId');
    logger.debug('splittingUp playerId = %s,  pos = %s ', playerId, msg.pos);
    var player = area.getPlayer(playerId);
    var hero = player.heroBag.getItemByPos(msg.pos);
    if (null==hero) {
        return next(null, {code: Code.AREA.HERO_NOT_EXIST});
    }

    var temList = player.checkIsHaveFightHero( [msg.pos] );
    if( _.size(temList)>0 ){
        logger.debug('fight hero can~t splittingUp');
        return next(null, {code: Code.HERO.HERO_IS_FIGHT});
    }

    var needRoleQuality = hero.quality;
    var data = dataApi.SplittingUp.findById(needRoleQuality);
    if( data == null ){
        return next(null, {code: Code.HERO.HERO_NOT_CAN_SPLITTINGUP});
    }

    var needDiamond = data.needDiamond;
    if( needDiamond> player.diamondCnt ){
        return next(null, {code: Code.DIAMOND_NUM_NOT_ENOUGH});
    }

    var needGold = data.needGold;
    if(needGold>player.goldCnt){
        return next(null, {code: Code.AREA.GOLD_NOT_ENOUGH});
    }

    //拆分获得的该角色品阶
    var newRoleQuality = data.newRoleQuality;

    //拆分获得的该角色数量
    var newRoleNum= data.newRoleNum;

    if (player.heroBag.getEmptySlotCnt() < newRoleNum ) {
        return next(null, {code: Code.HERO.HERO_BAG_FULL});
    }

    //角色ID
    var heroId = hero.data.heroId;

    var newHeroAttribute = dataApi.HeroAttribute.findByIndex({heroId:heroId,quality:newRoleQuality});

    if( newHeroAttribute == null ) {
        return next(null, { code: Code.HERO.HERO_NOT_FOUND });
    }

    //扣除数据
    player.setMoneyByType(Consts.MONEY_TYPE.DIAMOND,player.diamondCnt - needDiamond);
    player.setMoneyByType(Consts.MONEY_TYPE.GOLD,player.goldCnt - needGold);
    player.heroBag.remove( msg.pos );
    var maxLevel = newHeroAttribute.maxLevel;

    var heroList = [];
    for( var i=0;i<newRoleNum;++i ) {
        if(i == 0 ){
            var tempHeroPos =   player.addHero( newHeroAttribute,0,maxLevel);
            var tempHero = player.heroBag.getItemByPos(tempHeroPos)
            heroList.push( tempHero.getClientInfo());
        }
        else{
            var tempHeroPos =  player.addHero( newHeroAttribute );
            var tempHero = player.heroBag.getItemByPos(tempHeroPos)
            heroList.push( tempHero.getClientInfo());
        }
    }
    return next(null, { code: Code.OK,heroList:heroList });
};

//角色-聚变
pro.compose = function (msg , session ,next ) {
    var playerId =session.get('playerId');
    var qua = msg.needRoleQuality || 0;
    logger.debug('heroHandler.compose playerId : %s, qua = %s',playerId,qua);

    var player = area.getPlayer(playerId);
    var id = msg.id;
    var heroPosList = msg.heroPosList;
    if( !id || !heroPosList ) {
        logger.error( 'error : heroHandler.compose client data is Error (id or heroPosList)');
        return next(null, {code: Code.FAIL});
    }

    var tempList = player.checkIsHaveFightHero( heroPosList );
    if( _.size(tempList)>0 ){
        logger.debug('fight hero can~t compose');
        return next(null, {code: Code.HERO.HERO_IS_FIGHT});
    }

    var tempData = dataApi.Compose.findById(id);
    if(  !!tempData ) {
        //聚变所需角色品阶
        var needRoleQuality = tempData.needRoleQuality;
        qua=needRoleQuality;

        var errPosList = _.filter(heroPosList,function (tmpPos) {
                var tempHero = player.heroBag.getItemByPos(tmpPos);
                //角色不存在
                if( !tempHero ) {
                    logger.error( 'error : - heroHandler.compose hero pos:%s not found  ',tmpPos);
                    return true;
                }else{
                    if(tempHero.quality !=needRoleQuality ){
                        return true;
                    }
                }
                return false;
        });

        if( _.size(errPosList)>0 ){
            logger.error( 'error : heroHandler.compose hero quality not Legitimate ');
            return next(null, {code: Code.HERO.HERO_COMPOSE_QUA_ERROR});
        }

        //所需角色数量
        var needRoleNum =  tempData.needRoleNum;
        var currChoiceNum = _.size(heroPosList);
        if(needRoleNum!=currChoiceNum) {
            logger.error( 'error : heroHandler.compose needNum  - needRoleNum : %s , currChoiceNum : %s ',newRoleId ,currChoiceNum);
            return next(null, {code: Code.HERO.HERO_COMPOSE_NUM_ERROR});
        }

        var needGold =  tempData.needGold;
        if(needGold>player.goldCnt){
            return next(null, {code: Code.AREA.GOLD_NOT_ENOUGH});
        }

        var needDiamond =  tempData.needDiamond;
        if( needDiamond> player.diamondCnt ){
            return next(null, {code: Code.DIAMOND_NUM_NOT_ENOUGH});
        }

        var roleGradeList =[];
        _.each(heroPosList,function (pos) {
            var tmpHero = player.heroBag.getItemByPos(pos);
            roleGradeList.push(tmpHero.data.roleGrade);
        });



        //
        var myGrade =  dataApi.Compose.getRandHero(roleGradeList,dataApi.ComposeRand.all());

        var myheroId=  dataApi.Compose.randHeroByGrade(dataApi.ComposeRand.findById(myGrade));

        var ComposeQualityToNewQualityTmp = dataUtils.getOptionList('ComposeQualityToNewQuality','#');
        var quaGetLv = {};
        for(var i = 0 ; i<ComposeQualityToNewQualityTmp.length; ++i){
            var ComposeQualityToNewQuality = utils.parseParams(ComposeQualityToNewQualityTmp[i],'&');
            quaGetLv[ComposeQualityToNewQuality[0]]= ComposeQualityToNewQuality[1];
        };

        var newHeroAttribute = dataApi.HeroAttribute.findByIndex({heroId:myheroId,quality:quaGetLv[qua]});

        if(_.isArray(newHeroAttribute)){
            newHeroAttribute = newHeroAttribute[0];
        }
        if(!newHeroAttribute) {
            return next(null, {code: Code.HERO.HERO_IS_NOT_EXIST});
        }
        var gradeToLvListTemp = utils.parseParams( dataUtils.getOptionValue('ComposeQualityToLv') , '#');
        var gradeLvList = [];
        var lastLv = 0;
        _.each(gradeToLvListTemp,function (data) {
            var tmp =  utils.parseParams( data , '&');
            var gradeTmp = {};
            gradeTmp.qua = tmp[0];
            gradeTmp.level = tmp[1];
            gradeLvList.push(gradeTmp);
            if(gradeTmp.level >lastLv){
                lastLv =gradeTmp.level;
            }
        });

        var myLvInfo = _.filter(gradeLvList,function (data) {
            return data.qua == qua;
        });

        var newRoleLevel = myLvInfo != null ? myLvInfo.level : lastLv;


        player.heroBag.removeByPosList(heroPosList);

        player.setMoneyByType(Consts.MONEY_TYPE.DIAMOND,player.diamondCnt - needDiamond,flow.MONEY_FLOW_COST.HERO_COMPOSE);
        player.setMoneyByType(Consts.MONEY_TYPE.GOLD,player.goldCnt - needGold,flow.MONEY_FLOW_COST.HERO_COMPOSE);

        var tempHeroPos =   player.addHero( newHeroAttribute,0,newRoleLevel,flow.HERO_FLOW.FRAG_COMPOSE_GAIN);
        var tempHero = player.heroBag.getItemByPos(tempHeroPos)
        return  next(null, { code: Code.OK,hero:tempHero.getClientInfo() });
    }
    return next(null, {code: Code.HERO.HERO_COMPOSE_ID_NOT_FOUND});
};

//角色--分解
pro.decompose = function(msg , session ,next ){
    var playerId =session.get('playerId');
    logger.debug('decompose playerId = %s,  pos = %s ', playerId, msg.slotList);
    var player = area.getPlayer(playerId);

    //是不是出战中
    var temList = player.checkIsHaveFightHero( msg.slotList );
    if( _.size(temList)>0 ){
        logger.debug('fight hero can~t splittingUp');
        return next(null, {code: Code.HERO.HERO_IS_FIGHT});
    }

    // 检查背包是否有足够空格--TODO：判断是否超过格子
    if (!player.bag.isHasPosition()) {
        next(null, {code: Code.AREA.BAG_IS_FULL});
        return;
    }
    var gainGold = 0;//获得的基础金币
    var gainExp = 0;//获得经验
    var rsGain = {money:0,needMat:{},heroCount:0};
    var heroData = {};
    var gainHeroCore = 0;
    var tempHeroCore = 0;
    for(var i=0;i<msg.slotList.length;i++){
        //背包里有没有
        var hero = player.heroBag.getItemByPos(msg.slotList[i]);
        if (null==hero) {
            return next(null, {code: Code.AREA.HERO_NOT_EXIST});
        }
        heroData = dataApi.HeroAttribute.findByIndex({heroId:hero.roleId,quality:hero.quality});
        if(!heroData){
            return next(null, {code: Code.AREA.HERO_NOT_EXIST});
        }

        var upgradeExpData = dataApi.UpgradeExp.findById(hero.curLevel);

        if(upgradeExpData){
            gainExp += upgradeExpData.totalExp;
        }else{
            return next(null, {code: Code.FAIL});
        }
        dataApi.HeroAttribute.getDecomposeValueByIndex({heroId:hero.roleId,quality:hero.quality},rsGain);
        tempHeroCore = rsGain.heroCount - tempHeroCore;
        //计算武装核心的数量
        gainHeroCore += tempHeroCore * dataApi.CommonParameter.getOptionListValueByIndex("Sys_RoleGradeToCoreNum",heroData.roleGrade-1,"#");
        //升级消耗的武装核心
        gainHeroCore += hero.getAdvanceSkillHeroCore();
        tempHeroCore = rsGain.heroCount;
    }
    gainGold = parseInt(gainExp * dataUtils.getOptionValue("lvupMoney", 0.1));
    gainGold += rsGain.money;
    var dropItems = [];
    var allItem = {};
    for(var key in rsGain.needMat){
        dropItems.push(dropUtils.makeItemDrop(parseInt(key),rsGain.needMat[key]));
        allItem[key] = rsGain.needMat[key];
    }
    
    //兑换成经验药水
    var makeExpItem = function(_exp){
        var expItems = dataApi.CommonParameter.getOptionList("ExpIcons","#");
        var tempExpItem;
        var gainExpItems={};
        for(var i = 0 ;i < expItems.length; i++){
            tempExpItem = dataApi.Items.findById(expItems[i]);
            if(tempExpItem){
                if(parseInt(_exp/tempExpItem.value) > 0){
                    gainExpItems[expItems[i]] = parseInt(_exp/tempExpItem.value);
                    _exp = _exp % tempExpItem.value;
                }
            }
        }
        return gainExpItems;
    }
    var gainExpList = makeExpItem(gainExp);
    for(var key in gainExpList){
        dropItems.push(dropUtils.makeItemDrop(parseInt(key),gainExpList[key]));
        allItem[key] = gainExpList[key];
    }

    // 检查背包是否有足够空格
    if (!player.bag.checkAddItems(allItem)) {
        next(null, {code: Code.AREA.BAG_IS_FULL});
        return;
    }

    var drops = player.applyDrops(dropItems,null,flow.ITEM_FLOW.HERO_DECOMPOSE_GAIN);
    player.setMoneyByType(Consts.MONEY_TYPE.GOLD,player.getMoneyByType(Consts.MONEY_TYPE.GOLD) + gainGold,flow.MONEY_FLOW_GAIN.HERO_DECOMPOSE_GAIN);
    player.setMoneyByType(Consts.MONEY_TYPE.HERO_CORE,player.getMoneyByType(Consts.MONEY_TYPE.HERO_CORE)+ gainHeroCore,flow.MONEY_FLOW_GAIN.HERO_DECOMPOSE_GAIN);

    //背包移除角色
    for(var j=0;j<msg.slotList.length;j++){
        player.heroBag.remove(msg.slotList[j]);
    }

    return next(null, {code: Code.OK,drops:drops,gold:gainGold,exp:gainExp,heroCore:gainHeroCore});
}

