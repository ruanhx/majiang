/**
 * Created by 卢家泉 on 2017/7/15.
 * 活动内8个装备到达品质
 */

var util = require('util');

var _ = require('underscore');

var ConditionAward = require('./conditionAward');

var EquipQuality = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on('onActEquipQuality', this.onEquipQuality.bind(this));
};

util.inherits(EquipQuality, ConditionAward);

var pro = EquipQuality.prototype;

pro.init = function () {
    var self = this;
    var conds = self.getConditionList();
    conds.forEach(function (cond) {
        //TODO:要把活动开启前的进度加进来
        var condStatus = self.conditionsDict[cond.id];
        if (!condStatus) {
            condStatus = self.conditionsDict[cond.id] = {};
        }
        condStatus.param01 = cond.param01;//附加条件，用来判断进度书否可以加 装备品级
        condStatus.progress = 0;
        condStatus.isDrew = 0;
    });
    return true;
};

/*
 *   更新进度，并保存
 * */
pro.progress = function (equipMaxQualitySet) {
    var isNew = false;
    var equipPartSet = [];
    _.each(this.conditionsDict, function (condStatus) {
        equipPartSet = [];
        equipMaxQualitySet.forEach(function(quipMaxQuality){
            if(quipMaxQuality.maxQuality >= condStatus.param01){
                equipPartSet.push(quipMaxQuality.part);
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

pro.onEquipQuality = function (equipItems) {
    if (!this.isOpen()) {
        return;
    }
    var EquipMaxQualityMap = {};
    _.each(equipItems, function (equip) {
        if(EquipMaxQualityMap[equip.equip.data.part]){
            if(EquipMaxQualityMap[equip.equip.data.part].maxQuality < equip.equip.data.quality){
                EquipMaxQualityMap[equip.equip.data.part].maxQuality = equip.equip.data.quality;
            }
        }else{
            EquipMaxQualityMap[equip.equip.data.part] = {
                part : equip.equip.data.part,
                maxQuality : equip.equip.data.quality
            }
        }
    });
    this.progress(_.values(EquipMaxQualityMap));
};

module.exports = EquipQuality;