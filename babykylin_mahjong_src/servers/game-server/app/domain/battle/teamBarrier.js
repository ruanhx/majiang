/**
 * Created by employee11 on 2015/12/28.
 */

var pomelo = require('pomelo');

var id = 100;

var teamBarrier = function(opts){
    this.teamBarrierId = id++;
    this.barrierId = opts.barrierId;
    this.name = opts.name;
    this.victory = false;                //战斗胜利标志
    this.channel = this.createChannel();
};

var pro = teamBarrier.prototype;

/*创建Channel*/
pro.createChannel = function() {
    if(this.channel) {
        return this.channel;
    }
    var channelName = 'teamBarrier_' + this.teamBarrierId;
    this.channel = pomelo.app.get('channelService').getChannel(channelName, true);
    if(this.channel) {
        return this.channel;
    }
    return null;
};

/*添加玩家到Channel中*/
pro.addPlayerChannel = function(data) {
    if(!this.channel) {
        return false;
    }
    if(data) {
        this.channel.add(data.id, data.frontendId);
        return true;
    }
    return false;
};

/*从Channel中移除玩家*/
pro.removePlayerFromChannel = function(data) {
    if(!this.channel) {
        return false;
    }
    if(data) {
        this.channel.leave(data.id, data.frontendId);
        return true;
    }
    return false;
};

/*开始战斗倒计时*/
pro.countDown = function(){
    this.startTick = Date.now();
    var barrierTime;
    var _self =this;
    function timing() {
        barrierTime = Date.now();
        if (barrierTime - _self.startTick > 300000) {
            _self.pushBarrierTimeout();
            clearInterval(iCount);
        }
        // 战斗胜利停止计时
        if(_self.victory){
            clearInterval(iCount);
        }
    }
    var iCount = setInterval(timing,1000);
};

/*广播战斗时间到消息给玩家*/
pro.pushBarrierTimeout = function(){
    if(!this.channel){
        return false;
    }
    this.channel.pushMessage('barrierTimeout', {}, null);
};

/*同步玩家被伤害*/
pro.pushSyncHeroHurt = function(hurtInfo){
    if(!this.channel){
        return false;
    }
    this.channel.pushMessage('syncHeroHurt', hurtInfo, null);
};

/*广播玩家使用大招*/
pro.pushUseSkill = function(useSkillInfo){
    if(!this.channel){
        return false;
    }
    this.channel.pushMessage('useSkill', useSkillInfo, null);
};

/*广播玩家位置*/
pro.pushPlayerPos = function(playerPos){
    if(!this.channel){
        return false;
    }
    this.channel.pushMessage('syncPlayerPos', playerPos, null);
};

/*广播玩家跳跃*/
pro.pushPlayerJump = function(playerJump){
    if(!this.channel){
        return false;
    }
    this.channel.pushMessage('playerJump', playerJump, null);
};

/*广播播放吃道具buffer*/
pro.pushUseBuffer = function(bufferInfo){
    if(!this.channel){
        return false;
    }
    this.channel.pushMessage('playBuffer', bufferInfo, null);
};

/*获取组队战斗信息*/
pro.getTeamBarrierInfo = function(){
    var teamBarrierInfo = {
        id:this.teamBarrierId,
        startTick:this.startTick
    };
    return teamBarrierInfo;
};
module.exports = teamBarrier;