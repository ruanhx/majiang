/**
 * Created by employee11 on 2015/12/28.
 */

var pomelo = require('pomelo');

var id = 100;

var teamBarrier = function(opts){
    this.teamBarrierId = id++;
    this.barrierId = opts.barrierId;
    this.name = opts.name;
    this.victory = false;                //ս��ʤ����־
    this.channel = this.createChannel();
};

var pro = teamBarrier.prototype;

/*����Channel*/
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

/*�����ҵ�Channel��*/
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

/*��Channel���Ƴ����*/
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

/*��ʼս������ʱ*/
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
        // ս��ʤ��ֹͣ��ʱ
        if(_self.victory){
            clearInterval(iCount);
        }
    }
    var iCount = setInterval(timing,1000);
};

/*�㲥ս��ʱ�䵽��Ϣ�����*/
pro.pushBarrierTimeout = function(){
    if(!this.channel){
        return false;
    }
    this.channel.pushMessage('barrierTimeout', {}, null);
};

/*ͬ����ұ��˺�*/
pro.pushSyncHeroHurt = function(hurtInfo){
    if(!this.channel){
        return false;
    }
    this.channel.pushMessage('syncHeroHurt', hurtInfo, null);
};

/*�㲥���ʹ�ô���*/
pro.pushUseSkill = function(useSkillInfo){
    if(!this.channel){
        return false;
    }
    this.channel.pushMessage('useSkill', useSkillInfo, null);
};

/*�㲥���λ��*/
pro.pushPlayerPos = function(playerPos){
    if(!this.channel){
        return false;
    }
    this.channel.pushMessage('syncPlayerPos', playerPos, null);
};

/*�㲥�����Ծ*/
pro.pushPlayerJump = function(playerJump){
    if(!this.channel){
        return false;
    }
    this.channel.pushMessage('playerJump', playerJump, null);
};

/*�㲥���ųԵ���buffer*/
pro.pushUseBuffer = function(bufferInfo){
    if(!this.channel){
        return false;
    }
    this.channel.pushMessage('playBuffer', bufferInfo, null);
};

/*��ȡ���ս����Ϣ*/
pro.getTeamBarrierInfo = function(){
    var teamBarrierInfo = {
        id:this.teamBarrierId,
        startTick:this.startTick
    };
    return teamBarrierInfo;
};
module.exports = teamBarrier;