/**
 * Created by 卢家泉 on 2017/7/15.
 * 活动内抓宝排行到达名次
*/
var util = require('util');

var _ = require('underscore'),
    dataApi = require('../../../util/dataApi');


var ConditionAward = require('./conditionAward');

var CatchTreasureRank = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    player.on('onActCTreasureRankChange', this.rankChange.bind(this));
};

util.inherits(CatchTreasureRank, ConditionAward);

var pro = CatchTreasureRank.prototype;

pro.init = function () {
    var self = this;
    var conds = self.getConditionList();
    //TODO:加载进度
    conds.forEach(function (cond) {
        var condStatus = self.conditionsDict[cond.id];
        if (!condStatus) {
            condStatus = self.conditionsDict[cond.id] = {};
        }
        condStatus.progress = 0;
        condStatus.isDrew = 0;
    });
    return true;
};

/*
 *   更新进度，并保存
 * */
pro.progress = function (rank) {
    var changed = false;
    _.each(this.conditionsDict, function (condStatus) {
        if(rank<condStatus.progress || condStatus.progress===0){
            condStatus.progress = rank;
            changed = true;
        }
    });
    if(changed){
        this.save();
        this.refreshRedSpot();
    }

};

pro.isFinishByCondId = function (condId) {
    var self = this,
        typeId = self.getTypeId(),
        condData = dataApi.ActivityCond.findById(typeId);
    var max = condData.condParam[condId]
    var status = this.conditionsDict[condId];
    if(!status) return 0;
    if(status.progress === 0) return 0;

    return (status && (status.progress <= max)) ? 1 : 0;
};

pro.rankChange = function (rank) {
    if (!this.isOpen()) {
        return;
    }

    this.progress(rank);
};

module.exports = CatchTreasureRank;