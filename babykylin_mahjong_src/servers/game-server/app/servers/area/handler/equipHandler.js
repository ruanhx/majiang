/**
 * Created by kilua on 2016/7/1 0001.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts'),
    flow = require('../../../consts/flow'),
    dataUtils = require('../../../util/dataUtils'),
    dataApi = require('../../../util/dataApi'),
    equipWash = require('../../../domain/entity/equipWash'),
    Equip = require('../../../domain/entity/equip'),
    dropUtils = require('../../../domain/area/dropUtils');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

/*
 *   装备
 * */
pro.arm = function (msg, session, next) {
    logger.debug('arm pos = %s', msg.pos);

    var player = area.getPlayer(session.get('playerId'));

    var bf = player.armBag.isArmAll();
    if (player.armBag.arm(msg.pos)) {
        var af = player.armBag.isArmAll();
        if( !bf && af )
        {
            player.dataStatisticManager.refreshArmEquipFull(Date.now());
        }
        player.missionMgr.progressUpdate( Consts.MISSION_CONDITION_TYPE.OUT_ALL_EQUIP_TO_XX_LV,Consts.MISSION_PROGRESS_VALUE_TYPE.MATH_MAX);
        player.emit("onActEquipQuality",_.values(player.armBag.armDict));

        return next(null, {code: Code.OK});
    }
    return next(null, {code: Code.FAIL});
};

/**
 * 强化
 * @param msg
 * @param session
 * @param next
 */
pro.strengthen = function(msg, session, next){
    var player = area.getPlayer(session.get('playerId'));
    var part = msg.part;
    var addLv = 0;
    if(part === null){
        return next(null, {code: Code.AREA.EMPTY_PART});
    }
    var slot = player.armBag.getSlotByPart(part);
    if (!slot) {
        return next(null, {code: Code.AREA.EMPTY_PART});
    }
    var allNeedMoney = 0;
    var maxLevel = 0;//关卡限制等级
    var newBarrierId = player.passedBarrierMgr.getNewBarrierId(Consts.CHAPTER_TYPE.NORMAL);
    if (newBarrierId !== 0) {
        var barrierData = dataApi.Custom.findById(newBarrierId);
        maxLevel = dataApi.Chapter.getEquipStrengthenLvMax(newBarrierId,barrierData.chapterId);
    }
    //logger.error("强化 newBarrierId:%j,maxLevel:%j",newBarrierId,maxLevel);
    function oneStrengthen(){
        var tempLv = slot.strengthenLV+addLv;//当前等级
        if(tempLv>=maxLevel){
            return Code.AREA.STRENGTHEN_MAX;
        }
        //logger.error("强化 slot.strengthenLV:%j",tempLv,maxLevel);
        if (slot.strengthenMaxLV() === tempLv) {
            return Code.AREA.STRENGTHEN_MAX;
        }
        var strengthenData = dataApi.EquipStrengthen.findById(tempLv+1);
        var needMoney = (!strengthenData) ? Number.POSITIVE_INFINITY : (strengthenData.useGold||Number.POSITIVE_INFINITY);

        if (player.getMoneyByType(Consts.MONEY_TYPE.GOLD) < allNeedMoney + needMoney) {
            return Code.AREA.GOLD_NOT_ENOUGH;
        }
        addLv ++ ;
        allNeedMoney += needMoney;
        //判断暴击
        var times = dataUtils.getOptionValue("Equip_StrengthenDouble",0);
        var randValue = parseInt(Math.random()*10000);
        if(times*10000>randValue){
            addLv++;
        }
        return Code.OK;
    }
    var oneStrengthenRS =[];
    for(var i=0; i<msg.cnt; i++){
        var lv = addLv;
        var code = oneStrengthen();
        lv = addLv - lv;
        oneStrengthenRS.push({code:code,addLv:lv});
        if(code !== Code.OK){
            break;
        }
    }
    if(addLv>0){
        slot.strengthen(addLv);
        player.setMoneyByType(Consts.MONEY_TYPE.GOLD, player.getMoneyByType(Consts.MONEY_TYPE.GOLD) - allNeedMoney,flow.MONEY_FLOW_COST.EQUIP_STRENGTHEN);
        player.emit("onActEquipStrength",_.values(player.armBag.armDict));

        player.missionMgr.progressUpdate( Consts.MISSION_CONDITION_TYPE.STRENGTHEN_EQUIP_CNT );
        player.missionMgr.progressUpdate( Consts.MISSION_CONDITION_TYPE.ALL_EQUIP_STRENGTHEN_XX_LV,Consts.MISSION_PROGRESS_VALUE_TYPE.MATH_MAX );
    }
    return next(null, {code: Code.OK,oneStrengthenRS:oneStrengthenRS});
}

/*
 *   精炼
 * */
pro.refine = function (msg, session, next) {
    logger.debug('playerId = %s, posList = %s', session.get('playerId'), msg.posList);
    // 判断功能是否开放
    var player = area.getPlayer(session.get('playerId'));
    if (!player.funcOpen(Consts.FUNCTION.EQUIP_REFINE)) {
        return next(null, {code: Code.AREA.FUNC_DISABLED, posList: msg.posList});
    }

    var part = msg.part;
    var allExp = 0;
    var allNeedMoney = 0;
    // 指定装备是否存在
    var posList = msg.posList;
    _.each(posList,function (pos) {
        var equip = player.equipBag.getItemByPos(pos);
        if (!equip) {
            return next(null, {code: Code.AREA.NO_SUCH_EQUIP, posList:[pos]});
        }else{
            // 不能使用已装备的装备
            if (player.armBag.existByPos(pos)) {
                return next(null, {code: Code.AREA.EQUIP_ARMED, posList: [pos]});
            }
            //part = equip.getPart();
            allExp+=equip.getRefineExp();
            allNeedMoney += equip.getRefineGold();
        }
    });

    if(part==null){
        return next(null, {code: Code.AREA.EMPTY_PART, posList: msg.posList});
    }
    // 是否已达到顶级
    var slot = player.armBag.getSlotByPart(part);
    if (!slot) {
        return next(null, {code: Code.AREA.EMPTY_PART, posList: msg.posList});
    }
    if (slot.reachRefineMax()) {
        return next(null, {code: Code.AREA.REFINE_MAX, posList: msg.posList});
    }

    if (player.getMoneyByType(Consts.MONEY_TYPE.GOLD) < allNeedMoney) {
        return next(null, {code: Code.AREA.GOLD_NOT_ENOUGH, posList: msg.posList});
    }
    player.setMoneyByType(Consts.MONEY_TYPE.GOLD, player.getMoneyByType(Consts.MONEY_TYPE.GOLD) - allNeedMoney,flow.MONEY_FLOW_COST.EQUIP_OPEN_WASH);

    player.equipBag.removeByPosList(posList);
    slot.refine(allExp);

    player.missionMgr.progressUpdate( Consts.MISSION_CONDITION_TYPE.REFINE_EQUIP_CNT );

    player.dataStatisticManager.refreshDailyEquipData(Consts.EQUIP_STTE.DAILY_REFINE_CNT);

    //var minRefineLv = player.armBag.getRefineMinLv();
    player.missionMgr.progressUpdate( Consts.MISSION_CONDITION_TYPE.ALL_EQUIP_REFINE_XX_LV,Consts.MISSION_PROGRESS_VALUE_TYPE.MATH_MAX );

    logger.debug(" part : %s refineLV : %s",part ,slot.refineLV  );

    player.dataStatisticManager.refreshDailyEquipData( Consts.EQUIP_STTE.DAILY_EQUIP_LV , part ,slot.refineLV );
    player.emit("onActEquipLevelUp",_.values(player.armBag.armDict));
    return next(null, {
        code: Code.OK,
        posList: msg.posList,
        gold: player.getMoneyByType(Consts.MONEY_TYPE.GOLD),
        //dailyFreeRefine: player.dailyFreeRefine,
        //diamond: player.getMoneyByType(Consts.MONEY_TYPE.DIAMOND),
        //dailyDiamondRefine: player.dailyDiamondRefine
    });
};

/*
 *   觉醒
 * */
pro.wakeUp = function (msg, session, next) {
    logger.debug('wakeUp playerId = %s, part = %s', session.get('playerId'), msg.part);
    var player = area.getPlayer(session.get('playerId'));
    // 功能是否开启
    if (!player.funcOpen(Consts.FUNCTION.EQUIP_AWAKEN)) {
        return next(null, {code: Code.AREA.FUNC_DISABLED, part: msg.part});
    }
    var slot = player.armBag.getSlotByPart(msg.part);
    if (!slot) {
        return next(null, {code: Code.AREA.EMPTY_PART, part: msg.part});
    }
    // 判断金币是否足够
    if (player.getMoneyByType(Consts.MONEY_TYPE.GOLD) < slot.getWakeUpNeedGold()) {
        return next(null, {code: Code.AREA.GOLD_NOT_ENOUGH, part: msg.part});
    }
    // 判断材料是否足够
    var materials = slot.getWakeUpNeedMaterials();
    if (!_.every(materials, function (material) {
            //logger.debug('wakeUp %s total = %s, require = %s', material.itemId, player.bag.getItemTotal(material.itemId), material.count);
            return player.wakeUpBag.getItemTotal(material.itemId) >= material.count;
        })) {
        return next(null, {code: Code.AREA.ITEM_NOT_ENOUGH, part: msg.part});
    }
    // 扣除金币
    player.setMoneyByType(Consts.MONEY_TYPE.GOLD, player.getMoneyByType(Consts.MONEY_TYPE.GOLD) - slot.getWakeUpNeedGold(),flow.MONEY_FLOW_COST.EQUIP_WAKEUP);
    // 扣除材料
    materials.forEach(function (material) {
        player.wakeUpBag.removeItems(player.wakeUpBag.findItems(material.itemId, material.count));
    });
    // 觉醒
    slot.wakeUp();

    player.dataStatisticManager.refreshDailyEquipData(Consts.EQUIP_STTE.DAILY_AWAKE_LV,msg.part,slot.wakeUpLV);
    player.missionMgr.progressUpdate( Consts.MISSION_CONDITION_TYPE.OUT_ALL_EQUIP_AWAKE_START_TO_XX_LV,Consts.MISSION_PROGRESS_VALUE_TYPE.MATH_MAX );

    return next(null, {
        code: Code.OK,
        part: msg.part,
        gold: player.getMoneyByType(Consts.MONEY_TYPE.GOLD),
        wakeUpLV: slot.wakeUpLV
    });
};

/*
 *   熔炼
 * */
pro.melt = function (msg, session, next) {
    logger.debug('melt playerId = %s, posList = %j', session.get('playerId'), msg.posList);
    var player = area.getPlayer(session.get('playerId')),
        posList = msg.posList || [];
    if (!player.funcOpen(Consts.FUNCTION.EQUIP_MELTING)) {
        return next(null, {code: Code.AREA.FUNC_DISABLED});
    }
    if (posList.length <= 0 || posList.length > 8) {
        return next(null, {code: Code.AREA.MELTING_MATERIAL_ERROR});
    }
    if (!_.every(posList, function (pos) {
            return player.equipBag.getItemByPos(pos);
        })) {
        return next(null, {code: Code.AREA.NO_SUCH_EQUIP});
    }
    if (!_.every(posList, function (pos) {
            return !player.armBag.existByPos(pos);
        })) {
        return next(null, {code: Code.AREA.EQUIP_ARMED});
    }
    // 熔炼
    var totalMeltPoints = 0;

    var drops = [];
    _.each(posList, function (pos) {
        var equip = player.equipBag.getItemByPos(pos);
        if (equip) {
            // 扣除装备
            player.equipBag.remove(pos);
            // 计算熔炼值
            totalMeltPoints += equip.getMeltPoint();
            var newEquipId = equip.getMeltNewEquip();
            if (newEquipId) {
                // 获得新装备
             //   var newEquip = new Equip({playerId: player.id, pos: pos, equipId: newEquipId});
             //   player.equipBag.add(newEquip);
              //  equipList.push(newEquip.getClientInfo());　
                drops = dropUtils.getDropItems(newEquipId);
            }
        }
    });
    if(drops.length>0)
    {
        drops = player.applyDrops(drops);
    }
    player.set('meltPoint', player.meltPoint + totalMeltPoints);

    player.missionMgr.progressUpdate( Consts.MISSION_CONDITION_TYPE.MELTING_EQUIP_CNT ,Consts.MISSION_PROGRESS_VALUE_TYPE.ADD_VALUE,posList.length);
    return next(null, {code: Code.OK, meltPoint: totalMeltPoints, drops: drops});
};

/*
 *  洗练
 * */
pro.wash = function (msg, session, next) {
    logger.debug('wakeUp playerId = %s, part = %s', session.get('playerId'), msg.part);
    var player = area.getPlayer(session.get('playerId'));
    // 功能是否开启
    if (!player.funcOpen(Consts.FUNCTION.EQUIP_REFRESH)) {
        return next(null, {code: Code.AREA.FUNC_DISABLED});
    }
    //部位
    var part = msg.part;

    //当前锁定的数量
    var lockCnt = player.equipWashAll.getLockCnt( part );

    //倍数
    var multipleList = dataUtils.getOptionList("equip_washLock", '#');


    var multiple = multipleList[lockCnt];

    var basicNeedWashCnt = dataUtils.getOptionValue('equip_washStone', 0);
    var basicNeedGoldCnt = dataUtils.getOptionValue('equip_washMoney', 0);

    //需要的洗练石数量
    var needWashCnt = dataUtils.getOptionValue('equip_washStone', 0) * multiple;

    //角色拥有的洗练石数量
    var currWashStone = player.getMoneyByType( Consts.MONEY_TYPE.WASH_STONE );

    var currDiamond = player.getMoneyByType( Consts.MONEY_TYPE.DIAMOND);
    //-------------钻石
    if( currWashStone == 0 )
    {
        var equip_washDiamond = dataUtils.getOptionValue('equip_washDiamond', 1);
        var needDiamond = needWashCnt * equip_washDiamond;
        //钻石不足
        if( currDiamond < needDiamond )
        {
            return next(null,{code:Code.DIAMOND_NUM_NOT_ENOUGH});
        }

        var washList = player.equipWashAll.refreshWashList(part);

        player.setMoneyByType(Consts.MONEY_TYPE.DIAMOND , currDiamond - needDiamond,flow.MONEY_FLOW_COST.EQUIP_WASH);

        return next( null , { code:Code.OK , washList:washList} );
    }
    // 洗练石足够------洗练石 、 金币
    else if( currWashStone >= needWashCnt   )
    {
        var needGold = dataUtils.getOptionValue('equip_washMoney', 0);
        needGold = needGold * multiple;
        var currGold =  player.getMoneyByType(Consts.MONEY_TYPE.GOLD);
        //金币不足
        if(  currGold < needGold)
        {
            return next(null,{code:Code.AREA.GOLD_NOT_ENOUGH});
        }


        player.setMoneyByType(Consts.MONEY_TYPE.GOLD , currGold - needGold,flow.MONEY_FLOW_COST.EQUIP_WASH);
        player.setMoneyByType(Consts.MONEY_TYPE.WASH_STONE , currWashStone - needWashCnt,flow.MONEY_FLOW_COST.EQUIP_WASH);

        var washList = player.equipWashAll.refreshWashList(part);
        return next( null , { code:Code.OK , washList:washList} );
    }
    //洗练石不足且不为0------钻石、洗练石、金币
    else
    {
        var equip_washDiamond = dataUtils.getOptionValue('equip_washDiamond', 1);

        //需要消耗的钻石=（策划表洗练消耗的洗练石数量-当前拥有的洗练石数） * 洗练换钻石比例 * 锁定数量
        var needDiamond = (basicNeedWashCnt*multiple-currWashStone) * equip_washDiamond;

        //钻石不足
        if( currDiamond < needDiamond )
        {
            return next(null,{code:Code.DIAMOND_NUM_NOT_ENOUGH});
        }

        var currGold =  player.getMoneyByType(Consts.MONEY_TYPE.GOLD);
        var needGold = dataUtils.getOptionValue('equip_washMoney', 0);
        needGold = needGold * multiple;

        //金币不足
        if( currGold < needGold )
        {
            return next(null,{code:Code.AREA.GOLD_NOT_ENOUGH});
        }

        player.setMoneyByType(Consts.MONEY_TYPE.GOLD , currGold - needGold,flow.MONEY_FLOW_COST.EQUIP_WASH);
        player.setMoneyByType(Consts.MONEY_TYPE.WASH_STONE ,0,flow.MONEY_FLOW_COST.EQUIP_WASH);
        player.setMoneyByType(Consts.MONEY_TYPE.DIAMOND , currDiamond - needDiamond,flow.MONEY_FLOW_COST.EQUIP_WASH);

        var washList = player.equipWashAll.refreshWashList(part);

        player.missionMgr.progressUpdate( Consts.MISSION_CONDITION_TYPE.WASH_EQUIP_CNT );

        return next( null , { code:Code.OK , washList:washList} );
    }

    return next(null,{code:Code.FAIL});
};


/*
 *  激活洗练 的同时也洗练3条
 * */
pro.openWash = function (msg, session, next) {
    logger.debug('openWash playerId = %s, pos = %s', session.get('playerId'), msg.part);

    var player = area.getPlayer(session.get('playerId'));

    var part =  msg.part;

    // 功能是否开启
    if (!player.funcOpen(Consts.FUNCTION.EQUIP_REFRESH)) {
        return next(null, {code: Code.AREA.FUNC_DISABLED});
    }

    //表示已经激活过了
    if( !player.equipWashAll.getIsOpen(part)  )
    {
        return next(null, {code: Code.AREA.EQUIP_WASH_OPENED});
    }

    //激活洗练的费用在参数配置表配置equip_washOpenDiamond
    var equip_washLock = dataUtils.getOptionValue('equip_washOpenDiamond', 1);

    //钻石不足
    if (player.getMoneyByType(Consts.MONEY_TYPE.DIAMOND) < equip_washLock) {
        return next(null, {code: Code.DIAMOND_NUM_NOT_ENOUGH});
    }

    if (player) {
            var part = msg.part;
            var slot = player.armBag.getSlotByPart(part);
            if (slot) {
                // 扣除钻石
                player.setMoneyByType(Consts.MONEY_TYPE.DIAMOND, player.getMoneyByType(Consts.MONEY_TYPE.DIAMOND) - equip_washLock,flow.MONEY_FLOW_COST.EQUIP_OPEN_WASH);
                //这个表示洗练数量加1
              //  slot.wash();
                var washList = player.equipWashAll.refreshWashList(part);

                player.missionMgr.progressUpdate( Consts.MISSION_CONDITION_TYPE.WASH_EQUIP_CNT );
                return next(null, {code: Code.OK, washList: washList});
            }
    }
    return next(null, {code: Code.FAIL});
};

/*
 *  (锁定/解锁)洗练
 * */
pro.lockWash = function (msg, session, next) {
    logger.debug('lockWash playerId = %s, part = %s, pos = %s', session.get('playerId'), msg.part, msg.pos);
    var player = area.getPlayer(session.get('playerId'));
    var part = msg.part;
    var pos = msg.pos;
    var lockState = msg.lockState;
    //表示状态不一样
    if( lockState != player.equipWashAll.getLockState(part, pos ) )
    {
        //表示锁定数量不能超过2条 (不允许玩家锁定所有的属性)
        if( lockState == 1 && player.equipWashAll.getLockCnt(part)>=2 )
        {
            return next(null, { code: Code.FAIL} );
        }
        var wash =  player.equipWashAll.setLockState( part, pos , lockState );
        return next(null, { code: Code.OK , wash : wash.getClientInfo()} );
    }
    return next(null, {code: Code.FAIL});
};

/*
* 装备成就
* **/
pro.equipAchieved = function(msg , session , next )
{
    logger.debug('equipAchieved playerId = %s, id = %id', session.get('playerId'), msg.id);

    var player = area.getPlayer(session.get('playerId'));

    //成就id
    var id = msg.id;

    var data =  dataApi.EquipWashAdd.findById( id );

    //未找到成就属性
    if( null == data )
    {
        return next(null , {code:Code.FAIL});
    }
    else
    {
        player.equipAchievedList.refresh(id);
        //更新数据到监听
        return next(null , {code:Code.OK ,id:id } );
        
        if( player.equipAchievedList.getIsCanAchieved(id) )
        {
            player.equipAchievedList.refresh(id);
            //更新数据到监听
            return next(null , {code:Code.OK ,id:id } );
        }
        //激活洗练成就条件未达成
        else
        {
            return next(null , {code:Code.AREA.EQUIP_WASH_ACHIEVED_NO_ENOUGH});
        }
    }
};

/*
 *   出售装备
 * */
pro.sell = function (msg, session, next) {
    logger.debug('sell playerId = %s, slot = %s', session.get('playerId'), msg.slot );
    var player = area.getPlayer(session.get('playerId')),
        equip,totalMoney=0;
    if(player.armBag.existByPos(msg.slot)){
        //已装备不能出售
        logger.debug('sell armBag.existByPos!');
        return next(null, {code: Code.AREA.EQUIP_ARMED});
    }
    equip = player.equipBag.getItemByPos(msg.slot);
    if (!equip)
    {
        logger.debug('sell empty slot specified!');
        return next(null, {code: Code.AREA.NO_SUCH_EQUIP});
    }

    totalMoney = (equip.data.sellprice * 1) || 0;
    player.equipBag.remove(msg.slot);

    player.setMoneyByType(Consts.MONEY_TYPE.GOLD, player.goldCnt + totalMoney,flow.MONEY_FLOW_GAIN.SELL_EQUIP);
    next(null, {code: Code.OK, money: totalMoney});
};