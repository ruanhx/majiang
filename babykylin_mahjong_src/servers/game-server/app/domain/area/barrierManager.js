/**
 * Created by employee11 on 2016/2/1.
 */
var logger = require('pomelo-logger').getLogger(__filename);
var Barrier = require('../battle/barrier');
var teamBarrier = require('../battle/teamBarrier');

var exp = module.exports;

var barriers, barrierMapByPlayerId, teamBarriers, barrierMapByTeamId;

exp.init = function () {
    barriers = {};
    barrierMapByPlayerId = {};
    teamBarriers = {};
    barrierMapByTeamId = {};
};

exp.clear = function () {
    barriers = {};
    barrierMapByPlayerId = {};
    teamBarriers = {};
    barrierMapByTeamId = {};
};

/*�����ؿ�*/
exp.createBarrier = function (player, barrierId, barrierData,barrierDropList,dropDouble,passTime) {
    var barrier, opts = {};
    opts.barrierId = barrierId;
    opts.name = barrierData.customName;
    opts.player = player;
    opts.passTime = passTime;
    barrier = new Barrier(opts);

    barriers[barrier.id] = barrier;
    barriers[barrier.id].barrierDropList = barrierDropList || [];
    barriers[barrier.id].dropDouble = dropDouble || 1;

    barrierMapByPlayerId[player.id] = barrier.id;

    if (!!barrier) {
        return barrier;
    } else {
        logger.debug('createBarrier barrierId may be duplicated!playerId = %s, barrier.id = %s', player.id, barrierId);
    }
    return barrier;
};

/*���ٹؿ�*/
exp.destroyBarrier = function (player) {
    var bId = barrierMapByPlayerId[player.id];
    var barrier = barriers[bId];
    if (barrier) {
        barrier.destroy();
        if (exp.removeBarrier(bId)) {
            return true;
        }
    }
    return false;
};

/*�Ƴ��ؿ�*/
exp.removeBarrier = function (barrierId) {
    var barrier = barriers[barrierId];
    if (barrier) {
        delete barrierMapByPlayerId[barrier.player.id];
        delete barriers[barrierId];
        return true;
    }
    return false;
};

/*���ҹؿ�*/
exp.getBarrier = function (playerId) {
    var bId = barrierMapByPlayerId[playerId];
    return barriers[bId];
};

//是否在战斗当中
exp.isInBarrier = function(playerId){
    var bId = barrierMapByPlayerId[playerId];
    if(bId){
        return true;
    }
    else{
        return false;
    }
};


/*�������ս��*/
exp.createTeamBarrier = function (teamData, barrierName) {
    var barrier, teamInfo = {};
    teamInfo.name = barrierName;
    teamInfo.barrierId = teamData.barrierId;
    barrier = new teamBarrier(teamInfo);

    teamBarriers[barrier.teamBarrierId] = barrier;
    barrierMapByTeamId[teamData.teamId] = barrier.teamBarrierId;

    if (!!barrier) {
        for (var i = 0; i < teamData.playerNum; i++) {
            barrier.addPlayerChannel(teamData.playerDataArray[i].playerId, teamData.playerDataArray[i].frontendId)
        }
        return true;
    }
    return false;

};

/*������ӹؿ�*/
exp.destroyTeamBarrier = function (teamId) {
    var bId = barrierMapByTeamId[teamId];
    var barrier = teamBarriers[bId];
    if (barrier) {
        // ȷ���˹ؿ����ڲ�����
        if (barrier.teamId === teamId) {
            exp.removeTeamBarrier(bId)
            return true;
        }
    }
    return false;
};

/* �Ƴ���ӹؿ� */
exp.removeTeamBarrier = function (barrierId) {
    var barrier = teamBarriers[barrierId];
    if (barrier) {
        delete barrierMapByTeamId[barrier.teamId];
        delete teamBarriers[barrierId];
        return true;
    }
    return false;
};

/*������ӹؿ�*/
exp.getTeamBarrier = function (teamId) {
    var bId = barrierMapByTeamId[teamId];
    return teamBarriers[bId];
};