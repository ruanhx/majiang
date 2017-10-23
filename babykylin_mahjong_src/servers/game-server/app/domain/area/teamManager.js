/**
 * Created by employee11 on 2016/2/1.
 */
var logger = require('pomelo-logger').getLogger(__filename);
var Team = require('../entity/team');

var exp = module.exports;

var teams;

exp.init = function(){
    teams = {};
};

exp.clear = function(){
    teams = {};
};

/*查看是否有该关卡的待组队队伍信息*/
exp.getTeamObj = function(barrierId){
    var teamObj,teamIds = Object.keys(teams);
    if(!!teamIds && teamIds.length> 0){
        for(var i = 0; i < teamIds.length; i++){
            if(teams[teamIds[i]].barrierId === barrierId){
                if(teams[teamIds[i]].isTeamHasPosition(barrierId)){
                    teamObj = teams[teamIds[i]];
                    return teamObj;
                }
                else
                {
                    console.log('the team has not pos');
                }
            }
        }
    }
    return teamObj;
};

/*获取队伍信息*/
exp.getTeam = function(teamId){
    return teams[teamId];
};

/*从队伍列表中移除某一队伍*/
exp.removeTeam = function(teamId){
    var team = teams[teamId];
    if(!team){
        return;
    }
    delete teams[teamId];
};

/*添加队伍到队伍列表中*/
exp.addTeams = function(entity){
    var entityId = entity.teamId;
    if(!entity || !entityId){
        logger.error('addTeams entity = %j, entityId = %s', entity, entityId);
        return false;
    }
    if(teams[entityId]){
        logger.error('addTeams entityId %s duplicated!', entityId);
        return false;
    }
    teams[entityId] = entity;
    return true;
};

/*创建队伍*/
exp.createTeam = function(data,player){
    var team = new Team(data);
    var reason = team.addPlayer(team.barrierId,player);
    if(reason){
        if(!exp.addTeams(team)){
            return null;
        }
    }
    return team;
};


