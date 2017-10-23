/**
 * Created by tony on 2016/9/19.
 * 累计登陆条件奖励
 */


var util = require('util');

var _ = require('underscore'),
dataApi = require('../../../util/dataApi'),
    dropUtils = require('../../area/dropUtils');
var ConditionAward = require('./conditionAward');
var Activity = require('../playerActivity');
var Utils = require('./../../../util/utils');
var  TotalLogin = function (manager, player, actData) {
    ConditionAward.call(this, manager, player, actData);
    this.loginTime =  Date.now();
};


util.inherits(TotalLogin, ConditionAward);

var pro = TotalLogin.prototype;

pro.init = function () {
    var self = this;
    var conds = self.getConditionList();
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
pro.progress = function () {
    _.each(this.conditionsDict, function (condStatus) {
        condStatus.progress += 1;
    });
    this.save();
    this.refreshRedSpot();
};

pro.getDetailData = function () {
    return {conditionsDict: this.conditionsDict,oldLoginTime:this.oldLoginTime };
};

pro.load = function (saveData) {
    Activity.prototype.load.apply(this,arguments);
    if( !!saveData &&  !!saveData.detail )
    {
        this.oldLoginTime = saveData.detail.oldLoginTime || -1;
        this.onLogin();
    }
};

pro.onPublish = function () {
    if(this.init())
    {
        this.onLogin();
    }
    Activity.prototype.onPublish.apply(this,arguments);
};
/*
* 获取当前登录进度
* */
pro.getCurrProgress=function()
{
    var currProgress = 0;
    _.each(this.conditionsDict, function (condStatus) {
        currProgress = condStatus.progress;
        return currProgress
    });
    return currProgress;
};

pro.onLogin = function () {
    if( !!this.oldLoginTime && this.oldLoginTime > 0 && this.getCurrProgress() > 0 )
    {
        if( this.loginTime <this.oldLoginTime )
        {
            return;
        }
        var tempDay = this.loginTime- this.oldLoginTime;

        if( Utils.isSameDay( this.loginTime,this.oldLoginTime)  )
        {
            return;
        }
    }
    this.oldLoginTime = Date.now();
    this.progress();
};

module.exports = TotalLogin;