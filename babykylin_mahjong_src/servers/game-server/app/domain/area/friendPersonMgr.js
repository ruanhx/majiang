/**
 * Created by employee11 on 2016/2/1.
 */
var pomelo = require('pomelo'),
    _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename);

var consts = require('../../consts/consts'),
    dataUtils = require('../../util/dataUtils'),
    dataApi = require('../../util/dataApi'),
    dropUtils = require('../area/dropUtils');


var Manager = function (player) {
    this.player = player;
    this.VO = new VO({playerId:this.player.id});
};

var pro = Manager.prototype;

module.exports = Manager;
pro.clearFriendPersonMgr = function(){
    delete this.player;

    delete this.VO;
}

var VO = function(data){
    this.playerId = data.playerId||0;
    this.friendRemoveCnt = data.friendRemoveCnt||0;//好友列表
    this.recommend = data.recommend||[];//推荐表
    this.clearFRCntTime = data.clearFRCntTime||0;//清除每日删除次数时间
    this.sendEnergy = data.sendEnergy||[];//发送过体力的好友列表
    this.agreeCnt = data.agreeCnt || 0;//申请助战角色为好友，奖励
}

/**
 * 管理器加载数据
 * @param dbData
 */
pro.load = function(data){
    this.VO = new VO({});
    this.VO.playerId = this.player.id;
    if(data && data.length>0){
        this.VO.friendRemoveCnt = data[0].friendRemoveCnt;
        this.VO.recommend = JSON.parse(data[0].recommend);
        this.VO.clearFRCntTime = data[0].clearFRCntTime;
        this.VO.sendEnergy = JSON.parse(data[0].sendEnergy);
        this.VO.agreeCnt = data[0].agreeCnt;
    }
}

pro.setFriendRemoveCnt = function(cnt){
    this.VO.friendRemoveCnt = cnt;
    this.player.emit("saveFriendPerson",this.VO);
}

pro.setRecommend = function(recommendList){
    this.VO.recommend = recommendList;
    this.player.emit("saveFriendPerson",this.VO);
}

pro.getFriendRemoveCnt = function(){
    return this.VO.friendRemoveCnt;
}

pro.getRecommend = function(){
    return this.VO.recommend;
}

pro.getSendEnergy = function(){
    return this.VO.sendEnergy;
}

pro.setSendEnergy = function(fid){
    this.VO.sendEnergy.push(fid);
    this.player.emit("saveFriendPerson",this.VO);
}

pro.getAgreeCnt = function(){
    return this.VO.agreeCnt;
}
pro.setAgreeCnt = function(cnt){
    this.VO.agreeCnt = cnt;
    this.player.emit("saveFriendPerson",this.VO);
}

pro.removeRecommend = function(friendId){
    if(this.VO.recommend){
        var index = -1;
        for(var i=0;i<this.VO.recommend.length ;i++){
            if(friendId == this.VO.recommend[i].playerId){
                index = i;
                break;
            }
        }
        if(index!=-1){
            this.VO.recommend.splice(index,1);
            this.player.emit("saveFriendPerson",this.VO);
        }
    }
}

/**
 * 添加发送过体力的好友名单
 * @param friends
 * @returns {Array}
 */
pro.pushSendEnergy = function(friends){
    var self = this;
    friends = friends||[];
    var rs = [];
    _.each(friends,function (fid) {
        if(_.indexOf(self.sendEnergy,fid)=== -1){
            rs.push(fid);
            self.setSendEnergy(fid);
        }
    });

    return rs;
}

pro.getClearFRCntTime = function(){
    return this.VO.clearFRCntTime;
}

pro.setClearFRCntTime = function(time){
    this.VO.clearFRCntTime = time;
    this.player.emit("saveFriendPerson",this.VO);
}

pro.dailyClear = function(){
    this.VO.friendRemoveCnt = 0;
    this.VO.clearFRCntTime = Date.parse(new Date());
    this.VO.sendEnergy = [];
    this.player.emit("saveFriendPerson",this.VO);
}

pro.cleanDailyOffline = function () {
    var trigger = pomelo.app.get('cronManager').getTriggerById(consts.AREA_CRON.RESET_FRIEND_DAILY),
        nextExecuteTime, now = Date.now();
    if (!this.VO.clearFRCntTime) {
        // 第一次
        this.dailyClear();
        return;
    }
    if (!!trigger && !!this.VO.clearFRCntTime) {
        nextExecuteTime = trigger.nextExcuteTime(this.VO.clearFRCntTime);
        if (nextExecuteTime < now) {
            this.dailyClear();
        }
    }
};

