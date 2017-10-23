/**
 * Created by kilua on 2016/7/1 0001.
 */

var util = require('util'),
    logger = require('pomelo-logger').getLogger(__filename),
    EventEmitter = require('events').EventEmitter;

var _ = require('underscore');

var Consts = require('../../consts/consts'),
    dataApi = require('../../util/dataApi'),
    dataUtils = require('../../util/dataUtils');

var Slot = function (slotData) {
    EventEmitter.call(this);

    slotData = slotData || {};
    this.refineLV = slotData.refineLV || 0;//精炼等级
    this.refineExp = slotData.refineExp || 0;
    this.wakeUpLV = slotData.wakeUpLV || 0;//觉醒等级
    this.washCnt = slotData.washCnt||0;
    this.strengthenLV = slotData.strengthenLV || 0;//强化等级
};

util.inherits(Slot, EventEmitter);
Slot.prototype.clearSlot = function () {
    delete this.refineLV;
    delete this.refineExp;
    delete this.wakeUpLV;
    delete this.washCnt;
    delete this.strengthenLV;
}

Slot.prototype.getClientInfo = function () {
    return {
        part: this.equip.getPart(),
        refineLV: this.refineLV,
        refineExp: this.refineExp,
        equip: this.equip.getClientInfo(),
        wakeUpLV: this.wakeUpLV,
        washCnt:this.washCnt,
        strengthenLV:this.strengthenLV
    };
};

Slot.prototype.save = function () {
    this.emit('save', this.getData());
};

Slot.prototype.refresh = function () {
    this.emit('refresh', this.getClientInfo());
};

Slot.prototype.updatePower = function () {
    this.emit('updatePower');
};

Slot.prototype.arm = function (equip) {
    if (this.equip && this.equip.pos === equip.pos) {
        return;
    }
    this.equip = equip;
    this.save();
    this.refresh();
    this.updatePower();
};

Slot.prototype.getData = function () {
    return {
        playerId: this.equip.playerId,
        part: this.equip.getPart(),
        refineLV: this.refineLV,
        refineExp: this.refineExp,
        pos: this.equip.pos,
        wakeUpLV: this.wakeUpLV,
        washCnt:this.washCnt,
        strengthenLV:this.strengthenLV
    };
};

/*
 *   是否达到最大精炼等级，并且精炼值也已经满了
 * */
Slot.prototype.reachRefineMax = function () {
    var maxLV = dataApi.EquipRefine.getMaxLV();
    return (this.refineLV === maxLV && this.refineExp >= dataApi.EquipRefine.findById(maxLV).refineexp);
};


Slot.prototype.refine = function (addExp) {
    var i = this.refineLV, leftExp = addExp, curExp = this.refineExp, curLV = this.refineLV,
        maxLV = dataApi.EquipRefine.getMaxLV();
    for (; i < maxLV; i++) {
        var refineData = dataApi.EquipRefine.findById(i);
        if (curExp + leftExp < refineData.refineexp) {
            curExp += leftExp;
            break;
        }
        leftExp -= (refineData.refineexp - curExp);
        curExp = 0;
        curLV += 1;
    }
    // 满级截断
    if (curLV === maxLV) {
        var maxRefineData = dataApi.EquipRefine.findById(maxLV);
        curExp = Math.min(leftExp, maxRefineData.refineexp);
    }
    this.refineLV = curLV;
    this.refineExp = curExp;
    if (addExp > 0) {
        this.save();
        this.refresh();
        this.updatePower();
    }
};

/*
 *   获取强化的最高等级
 * */
Slot.prototype.strengthenMaxLV = function () {
    return this.equip.data.strengthenLvMax||0;
};

/***
 * 格子强化
 */
Slot.prototype.strengthen = function(addLv){
    this.strengthenLV += addLv;
    this.save();
    this.refresh();
    this.updatePower();
}

/*
 *   查找觉醒需要金币
 * */
Slot.prototype.getWakeUpNeedGold = function () {
    return dataApi.EquipWakeup.getNeedGold(this.wakeUpLV, this.equip.getPart());
};

/*
 *   查找觉醒需要材料
 * */
Slot.prototype.getWakeUpNeedMaterials = function () {
    return dataApi.EquipWakeup.getNeedMaterials(this.wakeUpLV, this.equip.getPart());
};
/*
 *   装备觉醒
 * */
Slot.prototype.wakeUp = function () {
    this.wakeUpLV += 1;
    this.save();
    this.refresh();
    this.updatePower();
};

/*
 *   装备洗练次数加1
 * */
Slot.prototype.wash = function(){
    this.washCnt += 1;
    this.save();
};
/*
 *   装备洗练次数
 * */
Slot.prototype.getWashCnt = function(){
    return this.washCnt;
};

Slot.prototype.getEquipPower = function () {
    //logger.debug('###Slot.getEquipPower part = %s, wakeUpLV = %s', this.wakeUpLV, this.equip.getPart());
    return this.equip.getPower(dataApi.EquipWakeup.getWakeUpData(this.wakeUpLV, this.equip.getPart()) ,this.refineLV,this.strengthenLV);
};
/*
 *   精炼增加生命总值
 * */
Slot.prototype.getMaxHP = function () {
    var refineData = dataApi.EquipRefine.findById(this.refineLV);
    if (this.equip.getPart() >= 4) {
        // 生命装备，攻击精炼加成修正为0
        return 0;
    }
    //logger.debug('###Slot.getMaxHP refineLV = %s, refineData.allHpAdd = %s', this.refineLV, refineData.allHpAdd);
    return ((!!refineData && refineData.allHpAdd) || 0);
};

/*
 *   精炼增加的攻击总值
 * */
Slot.prototype.getAtk = function () {
    var refineData = dataApi.EquipRefine.findById(this.refineLV);
    if (this.equip.getPart() < 4) {
        // 攻击装备，生命精炼加成修正为0
        return 0;
    }
    //logger.debug('###Slot.getAtk refineLV = %s, refineData.allAtkAdd = %s', this.refineLV, refineData.allAtkAdd);
    return ((!!refineData && refineData.allAtkAdd) || 0);
};

/*
 *   格子的总战力，包括装备
 * */
Slot.prototype.getPower = function () {
    //logger.debug('###Slot.getPower part = %s, getEquipPower = %s, getAtk = %s, getMaxHP = %s', this.equip.getPart(), this.getEquipPower(), this.getAtk(), this.getMaxHP());
    return this.getEquipPower();
        // + dataUtils.getOptionValue('Battle_atkfight', 1) * this.getAtk()
        // + dataUtils.getOptionValue('Battle_hpfight', 0.2) * this.getMaxHP();
};

//背包部分=====================================================黄金分割==========================================================
var Bag = function (equipBag, slotList) {
    EventEmitter.call(this);
    this.equipBag = equipBag;
    this.load(slotList);
};

util.inherits(Bag, EventEmitter);

var pro = Bag.prototype;

pro.clearArmBag = function(){
    this.equipBag.clearEquipBag();

    for(var key in this.armDict){
        var slot = this.armDict[key];
        slot.clearSlot();
        delete this.armDict[key];
    }
    delete this.armDict;
}

pro.addSlot = function (part, slotData) {
    var self = this, slot = new Slot(slotData || {});
    self.armDict[part] = slot;

    slot.on('save', function (dbData) {
        self.emit('save', dbData);
    });
    slot.on('refresh', function (slotInfo) {
        self.emit('refresh', slotInfo);
    });
    slot.on('updatePower', function () {
        self.emit('updatePower');
    });
    return slot;
};

pro.load = function (slotList) {
    var self = this;
    //已经上阵的装备列表
    self.armDict = {};
    slotList = slotList || [];
    slotList.forEach(function (slotData) {
        var equip = self.equipBag.getItemByPos(slotData.pos);
        if (equip) {
            var slot = self.armDict[equip.getPart()] = self.addSlot(equip.getPart(), slotData);
            slot.arm(equip);
        }
    });
    console.info('load arm bag slot cnt = %s', slotList.length);
};

pro.getClientInfo = function () {
    return _.map(this.armDict, function (slot) {
        return slot.getClientInfo();
    });
};

/*
 *   装备
 *   @slot {Number} 仓库格子
 * */
pro.arm = function (pos) {
    var equip = this.equipBag.getItemByPos(pos);
    if (equip) {
        var slot = this.armDict[equip.getPart()];
        if (!slot) {
            // 第一次装备
            slot = this.addSlot(equip.getPart());
        }
        // 保存装备配置
        slot.arm(equip);
        return true;
    }
    return false;
};


/*
 *   判断指定仓库格子的装备是否已装备
 *   @pos {Number} 仓库格子
 * */
pro.existByPos = function (pos) {
    return !!_.find(this.armDict, function (slot) {
        return slot.equip.pos === pos;
    });
};

pro.existByPosList = function (posList) {
    return !!_.find(this.armDict, function (slot) {
        return  !! _.find(posList,function (tmpPos) {
            return slot.equip.pos === tmpPos;
        })
    });
};


pro.getTotalPower = function () {
    var suit = {};
    var tPower =  _.reduce(this.armDict, function (memo, slot) {
        //logger.error("armEquipBag slot.equip：%j",slot.equip);
        if(suit[slot.equip.data.similarNum]){
            suit[slot.equip.data.similarNum] += 1;
        }else{
            suit[slot.equip.data.similarNum] = 1;
        }
        return memo + slot.getPower();
    }, 0);
    //logger.error("armEquipBag 出战装备基础战斗力：%s",tPower);
    //计算套装加成
    for(var key in suit){
        tPower += dataApi.EquipSimilar.getPower(key,suit[key]);
        //logger.error("套装加成-> 套装id：%s, 套装个数：%s, 套装添加的战斗力：%s",key,suit[key],dataApi.EquipSimilar.getPower(key,suit[key]));
    }
    //logger.error("armEquipBag 出战装备最终战斗力：%s",tPower);
    return tPower;
};

pro.getSlotByPart = function (part) {
    return this.armDict[part];
};

pro.getWashCntByPart = function (part) {
    if( null ==  this.armDict[part] )
    {
        return 0;
    }
    return this.armDict[part].getWashCnt();
};


pro.isArmAll = function () {
    return _.size(this.armDict) === Consts.ARM_POS.MAX;
};

/*
 *洗练需要消耗的货币数量
 * */
pro.washNeedMoney = function(optionId, defVal){
    return dataApi.CommonParameter.getOptionValue(optionId, defVal);
}

/*
* 获取精炼达到需要等级的装备数
* */
pro.getRefineMinLv = function( needLv )
{
    var self = this;
    // needCnt = needCnt || Consts.ARM_POS.MAX;
    var currCnt = _.size(self.armDict);

    var count = 0;

    _.map(self.armDict, function(data){

        if(  data.refineLV >=needLv )
        {
            count++;
        }
    });
    return count;
};

/*
 * 获取达到强化等级的装备数量
 * */
pro.getStrengthenMinLv = function( needLv ){
    var self = this;
    // needCnt = needCnt || Consts.ARM_POS.MAX;
    var currCnt = _.size(self.armDict);

    var count = 0;

    _.map(self.armDict, function(data){

        if(  data.strengthenLV >=needLv )
        {
            count++;
        }
    });
    return count;
}

/*
 * 获取觉醒最小星级
 * */
pro.getWakeUpMinStar = function(needCnt)
{
    needCnt = needCnt || Consts.ARM_POS.MAX;
    var self = this;
    var tempLv = -1;
    if( _.size(self.armDict) < needCnt)
    {
        tempLv = -1;
    }
    else
    {
        _.map(self.armDict, function(data){

            var getWakeUpData = dataApi.EquipWakeup.extractStarAndLV( data.wakeUpLV );
            var wakeUpStar = getWakeUpData.star;
            if( tempLv == -1 )
            {
                tempLv = wakeUpStar;
            }
            if(  wakeUpStar <tempLv )
            {
                tempLv = wakeUpStar;
            }
        });
    }
    return tempLv;
};

/*
 * 全身装备最小等级
 * */
pro.getEquipLvMin = function (needLv) {
    // needCnt = needCnt || Consts.ARM_POS.MAX;
    var self = this;
    var tempLv = 0;
    _.map(self.armDict, function (data) {
        var equipLv = data.equip.lv;
        if (equipLv >= needLv) {
            tempLv++;
        }
    });

    return tempLv;
};

module.exports = Bag;
