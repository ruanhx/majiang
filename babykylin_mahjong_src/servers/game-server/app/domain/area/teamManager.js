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

/*�鿴�Ƿ��иùؿ��Ĵ���Ӷ�����Ϣ*/
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

/*��ȡ������Ϣ*/
exp.getTeam = function(teamId){
    return teams[teamId];
};

/*�Ӷ����б����Ƴ�ĳһ����*/
exp.removeTeam = function(teamId){
    var team = teams[teamId];
    if(!team){
        return;
    }
    delete teams[teamId];
};

/*��Ӷ��鵽�����б���*/
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

/*��������*/
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


