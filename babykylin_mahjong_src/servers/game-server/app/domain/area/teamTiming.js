/**
 * Created by employee11 on 2016/1/6.
 */

var teamManager = require('./teamManager');
var barrierManager = require('./barrierManager');
var area = require('./area');

/*�Զ�ƥ�䵹��ʱ*/
function continueTimes(barrierId,team,times){
    /* �鿴�����Ƿ�����*/
    if(!team.isTeamHasPosition(barrierId)){
        team.pushLoadMessage();
        for(var i = 0; i < team.playerNum; i++){
            var teamPlayer = area.getPlayer(team.playerDataArray[i].playerId);
            playerOldLoadState[teamPlayer.id] =0;
            team.addPlayerChannel(teamPlayer.id,teamPlayer.frontendId);
        }
        var loadCount = setInterval(onCheckLoadingState,1000,team);
        loadingCount[team.teamId] = loadCount;
        clearInterval(internalCount[team.teamId]);
    }
    else
    {
        times += 1;
        if(times >= 30){
            for(var j = 0; j < team.playerNum; j++){
                var curPlayer = area.getPlayer(team.playerDataArray[j].playerId);
                curPlayer.setTeamId();
            }
            team.pushDisbandTeam();
            clearInterval(internalCount[team.teamId]);
            teamManager.removeTeam(team.teamId);
        }
    }
}

/*������״̬*/
function onCheckLoadingState(team){
    for(var i = 0; i < team.playerNum; i++){
        var teamPlayer = area.getPlayer(team.playerDataArray[i].playerId);
        if(playerOldLoadState[teamPlayer.id] === playerLoadState[teamPlayer.id] && playerOldLoadState[teamPlayer.id] !== 100){
            teamPlayer.timeCount++;
        }
        else
        {
            playerOldLoadState[teamPlayer.id] = playerLoadState[teamPlayer.id];
            teamPlayer.timeCount =0;
        }
        if(teamPlayer.timeCount >= 15){
            for(var j = 0; j < team.playerNum; j++){
                var player = area.getPlayer(team.playerDataArray[i].playerId);
                player.timeCount = 0;
                delete playerOldLoadState[player.id];
                delete playerLoadState[player.id];
            }
            team.pushDisbandTeam();
            clearInterval(loadingCount[team.teamId]);
            delete loadingCount[team.teamId];
            teamManager.removeTeam(team.teamId);
            break;
        }
    }
}

/*������ȴ����ʱ*/
function skillCDTick(player){
    if(skillCDTimes[player.id] > 0){
        skillCDTimes[player.id] -= 1;
    }
    else
    {
        player.setSkillStates(true);
        clearInterval(skillCDCount[player.id]);
        delete skillCDCount[player.id];
        delete skillCDTimes[player.id];
    }
}

var exp = module.exports;

var skillCDCount,skillCDTimes,playerLoadState,playerOldLoadState,internalCount,loadingCount;

exp.init = function(){
    skillCDCount = {};
    skillCDTimes = {};
    playerLoadState = {};
    playerOldLoadState = {};
    internalCount = {};
    loadingCount = {};
};

exp.clear = function(){
    skillCDCount = {};
    skillCDTimes = {};
    playerLoadState = {};
    playerOldLoadState = {};
    internalCount = {};
    loadingCount = {};
};

/*����������ȴ��ʱ*/
exp.startSkillCD = function(player){
    skillCDTimes[player.id] = 30;
    var iCount = setInterval(skillCDTick,1000,player);
    skillCDCount[player.id] = iCount;
};

/*�����Զ���Ӽ�ʱ*/
exp.startCreateTick = function(barrierId,team){
    var times = 0;
    var iCount = setInterval(continueTimes,1000,barrierId,team,times);
    internalCount[team.teamId] = iCount;
};

/*ֹͣ�Զ���Ӽ�ʱ*/
exp.stopCreateTick = function(player){
    var iCount = internalCount[player.teamId];
    clearInterval(iCount);

    if(!internalCount[player.teamId]){
        return;
    }
    delete internalCount[player.teamId];
};

/*�����ؽ���*/
exp.checkLoading = function(playerId,loadPercent,teamBarrierInfo,team){
    playerLoadState[playerId] = loadPercent;
    /* �������������г�Ա�Ľ����Ƿ񶼴ﵽ100%���������֪ͨ����ս��*/
    for(var i = 0; i < team.playerNum; i++){
        if(playerLoadState[team.playerDataArray[i].playerId] === 100){
            if(i === team.playerNum - 1){
                for(var j = 0; j < team.playerNum; j++){
                    /*����ս������������Ҵ���״̬*/
                    var player = area.getPlayer(team.playerDataArray[i].playerId);
                    player.setSkillStates(false);
                    delete playerLoadState[team.playerDataArray[i].playerId];
                    delete playerOldLoadState[team.playerDataArray[i].playerId];
                }
                clearInterval(loadingCount[team.teamId]);
                delete loadingCount[team.teamId];

                barrierManager.createTeamBarrier(team,teamBarrierInfo.name);
                team.pushStartBattle();
                var teamBarrier = barrierManager.getTeamBarrier(team.teamId);
                setTimeout(teamBarrier.countDown,3000);
                setTimeout(exp.startSkillCD,3000);
            }
        }
        else
        {
            break;
        }
    }
};

/* �������ж�����ʱ*/
exp.startAnimationTick = function(player){
    var remainTimes = 7;
    function skillEffects(){
        if(remainTimes > 0){
            remainTimes -= 1;
        }
        else
        {
            exp.startSkillCD(player);
            /*���������꿪ʼ������ȴ*/
            var teamObj = teamManager.getTeam(player.teamId);
            for(var i =0; i < teamObj.playerDataArray[i].playerNum; i++){
                if(skillCDTimes[teamObj.playerDataArray[i].playerId] > 0){
                    var teamPlayer = area.getPlayer(teamObj.playerDataArray[i].playerId);
                    var newCount = setInterval(skillCDTick,1000,teamPlayer);
                    skillCDCount[teamObj.playerDataArray[i].playerId] = newCount;
                }
            }
            clearInterval(iCount);
        }
    }
    var iCount = setInterval(skillEffects,1000,player);
};

/* ��ͣ���м�ʱ*/
exp.stopAllCD = function (player){
    var teamObj = teamManager.getTeam(player.teamId);
    for(var i =0; i < teamObj.playerDataArray[i].playerNum; i++){
        if(skillCDCount[teamObj.playerDataArray[i].playerId]){
            clearInterval(skillCDCount[teamObj.playerDataArray[i].playerId]);
            delete skillCDCount[teamObj.playerDataArray[i].playerId];
        }
    }
};
