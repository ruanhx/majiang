/**
 * Created by Administrator on 2016/3/10 0010.
 */

var pomelo = require('pomelo'),
    _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename);

var consts = require('../../consts/consts'),
    dataUtils = require('../../util/dataUtils'),
    dataApi = require('../../util/dataApi'),
    dropUtils = require('./dropUtils');
    passedActivityEctypeDao = require('../../dao/passedActivityEctypeDao');

var Manager = function (player) {
    this.player = player;

};

var pro = Manager.prototype;

module.exports = Manager;
pro.clearPassedActivityEctype = function(){
    delete this.player;

    delete this.passedActivityEctypeMap;
}

pro.load = function(passedActivityEctype){
    var self = this;
    self.passedActivityEctypeMap = {};
    if(passedActivityEctype && (passedActivityEctype instanceof Array)){
        for(var i=0;i<passedActivityEctype.length;i++) {
            self.passedActivityEctypeMap[passedActivityEctype[i].activityid] = {'cooltime':passedActivityEctype[i].cooltime,'star':passedActivityEctype[i].star};
        }
    }
}

pro.getPassedActivityEctype = function(activityid){
    return this.passedActivityEctypeMap[activityid]||6;
}

pro.inActivityEctype = function(){
    return this.isEnter||0;
}

pro.enter = function(){
    this.isEnter = 1;
}

pro.out = function(activityid,star,cool){
    var ape = this.passedActivityEctypeMap[activityid];
    if(!ape){
        this.passedActivityEctypeMap[activityid] ={'cooltime':0,'star':6}
        ape = this.passedActivityEctypeMap[activityid];
    }
    var time = Date.parse(new Date());
    ape.cooltime = time+ cool*1000;
    ape.star = star||0;
    this.isEnter = 0;
    var rec = {};
    rec.playerid = this.player.id;
    rec.activityid = activityid;
    rec.star = star||0;
    rec.cooltime = ape.cooltime||0
    this.player.emit('updateActivityEctype', rec);
}

pro.canSweep = function(activityid){
    var ape = this.passedActivityEctypeMap[activityid];
    if(ape){
        return (3==ape.star);
    }
    return 0;
}

pro.isCooling = function(activityid){
    var ape = this.passedActivityEctypeMap[activityid];
    if(ape){
        var now = Date.parse(new Date());
        return (now < (ape.cooltime||0));
    }
    return 0;
}

pro.getClientInfo = function(activityid){
    var ape = this.passedActivityEctypeMap[activityid];
    if(ape){
        return {
            activityId : activityid,
            star:ape.star||6,
            coolEndtime:ape.cooltime||0,
        }
    }
    return {activityId:activityid,star:0,coolEndtime:0};
}

pro.getClientInfoList = function(){
    var self = this;
    var rs = [];
    for(var key in self.passedActivityEctypeMap){
        rs.push(self.getClientInfo(key));
    }
    return rs;
}

//
pro.cleanDailyActivityEctype = function(){
    this.player.set('dailyActGoldChallenge',0);
    this.player.set('dailyActExpChallenge',0);
    this.player.set('dailyActItemChallenge',0);
    this.player.set('lastCleanActivityEctype',Date.parse(new Date()));
	//logger.debug('+++++++++++++++++++++++++执行cleanDailyActivityEctype');
}

pro.cleanDailyActivityEctypeOffline = function () {
    var trigger = pomelo.app.get('cronManager').getTriggerById(consts.AREA_CRON.RESET_DAILY_ACTIVITY_ECTYPE),
        nextExecuteTime, now = Date.now();
    if (!this.player.lastCleanActivityEctype) {
        // 第一次
        this.cleanDailyActivityEctype();
        return;
    }
    if (!!trigger && !!this.player.lastCleanActivityEctype) {
        nextExecuteTime = trigger.nextExcuteTime(this.player.lastCleanActivityEctype);
        //logger.debug('processOfflineReset %s', new Date(this.player.lastCleanActivityEctype).toString());
        if (nextExecuteTime < now) {
            this.cleanDailyActivityEctype();
        }
    }
};
