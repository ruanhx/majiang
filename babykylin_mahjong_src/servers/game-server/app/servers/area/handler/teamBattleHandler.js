/**
 * Created by employee11 on 2015/12/31.
 */

var area = require('../../../domain/area/area');
var barrierManager = require('../../../domain/area/barrierManager');
var Code = require('../../../../shared/code');
var pomelo = require('pomelo');
var teamTiming = require('../../../domain/area/teamTiming');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

/*同步玩家被伤害*/
pro.syncHeroHurt = function(msg,session,next){
    var playerId = session.get('playerId');
    var player = area.getPlayer(playerId);
    var teamBarrier = barrierManager.getTeamBarrier(player.teamId);
    var hurtInfo = {};
    hurtInfo.tick = Date.now();
    hurtInfo.playerId = playerId;
    hurtInfo.hurtValue = msg.value;
    teamBarrier.pushSyncHeroHurt(hurtInfo);
    next();
};

/*释放大招*/
pro.useSkill = function(msg,session,next){
    var playerId = session.get('playerId');
    var player = area.getPlayer(playerId);
    if(player.skillStates){
        player.setSkillStates(false);
    }
    else
    {
        next(null,{code:Code.AREA.SKILL_NOT_READY});
        return;
    }
    var teamBarrier = barrierManager.getTeamBarrier(player.teamId);
    var useSkillInfo = {};
    useSkillInfo.tick = Date.now();
    useSkillInfo.playerId = playerId;
    useSkillInfo.skillType = msg.skillType;
    teamBarrier.pushUseSkill(useSkillInfo);
    teamTiming.stopAllCD(player);
    teamTiming.startAnimationTick(player);
    next(null,{code:Code.OK});
};

/* 玩家位置同步*/
pro.playerMove = function(msg, session, next){
    var playerId = session.get('playerId');
    var player = area.getPlayer(playerId);
    var teamBarrier = barrierManager.getTeamBarrier(player.teamId);
    var playerPos = {};
    playerPos.playerId = playerId;
    playerPos.tick = Date.now();
    playerPos.direction = msg.direction;
    playerPos.directionAngle = msg.directionAngle;
    playerPos.point = msg.point;
    teamBarrier.pushPlayerPos(playerPos);
    next();
};

/* 玩家跳跃*/
pro.playerJump = function(msg, session, next){
    var playerId = session.get('playerId');
    var player = area.getPlayer(playerId);
    var teamBarrier = barrierManager.getTeamBarrier(player.teamId);
    var playerJump = {};
    playerJump.playerId = playerId;
    teamBarrier.pushPlayerJump(playerJump);
    next();
};

/*吃道具buffer*/
pro.useBuffer = function(msg, session, next){
    var playerId = session.get('playerId');
    var player = area.getPlayer(playerId);
    var teamBarrier = barrierManager.getTeamBarrier(player.teamId);
    var buffer = {};
    buffer.playerId = playerId;
    buffer.tick = Date.now();
    buffer.propType = msg.propType;
    teamBarrier.pushUseBuffer(playerId,buffer);
    next();
};

