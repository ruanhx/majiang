/**
 * Created by employee11 on 2015/12/21.
 */
var pomelo = require('pomelo');
var dataApi = require('../../util/dataApi');
var consts = require('../../consts/consts');
var Code = require('../../../shared/code');
var area = require('../area/area');

var id = 100;

var Team = function(opts){
    this.teamId = id++;
    this.barrierId = opts.barrierId;
    this.playerNum = 0;
    this.channel = this.createChannel();
    this.playerDataArray = new Array(opts.maxPlayerNum);
};

var pro = Team.prototype;

pro.getTeamData = function()
{
    var teamData = {};
    teamData.teamId = this.teamId;
    teamData.barrierId = this.barrierId;
    teamData.playerNum = this.playerNum;
    teamData.playerDataArray = this.playerDataArray;
    return teamData;
};

/*����Channel*/
pro.createChannel = function() {
    if(this.channel) {
        return this.channel;
    }
    var channelName = 'team_' + this.teamId;
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

// ���ض�������
pro.getPlayerNum = function() {
    return this.playerNum;
};

// �����Ƿ�����
pro.isTeamHasPosition = function(barrierId) {
    var teamBarrierInfo = dataApi.teamBarrier.findById(barrierId);
    return this.getPlayerNum() < teamBarrierInfo.needPlayerNum;
};

function doAddPlayer(teamObj, data) {
    var arr = teamObj.playerDataArray;
    for(var i = 0; i < arr.length; i++) {
        if(!arr[i]) {
            var playerInfo = {};
            playerInfo.playerId = data.id;
            playerInfo.frontendId = data.frontendId;
            playerInfo.name = data.playername;
            playerInfo.hero = data.curHero;
            teamObj.playerDataArray[i] = playerInfo;
            return teamObj.playerDataArray;
        }
    }
}

// �����ҵ�������
pro.addPlayer = function(barrierId,data){
    var teamBarrierInfo = dataApi.teamBarrier.findById(barrierId);
    if (!data || typeof data !== 'object') {
        return consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
    }

    if(!this.isTeamHasPosition(barrierId)) {
        return consts.TEAM.JOIN_TEAM_RET_CODE.NO_POSITION;
    }
    var teamPlayer = doAddPlayer(this, data);

    if(!this.addPlayerChannel(data)) {
        return consts.TEAM.JOIN_TEAM_RET_CODE.SYS_ERROR;
    }

    if(this.playerNum < teamBarrierInfo.needPlayerNum) {
        this.playerNum++;
    }
    this.updateTeamInfo();
    return teamPlayer;
};

//�Ӷ������Ƴ����
pro.removePlayerFromTeam = function(player){
    var arr = this.playerDataArray;
    for(var i = 0; i < this.playerNum; i++){
        if(arr[i].playerId === player.id){
            arr.splice(i,1);
            this.playerNum--;
            this.removePlayerFromChannel(player);
        }
    }
    return arr;
};

// ���Ͷ����Ա��Ϣ��ÿ�����
pro.updateTeamInfo = function() {
    var infoObjDict = {};
    var arr = this.playerDataArray;
    for (var i in arr) {
        var playerId = arr[i].playerId;
        if(playerId === consts.TEAM.PLAYER_ID_NONE) {
            continue;
        }
        infoObjDict[playerId] = arr[i];
    }
    this.channel.pushMessage('onUpdateTeam', infoObjDict, null);
};

/*֪ͨ�����Ա��ʼ���س���*/
pro.pushLoadMessage = function(){
    if(!this.channel){
        return false;
    }
    this.channel.pushMessage('onLoadBarrier', {}, null);
};

/*�㲥��ɢ������Ϣ*/
pro.pushDisbandTeam = function(){
    if(!this.channel){
        return false;
    }
    this.channel.pushMessage('disbandTeam', {}, null);
};

/*�㲥���ؽ���*/
pro.pushLoadPercent = function(playerId,percent){
    if(!this.channel){
        return false;
    }
    this.channel.pushMessage('onLoading', {playerId:playerId,percent:percent,tick:Date.now()}, null);
};

/*�㲥����ս��*/
pro.pushStartBattle = function(){
    if(!this.channel){
        return false;
    }

    this.channel.pushMessage('startBattle', {}, null);
};

/**/
pro.startOnCheckLoading = function(){
    for(var i = 0; i < this.playerDataArray.length; i++){
        setInterval();
    }
};

module.exports = Team;