/**
 * Created by kilua on 2016/6/22 0022.
 * 条件奖励活动
 */

var util = require('util');

var _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename);

var Activity = require('../playerActivity'),
    dataApi = require('../../../util/dataApi'),
    dropUtils = require('../../area/dropUtils'),
    Consts = require('../../../consts/consts'),
    flow = require('../../../consts/flow'),
    playerActionLog = require('../../../dao/playerActionLogDao');

var ConditionAward = function (manager, player, actData) {
    Activity.call(this, manager, player, actData);
    this.conditionsDict = {};
};

util.inherits(ConditionAward, Activity);

var pro = ConditionAward.prototype;

pro.applyAllAvailableAwards = function () {
    var self = this;
    _.each(self.conditionsDict, function (condStatus, condId) {
        if (self.isFinishByCondId(condId) && !self.isDrewByCondId(condId)) {
            self.applyAwards(condId, self.getDropsByCondId(condId));
        }
    });
};

pro.needInitialize = function () {
    return _.size(this.conditionsDict) <= 0;
};

/*
 *   更新进度，并保存
 * */
pro.progress = function (newProgress) {
    var changed = false;
    _.each(this.conditionsDict, function (condStatus) {
        if (newProgress > condStatus.progress) {
            condStatus.progress = newProgress;
            changed = true;
        }
    });
    if (changed) {
        this.save();
        this.refreshRedSpot();
    }
};

pro.loadDetail = function (detail) {
    this.conditionsDict = detail.conditionsDict;
};

pro.getDetailData = function () {
    return {conditionsDict: this.conditionsDict};
};

pro.getDetailInfo = function () {
    return {conditions: this.getConditionList()};
};

pro.isFinishByCondId = function (condId) {
    var self = this,
        typeId = self.getTypeId(),
        condData = dataApi.ActivityCond.findById(typeId);
    var max = condData.condParam[condId]
    var status = this.conditionsDict[condId];
    return (status && (status.progress >= max)) ? 1 : 0;
};

pro.haveAwardsToDraw = function () {
    var self = this,
        typeId = self.getTypeId(),
        condData = dataApi.ActivityCond.findById(typeId);
    if (!condData) {
        return false;
    }
    return _.some(condData.condParam, function (condParam,index) {
        return (self.isFinishByCondId(index) && !self.isDrewByCondId(index));
    });
};

///*
// *   检查并自动关闭活动
// * */
//pro.checkAutoClose = function () {
//    var self = this,
//        condData = dataApi.ActivityCond.findById(self.getTypeId());
//    if (!condData) {
//        logger.warn('checkAutoClose no ActivityCond data found!id = %s', self.getTypeId());
//        return false;
//    }
//    if (condData.closeType === Consts.CONDITION_AWARD_CLOSE_TYPE.AUTO_CLOSE) {
//        // 检查是否所有奖励领取完毕
//        if (_.every(self.conditionsDict, function (condStatus, condId) {
//                var result = self.isDrewByCondId(condId);
//                if (!result) {
//                    logger.debug('checkAutoClose condition not finished!condId = %s', condId);
//                }
//                return result;
//            })) {
//            self.manager.remove(self);
//            return true;
//        }
//    } else {
//        logger.debug('checkAutoClose no auto close!');
//    }
//    return false;
//};

/*
 *   自动关闭的活动，达到自动关闭的条件，对客户端隐藏
 * */
pro.isAutoClosed = function () {
    var self = this,
        condData = dataApi.ActivityCond.findById(self.getTypeId());
    if (!condData) {
        logger.warn('isAutoClosed no ActivityCond data found!id = %s', self.getTypeId());
        return false;
    }
    if (condData.closeType === Consts.CONDITION_AWARD_CLOSE_TYPE.AUTO_CLOSE) {
        // 检查是否所有奖励领取完毕
        if (_.every(self.conditionsDict, function (condStatus, condId) {
                var result = self.isDrewByCondId(condId);
                if (!result) {
                    //logger.debug('isAutoClosed condition not finished!condId = %s', condId);
                }
                return result;
            })) {
            return true;
        }
    }
    return false;
};

pro.getDropIdByCondId = function (condId) {
    var condData = dataApi.ActivityCond.findById(this.getTypeId());
    if (!condData) {
        logger.warn('getDropIdByCondId ActivityCond id = %s not found!', this.getTypeId());
        return false;
    }

    var dropIdByCondId = {};
    condData.condParam.forEach(function (condParam, idx){
        dropIdByCondId[idx]=(condData.dropIds[idx]);
    });
    return dropIdByCondId[condId];
};

pro.getDropsByCondId = function (condId) {
    var dropId = this.getDropIdByCondId(condId);
    if (dropId) {
        return dropUtils.getDropItems(dropId);
    } else {
        return [];
    }
};

pro.applyAwards = function (condId, drops) {
    var condStatus = this.conditionsDict[condId];
    if (!condStatus) {
        logger.warn('applyAwards not cond info found!condId = %s', condId);
        return null;
    }
    condStatus.isDrew = 1;
    this.save();
    //this.pushNew();
    //this.checkAutoClose();
    playerActionLog.logDrawActivityAwards(this.player, this.id, this.getDropIdByCondId(condId));
    drops=  this.player.applyDrops(drops,null,flow.ITEM_FLOW.ACTIVITY);
    return drops;
};

pro.isDrewByCondId = function (condId) {
    var status = this.conditionsDict[condId];
    return status ? status.isDrew : 0;
};

pro.getProgressByCondId = function (condId) {
    var status = this.conditionsDict[condId];
    return status ? status.progress : 0;
};

pro.getConditionAwardName = function (condData) {
    if( !!this.player.language ){
        if(!condData){
            logger.error('conditionAward Name is null');
            return '';
        }
        var name =condData[('name_txt_'+ this.player.language)];
        if(!!name){
            return name;
        }
    }
    return condData.name_txt_en;
};

pro.getConditionList = function () {
    var self = this,
        typeId = self.getTypeId(),
        condData = dataApi.ActivityCond.findById(typeId),
        conds = [];
    if (!condData) {
        return conds;
    }
    condData.condParam.forEach(function (condParam, idx) {
        var condInfo = {};
        conds.push(condInfo);
        // 条件奖励详细信息
        condInfo.id = idx;
        condInfo.type = condData.condType;
        condInfo.param = condParam;
        condInfo.current = self.getProgressByCondId(idx);
        condInfo.icon = condData.icon;
        condInfo.drops = dropUtils.getDropItems(condData.dropIds[idx]);
        condInfo.isDrew = self.isDrewByCondId(idx);
        condInfo.name = self.getConditionAwardName( condData );//condData.name
        condInfo.idx = idx;
        if(condData.condParam01 && condData.condParam01.length>idx){
            condInfo.param01 = condData.condParam01[idx];
        }
        condInfo.tipsId = condData.tipsId;
        condInfo.btntext = condData.btntext;
        condInfo.formId = condData.formId;
    });
    return conds;
};

module.exports = ConditionAward;
