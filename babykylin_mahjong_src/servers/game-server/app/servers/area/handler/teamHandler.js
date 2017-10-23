/**
 * Created by employee11 on 2015/12/21.
 */

var area = require('../../../domain/area/area');
var teamManager = require('../../../domain/area/teamManager');
var Code = require('../../../../shared/code');
var logger = require('pomelo-logger').getLogger(__filename);
var dataApi = require('../../../util/dataApi');
var teamTiming = require('../../../domain/area/teamTiming');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;


/*开启自动匹配组队*/
pro.autoCreateTeam = function(msg,session,next){
    var barrierId = msg.barrierId;
    var playerId = session.get('playerId');
    var player = area.getPlayer(playerId);

    // 检查关卡ID
    var teamBarrierInfo = dataApi.teamBarrier.findById(barrierId);
    if (!teamBarrierInfo) {
        // 无此关卡
        next(null, {code: Code.AREA.INVALID_BARRIER});
        return;
    }

    var teamObj = area.getTeamObj(barrierId);
    if(!!teamObj){
        var playerData = teamObj.addPlayer(barrierId,player);
        if(typeof playerData !== 'object'){
            next(null, {code: Code.FAIL});
            return;
        }
        player.setTeamId(teamObj.teamId);
        next(null, {code: Code.OK, team: teamObj.getTeamData()});
    }
    else
    {
        var teamInfo = {};
        teamInfo.barrierId = barrierId;
        teamInfo.maxPlayerNum = teamBarrierInfo.needPlayerNum;
        var team = teamManager.createTeam(teamInfo,player);
        player.setTeamId(team.teamId);
        teamTiming.startCreateTick(barrierId,team);
        next(null, {code: Code.OK, team: team.getTeamData()});
    }
};

/*取消自动匹配组队*/
pro.cancelAutoCreateTeam = function(msg,session,next){
    var playerId = session.get('playerId');
    var player =area.getPlayer(playerId);
    player.setTeamId();
    var team = teamManager.getTeam(player.teamId);
    team.removePlayerFromTeam(player);
    if(team.playerNum === 0){
        teamTiming.stopCreateTick(player);
        teamManager.removeTeam(player.teamId);
    }
    else
    {
        team.updateTeamInfo();
    }
    next(null,{code:Code.OK});
};

/* 广播玩家的加载进度给队伍成员，所有成员加载完成后通知所有玩家进入战斗*/
pro.loadingPercent = function(msg,session,next){
    var playerId = session.get('playerId');
    var player = area.getPlayer(playerId);
    var team = teamManager.getTeam(player.teamId);
    var baseBarrierInfo = dataApi.teamBarrier.findById(team.barrierId);
    team.pushLoadPercent(playerId,msg.percent);
    teamTiming.checkLoading(playerId,msg.percent,baseBarrierInfo,team);
    next();
};
