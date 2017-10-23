/**
 * Created by tony on 2016/9/20.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts'),
    flow = require('../../../consts/flow'),
    dataApi = require('../../../util/dataApi'),
    dropUtils = require('../../../domain/area/dropUtils');
var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

/*
* 领取任务成就奖励
* */
pro.drawAwards=function (msg, session, next)
{
    logger.debug('drawAwards playerId = %s, missionId = %s', session.get('playerId'), msg.missionId);
    var player = area.getPlayer(session.get('playerId'));

    var missionData = dataApi.Mission.findById( msg.missionId );
    if(!missionData)
    {
        logger.warn('missionHandler.drawAwards   missionId: %s not found!', msg.missionId);
        return next(null,{code:Code.MISSION.MISSION_ID_NOT_EXIST });
    }

    if( !player.missionMgr.isOpenCondition( msg.missionId ) )
    {
        return next(null,{code:Code.MISSION.CONDITION_NOT_ENOUGH });
    }

    if( !player.missionMgr.isCanGetAward( msg.missionId ) )
    {
        return next(null,{code:Code.MISSION.HAD_AWARD });
    }

    if( !player.missionMgr.isProgressOK( msg.missionId ) )
    {
        return next(null,{code:Code.MISSION.PROGRESS_NO_ENOUGH });
    }

    player.missionMgr.setDrew( missionData.id , missionData.conditionType);

    //掉落id
    var dropId = missionData.rewardId;

    var drops = dropUtils.getDropItems(dropId);

    if( missionData.missionType == Consts.MISSION_TYPE.TASK )
    {
        player.missionMgr.progressUpdate(Consts.MISSION_CONDITION_TYPE.FINISH_VALUE,Consts.MISSION_PROGRESS_VALUE_TYPE.ADD_VALUE,missionData.schedule);
        player.dataStatisticManager.refreshDailyOthers( Consts.OTHER_STTE.TASK_ACTIVE_VALUE , missionData.schedule );
    }

    return next(null,{code:Code.OK,award:player.applyDrops(drops,null,flow.ITEM_FLOW.MISSION_GAIN)});
};
