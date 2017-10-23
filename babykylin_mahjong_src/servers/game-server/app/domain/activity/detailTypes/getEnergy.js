/**
 * Created by tony on 2016/10/3.
 * 吃鸡获得体力
 */

var util = require('util');
var mUtils = require('../../../util/utils');
var _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename);

var Activity = require('../playerActivity'),
    dataApi = require('../../../util/dataApi'),
    dropUtils = require('../../area/dropUtils'),
    Consts = require('../../../consts/consts'),
    playerActionLog = require('../../../dao/playerActionLogDao');

var GetEnergy = function (manager, player, actData) {
    Activity.call(this, manager, player, actData);
    this.buyRecordDict = {};
};

util.inherits(GetEnergy, Activity);

var pro = GetEnergy.prototype;

pro.getDetailInfo = function () {
    return { ActivetyStrength: this.getItemList()};
};

pro.needInitialize = function () {
    return false;
};

pro.init = function () {
    return false;
};

pro.getDetailData = function () {
    return {buyRecordDict: this.buyRecordDict};
};
pro.loadDetail = function (detail) {
    var self = this;
    self.buyRecordDict =  detail.buyRecordDict || {};
};
pro.getItemList = function () {
    var self = this,
        typeId = this.getTypeId(),
        strengthList = dataApi.ActivetyStrength.findByIndex({group:typeId}),
        strengthDatas = [];
    if (!_.isArray(strengthList)) {
        strengthList = [strengthList];
    }

    strengthList.forEach(function (data) {
        var jsonInfo = {};
        jsonInfo.id = data.id;
        jsonInfo.openingTime = data.openingTime;
        jsonInfo.lastTime = data.lastTime;
        jsonInfo.strength = data.strength;
        jsonInfo.probability = data.probability;
        jsonInfo.diamond = data.diamond;
        jsonInfo.buyTime = self.getBuyTimeById(jsonInfo.id);
        strengthDatas.push(jsonInfo);
    });
    return strengthDatas;
};

/*
* 添加购买记录
* */
pro.addBuyRecord = function( id ,vTime)
{
    this.buyRecordDict[id] = vTime || Date.now();
    this.refreshRedSpot();
    this.save();
};

/*
 * 奖励钻石
 * */
pro.awardDiamond = function( id )
{
    var data = dataApi.ActivetyStrength.findById(id);
    var value =  _.random(0 ,10);
    var needProbability = data.probability * 10;
    if(  value < needProbability )
    {
         var diamond = data.diamond;
         return diamond;
    }
    return 0;
}

/*
* 是否为领取体力的时间
* */
pro.isTimeOk = function( id ){
    var dateTime = new Date( Date.now() );
    var currHour = dateTime.getHours();
    var data = dataApi.ActivetyStrength.findById(id);
    var needHour = data.openingTime;
    var tempHour = data.lastTime;
    var isOk =currHour >=needHour && currHour< (needHour+tempHour);
    return isOk;
};

/*
 * 判断是否已经领取过体力
 * */
pro.haveGot = function(id ){
    if(!mUtils.isSameDay(this.getBuyTimeById(id),Date.now())){
        return false;
    }
    var dateTime = new Date( this.getBuyTimeById(id) );
    var currHour = dateTime.getHours();
    var data = dataApi.ActivetyStrength.findById(id);
    var needHour = data.openingTime;
    var tempHour = data.lastTime;
    var haveGot = currHour >=needHour && currHour< (needHour+tempHour);
    return haveGot;
};

/*
* 重置
* */
pro.reset = function()
{
    this.buyRecordDict = {};
    this.vewTick = 0;
    this.pubTick = 0;
    this.refreshRedSpot();
    this.save();
};

/*
 *   查找信息
 * */
pro.getBuyTimeById = function (id) {
    return this.buyRecordDict[id] || 0;
};

pro.haveAwardsToDraw = function () {
    var b = false;
    var self = this;
    for (var i in dataApi.ActivetyStrength.all()) {
        var activity = dataApi.ActivetyStrength.all()[i];
        if(self.isTimeOk(activity.id) && !self.haveGot(activity.id)){
            b = true;
            break;
        }
    }
    return b;
}

module.exports = GetEnergy;