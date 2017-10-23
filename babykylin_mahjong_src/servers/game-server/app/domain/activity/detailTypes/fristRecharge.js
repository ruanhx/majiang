/**
 * Created by tony on 2016/12/27.
 */
var util = require('util');

var _ = require('underscore');

var Activity = require('../playerActivity'),
    dataApi = require('../../../util/dataApi');

var FristRecharge = function (manager, player, actData) {
    Activity.call(this, manager, player, actData);
    this.conditionsDict = {
        progress:0,
        getAwardTime:0
    };

    player.on('onCharge', this.onCharge.bind(this));
};

util.inherits(FristRecharge, Activity);

var pro = FristRecharge.prototype;

pro.getDetailInfo = function () {
    var fristData = dataApi.ActivetyRecharge.findById(this.getTypeId());
    return {fristRecharge: [fristData]};
};

pro.reset = function () {
    //
};

pro.loadDetail = function (detail) {
    this.conditionsDict = detail.conditionsDict;
    if(  this.conditionsDict  == null ){
        this.conditionsDict = {};
    }
    if(  this.conditionsDict  == {} ){
         this.conditionsDict.progress = 0;
         this.conditionsDict.getAwardTime = 0;
    }

    if(   this.conditionsDict.progress == null ){
          this.conditionsDict.progress = 0;
    }
    if(   this.conditionsDict.getAwardTime == null ){
           this.conditionsDict.getAwardTime = 0;
    }
};

/*
 *   自动关闭的活动，达到自动关闭的条件，对客户端隐藏
 * */
pro.isAutoClosed = function () {
    var self = this,
        condData = dataApi.ActivetyRecharge.findById(self.getTypeId());
    if (!condData) {
        logger.warn('isAutoClosed no ActivityCond data found!id = %s', self.getTypeId());
        return false;
    }
    if (condData.closeType === Consts.CONDITION_AWARD_CLOSE_TYPE.AUTO_CLOSE) {
        // 检查是否所有奖励领取完毕
        return this.isDrew();
    }
    return false;
};
pro.isDrew= function () {
    return this.conditionsDict.getAwardTime>0;
};

/**
 * 是否有奖励可以领取
 */
pro.haveAwardsToDraw = function () {
    return this.conditionsDict.progress>0 && this.conditionsDict.getAwardTime == 0;
};

/*
 *   更新进度，并保存
 * */
pro.progress = function (newProgress) {
    if(this.isDrew()){//已经领取过了,不会在触发
        return;
    }

    this.conditionsDict.progress =this.conditionsDict.progress + newProgress;
    this.save();
    this.refreshRedSpot();
};

pro.refreshAward = function (time) {
    this.conditionsDict.getAwardTime = time;
    this.save();
    this.refreshRedSpot();
    this.pushRemove();
};

pro.getDetailData = function () {
    return {conditionsDict: this.conditionsDict};
};

pro.onCharge = function (orderInfo) {
    this.progress(orderInfo.money);
};

module.exports = FristRecharge;