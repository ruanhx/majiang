/**
 * Created by 卢家泉 on 2017/7/15.
 * 活动内8个装备到达等级
 */

var util = require('util');

var _ = require('underscore');

var ConditionAward = require('./conditionAward');

var EquipLv = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on('onActEquipLevelUp', this.onEquipLevelUp.bind(this));
};

util.inherits(EquipLv, ConditionAward);

var pro = EquipLv.prototype;

pro.init = function () {
    var self = this;
    var conds = self.getConditionList();
    conds.forEach(function (cond) {
        //TODO:要把活动开启前的进度加进来
        var condStatus = self.conditionsDict[cond.id];
        if (!condStatus) {
            condStatus = self.conditionsDict[cond.id] = {};
        }
        condStatus.param01 = cond.param01;//附加条件，用来判断进度书否可以加 装备等级
        condStatus.progress = 0;
        condStatus.isDrew = 0;
    });
    return true;
};

/*
 *   更新进度，并保存
 * */
pro.progress = function (equipLvSet) {
    var isNew = false;
    var equipPartSet = [];
    _.each(this.conditionsDict, function (condStatus) {
        equipPartSet = [];
        equipLvSet.forEach(function(equipLv){
            if(equipLv.lv >= condStatus.param01){
                equipPartSet.push(equipLv.part);
            }
        });
        if(condStatus.progress < equipPartSet.length){
            condStatus.progress = equipPartSet.length;
            isNew = true;
        }
    });
    if(isNew){
        this.save();
        this.refreshRedSpot();
    }
};

pro.onEquipLevelUp = function (equipItems) {
    if (!this.isOpen()) {
        return;
    }
    var EquipLvMap = {};
    _.each(equipItems, function (equip) {
        if(EquipLvMap[equip.equip.data.part]){
            if(EquipLvMap[equip.equip.data.part].lv < equip.refineLV){
                EquipLvMap[equip.equip.data.part].lv = equip.refineLV;
            }
        }else{
            EquipLvMap[equip.equip.data.part] = {
                part : equip.equip.data.part,
                lv : equip.refineLV
            }
        }
    });
    this.progress(_.values(EquipLvMap));
};

module.exports = EquipLv;