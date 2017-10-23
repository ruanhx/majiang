/**
 * Created by tony on 2016/9/19.
 */
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
var DailyResetManager = require('../../util/dailyResetManager'),
    Consts = require('../../consts/consts'),
    _ = require('underscore'),
    dataApi = require('../../util/dataApi'),
    playerManager = require('../world/playerManager'),
    EVENTS = require('../event/events');

var getMissionDataKey = function (conditionType, missionType, groupType) {
    return conditionType + '_' + missionType + '_' + groupType;
}

var MissionItem = function (player, missionData) {
    this.player = player;
    this.conditionType = missionData.conditionType;
    this.drewList = JSON.parse(missionData.drewList || "[]");
    this.progress = missionData.progress;
    this.missionType = missionData.missionType;
    this.groupType = missionData.groupType;
    this.rollList = JSON.parse(missionData.rollList || "[]");
    this.stage = missionData.stage || 0;
};
module.exports = MissionItem;

MissionItem.prototype.clearMission = function () {
    delete this.player;
    delete this.conditionType;
    delete this.drewList;
    delete this.progress;
    delete this.missionType;
    delete this.groupType;
    delete this.rollList;
    delete this.stage;

}

/*
 *  数据库要获取的数据
 *  */
MissionItem.prototype.getData = function () {
    return {
        playerId: this.player.id,
        progress: this.progress,
        conditionType: this.conditionType,
        missionType: this.missionType,
        groupType: this.groupType,
        drewList: this.drewList,
        rollList: this.rollList,
        stage: this.stage
    };
};

/*
 *  客户端获取的数据
 *  */
MissionItem.prototype.getClientInfo = function () {
    return {
        conditionType: this.conditionType,
        progress: this.progress,
        missionType: this.missionType,
        groupType: this.groupType,
        drewList: this.drewList,
        stage: this.stage
    };
};

/*
 *  标记为已经领取（1为已经领取）
 *  */
MissionItem.prototype.setDrew = function (missionId) {
    if (!!this.drewList) {
        var isHave = false;
        this.drewList.forEach(function (vMissionId) {
            if (missionId == vMissionId) {
                isHave = true;
                return;
            }
        });

        if (!isHave) {
            this.drewList.push(missionId);
            this.stage++;
            this.save();
        }
    }
};

/*
 * 保存到数据库
 * */
MissionItem.prototype.save = function () {
    this.player.pushMsg("Mission.refresh", this.getClientInfo());
    this.player.emit('saveMission', this.getData());
};

/*
 * 保存到数据库
 * */
MissionItem.prototype.saveData = function () {
    this.player.emit('saveMission', this.getData());
};


/*
 *  通过成就id判断是否完成进度
 *  */
MissionItem.prototype.isProgressOK = function (missionId,vprogress) {
    var missionData = dataApi.Mission.findById(missionId);
    var progress = this.progress;
    if(vprogress!=null){
        progress = vprogress;
    }
    if (!!missionData) {
        if(missionData.conditionValue2!=0){
            return ( progress >= missionData.conditionValue2 );
        }else {
            var needProgress = missionData.conditionValue1;
            return ( progress >= needProgress );
        }

    }
    return false;
};

/*
 *  通过成就id判断是否完成进度
 *  */
MissionItem.prototype.isRankProgressOK = function (missionId) {
    var missionData = dataApi.Mission.findById(missionId);
    if (!!missionData) {
        var needProgress = missionData.conditionValue1;
        return ( this.progress <= needProgress );
    }
    return false;
};

MissionItem.prototype.isCanGetAward = function (vMissionId) {
    var isAward = true;
    if (!this.drewList) {
        return isAward;
    }
    if (this.drewList.length === 0) {
        return isAward;
    }

    this.drewList.forEach(function (missionId) {
        if (missionId === vMissionId) {
            isAward = false;
        }
    });
    return isAward;
};


//====================================================================================================================================================================================================================================================================================================================================
//====================================================================================================================================================================================================================================================================================================================================
var Mission = function (player) {
    this.player = player;
};

module.exports = Mission;
var pro = Mission.prototype;
pro.clearMissionMgr = function(){
    delete this.player;
    delete this.resetTick;

    for(var i = 0 ; i < this.missions.length ; i ++){
        this.missions[i].clearMission();
        delete this.missions[i];
    }

    for(var key in this.missionsByType){
        delete this.missionsByType[key];
    }
    delete this.missionsByType;

    for(var key in this.progressByType){
        delete this.progressByType[key];
    }
    delete this.progressByType;
}
/*
 * 解析数据库数据
 * */
pro.load = function (dbMissions, resetTick) {
    // logger.debug("dbMissions %s ",dbMissions);
    var self = this;
    this.resetTick = resetTick;
    dbMissions = dbMissions || [];
    self.missions = [];
    self.missionsByType = {};
    self.progressByType = {};
    dbMissions.forEach(function (dbMission) {
        self.loadMission(dbMission);
    });
};

/*
 * 解析数据库数据
 * */
pro.loadMission = function (dbMission) {
    var mission = new MissionItem(this.player, dbMission);
    this.missions.push(mission);
    var key = getMissionDataKey(mission.conditionType, mission.missionType, mission.groupType);
    this.missionsByType[key] = mission;
    this.progressByType[mission.conditionType] = mission.stage;
    return mission;
};


/*
 * 获取任务进度
 * missionType：类型
 * groupType：组类型
 * conditionType：条件类型
 * */
pro.getCurrProgress = function (conditionType, missionType, groupType) {
    var key = getMissionDataKey(conditionType, missionType, groupType);
    var mission = this.missionsByType[key];
    if (!!mission) {
        return mission.progress || 0;
    }
    return 0;
};

/*
 * 新增一个任务类型
 * */
pro.addMission = function (conditionType, missionType, groupType, vProgress, valueType, arg) {
    var tempMission = {
        conditionType: conditionType,
        progress: vProgress,
        missionType: missionType,
        groupType: groupType
    };
    var mission = this.loadMission(tempMission);
    if (!!mission) {
        mission.save();
        // 跑马灯检查
        this.checkAndSendRolling(conditionType, missionType, groupType, mission, valueType, arg);
    }
};

/*
 * 刷新任务进度
 * vAddProgress:新增进度值
 * */
pro.refreshMission = function (conditionType, missionType, groupType, vAddProgress, valueType, arg) {
    //logger.debug("refreshMission -- conditionType = %s ,vAddProgress = %s ",conditionType , vAddProgress );
    var self = this;
    var key = getMissionDataKey(conditionType, missionType, groupType);
    var mission = this.missionsByType[key];

    if (!!mission) {
        var oldProgress = mission.progress;
        var isRefresh = false;
        if (valueType == Consts.MISSION_PROGRESS_VALUE_TYPE.ADD_VALUE) {
            mission.progress += vAddProgress;
            isRefresh = oldProgress < mission.progress;
        }
        else if (valueType == Consts.MISSION_PROGRESS_VALUE_TYPE.TOTAL_VALUE) {
            mission.progress = vAddProgress;
            isRefresh = oldProgress < mission.progress;
        }

        else if (valueType == Consts.MISSION_PROGRESS_VALUE_TYPE.MATH_MAX) {
            mission.progress = mission.progress > vAddProgress ? mission.progress : vAddProgress;
            isRefresh = oldProgress < mission.progress;
        } else if (valueType == Consts.MISSION_PROGRESS_VALUE_TYPE.CUR_VALUE) {
            mission.progress = vAddProgress;
            isRefresh = true;
        } else if (valueType == Consts.MISSION_PROGRESS_VALUE_TYPE.MATH_MIX) {
            mission.progress = mission.progress < vAddProgress ? mission.progress : vAddProgress;
            isRefresh = oldProgress > mission.progress;
        }
        mission.missionType = missionType;
        mission.groupType = groupType;
        if (isRefresh) {
            mission.save();
            // 跑马灯检查

        }
        this.checkAndSendRolling(conditionType, missionType, groupType, mission, valueType, arg);
    }
    //
    // this.missions.forEach(function(mission){
    //     if( mission.conditionType ==conditionType )
    //     {
    //         mission = self.missionsByType[key];
    //     }
    // });
};

/*
 * 下发给前端
 * */
pro.getClientInfo = function () {
    var missionList = [];
    this.missions.forEach(function (mission) {
        missionList.push(mission.getClientInfo());
    });
    return missionList;
};

/*
 * 重置推送
 * */
pro.pushMissionList = function () {
    this.player.pushMsg('Mission.reset', {missions: this.getClientInfo()});
};

// pro.setDrew = function (missionId) {
//     var missionData = dataApi.Mission.findById(missionId);
//     if (!missionData) {
//         logger.warn('setDrew missionId: %s not found!', missionId);
//         return;
//     }
//     var key = getMissionDataKey(missionData.conditionType, missionData.missionType, missionData.groupType);
//     var mission = this.missionsByType[key];
//     if (!mission) {
//         logger.debug('setDrew conditionType %s not found!', key);
//         return;
//     }
//     mission.setDrew(missionId);
//     this.progressByType[mission.conditionType] = mission.stage;
//     // progressUpdate = function (conditionType, valueType, vProgress, arg) {
//     mission.progressUpdate(missionData.conditionType,Consts.MISSION_PROGRESS_VALUE_TYPE.CUR_VALUE);
// };

/*
 * 更新进度操作
 * */
pro.doUpdateProgress = function (conditionType, missionType, groupType, vProgress, valueType, arg) {
    if (_.isNull(vProgress)) {
        vProgress = 1;
    }
    valueType = valueType || Consts.MISSION_PROGRESS_VALUE_TYPE.ADD_VALUE;
    //valueType = Code
    //表示已有数据 执行刷新
    var key = getMissionDataKey(conditionType, missionType, groupType);
    if (!!this.missionsByType[key]) {
        this.refreshMission(conditionType, missionType, groupType, vProgress, valueType, arg);
    }
    // 新增
    else {
        this.addMission(conditionType, missionType, groupType, vProgress, valueType, arg);
    }
};
// 检查是否需要发送跑马灯
pro.checkAndSendRolling = function (conditionType, missionType, groupType, mission, valueType, arg) {
    var listTemp = dataApi.Mission.getDataGroup(conditionType, missionType, groupType);
    var self = this;
    // var missionData = this.getDataByConditionType(conditionType,stage);
    _.map(listTemp, function (missionData) {
        // 配置表需要发送跑马灯 并且还没发送过
        if (!missionData.textInformation || mission.rollList.indexOf(missionData.id) != -1) {
            return;
        }
        if (valueType == Consts.MISSION_PROGRESS_VALUE_TYPE.MATH_MIX) {
            // 关卡进度达成要求
            if (mission.isRankProgressOK(missionData.id)) {
                var clientInfo = {};
                clientInfo.playerName = mission.player.playername;
                clientInfo.content = missionData.textInformation;
                if (arg) {
                    clientInfo.value = arg;
                } else {
                    clientInfo.value = [{type: Consts.MAIL_PARAM_TYPE.TRUE_VALUE, value: missionData.conditionValue1}];
                }
                pomelo.app.rpc.world.rollingRemote.rollingPush('*', {info: clientInfo, type: 0}, function (err, res) {
                    mission.rollList.push(missionData.id);
                });
            }
        } else {
            // 关卡进度达成要求
            if (self.isRollingProgressOK(missionData.id)) {
                var clientInfo = {};
                clientInfo.playerName = mission.player.playername;
                clientInfo.content = missionData.textInformation;
                if (arg) {
                    clientInfo.value = arg.slice();
                    if (conditionType == Consts.MISSION_CONDITION_TYPE.HERO_MAX_LV ||
                        conditionType == Consts.MISSION_CONDITION_TYPE.HAVE_XX_ARMOR_TO_XX_LV ||
                        conditionType == Consts.MISSION_CONDITION_TYPE.HAVE_XX_ARMS_TO_XX_LV ||
                        conditionType == Consts.MISSION_CONDITION_TYPE.HAVE_XX_AEROCRAFT_TO_XX_LV||
                        conditionType == Consts.MISSION_CONDITION_TYPE.HERO_ANY_MAX_LV)
                    {
                        clientInfo.value.push({type:Consts.MAIL_PARAM_TYPE.TRUE_VALUE,value:missionData.conditionValue1});
                    }
                } else {
                    clientInfo.value = [{type: Consts.MAIL_PARAM_TYPE.TRUE_VALUE, value: missionData.conditionValue1}];
                }
                pomelo.app.rpc.world.rollingRemote.rollingPush('*', {info: clientInfo, type: 0}, function (err, res) {
                    if (conditionType != Consts.MISSION_CONDITION_TYPE.ADD_HERO) {
                        mission.rollList.push(missionData.id);
                    }
                });
            }
        }
    });
};

/*
 * 获取新的进度
 * */
pro.getNewProgress = function (missionData, vProgress, valueType) {
    var self = this;
    //字段名conditionValue2:
    // 13,15,16,17，20，21为要求的数量，其他无效
    //13 达到某品质的角色有若干个、35 拥有若干个“护甲”品质达到一定品质、36 拥有若干个“副武器”品质达到一定品质、37 拥有若干个“飞行器”品质达到一定品质、61 达到某品质的角色有若干个,
    //
    if (missionData.conditionType == Consts.MISSION_CONDITION_TYPE.TO_XX_QUA_HERO_XX_CNT ||
        missionData.conditionType == Consts.MISSION_CONDITION_TYPE.HAVE_XX_ARMOR_TO_XX_QUA ||
        missionData.conditionType == Consts.MISSION_CONDITION_TYPE.HAVE_XX_ARMS_TO_XX_QUA ||
        missionData.conditionType == Consts.MISSION_CONDITION_TYPE.HAVE_XX_AEROCRAFT_TO_XX_QUA || missionData.conditionType == Consts.MISSION_CONDITION_TYPE.HERO_ANY_HAVE_XX_TO_XX_QUA
    ) {
        var tempJs = {
            13: Consts.HERO_TYPE.HERO,
            35: Consts.HERO_TYPE.ARMOR,
            36: Consts.HERO_TYPE.ARMS,
            37: Consts.HERO_TYPE.AEROCRAFT,
            61: Consts.HERO_TYPE.ANY
        };
        return self.player.heroBag.isFindData(missionData.conditionValue2, missionData.conditionValue1, tempJs[missionData.conditionType]);
    }
    //15 所有装备精炼等级大于等于
    if (missionData.conditionType == Consts.MISSION_CONDITION_TYPE.ALL_EQUIP_REFINE_XX_LV) {
        var tempValue = self.player.armBag.getRefineMinLv(missionData.conditionValue1);
        return tempValue;
    }
    //16 全身所有装备等级大于等于
    else if (missionData.conditionType == Consts.MISSION_CONDITION_TYPE.OUT_ALL_EQUIP_TO_XX_LV) {
        var tempValue = self.player.armBag.getEquipLvMin(missionData.conditionValue1);

        return tempValue;
    }
    //17 所有装备的觉醒星级大于等于
    else if (missionData.conditionType == Consts.MISSION_CONDITION_TYPE.OUT_ALL_EQUIP_AWAKE_START_TO_XX_LV) {
        var conditionValue2 = dataApi.Mission.getConditionValue2ByXX(missionData.conditionType, missionData.missionType, missionData.groupType);
        var tempValue = self.player.armBag.getWakeUpMinStar(conditionValue2);
        if (!!tempValue) {
            return tempValue;
        }
        return null;
    }
    //19 获得若干个不同角色、40 拥有若干个不同类型的“护甲”、41 拥有若干个不同类型的“副武器”、42 拥有若干个不同类型的“飞行器”、62 拥有若干个不同的类型角色
    else if (missionData.conditionType == Consts.MISSION_CONDITION_TYPE.GET_XX_DIFF_HERO ||
        missionData.conditionType == Consts.MISSION_CONDITION_TYPE.HAVE_XX_DIFF_ARMOR ||
        missionData.conditionType == Consts.MISSION_CONDITION_TYPE.HAVE_XX_DIFF_ARMS ||
        missionData.conditionType == Consts.MISSION_CONDITION_TYPE.HAVE_XX_DIFF_AEROCRAFT || missionData.conditionType == Consts.MISSION_CONDITION_TYPE.HERO_ANY_HAVE_XX_DIFF
    ) {
        var tempJs = {
            19: Consts.HERO_TYPE.HERO,
            40: Consts.HERO_TYPE.ARMOR,
            41: Consts.HERO_TYPE.ARMS,
            42: Consts.HERO_TYPE.AEROCRAFT,
            62: Consts.HERO_TYPE.ANY
        };
        var cnt = self.player.getHeroIdDiffHeroCnt(tempJs[missionData.conditionType]);
        return cnt;
    }
    else if (missionData.conditionType == Consts.MISSION_CONDITION_TYPE.HERO_MAX_LV ||
        missionData.conditionType == Consts.MISSION_CONDITION_TYPE.HAVE_XX_ARMOR_TO_XX_LV ||
        missionData.conditionType == Consts.MISSION_CONDITION_TYPE.HAVE_XX_AEROCRAFT_TO_XX_LV ||
        missionData.conditionType == Consts.MISSION_CONDITION_TYPE.HAVE_XX_ARMS_TO_XX_LV || missionData.conditionType == Consts.MISSION_CONDITION_TYPE.HERO_ANY_MAX_LV
    ) {
        var tempJs = {
            12: Consts.HERO_TYPE.HERO,
            30: Consts.HERO_TYPE.ARMOR,
            31: Consts.HERO_TYPE.ARMS,
            32: Consts.HERO_TYPE.AEROCRAFT,
            60: Consts.HERO_TYPE.ANY
        };
        var cnt = self.player.heroBag.isFindDataByLevel( missionData.conditionValue1,tempJs[missionData.conditionType]);
        return cnt;
    }
    // 20 任意X个数量达到X级（解锁角色用）
    else if (missionData.conditionType == Consts.MISSION_CONDITION_TYPE.ANY_XX_HERO_TO_XX_LV) {
        var heroCnt = self.player.findHeroCntData(missionData.conditionValue2, missionData.conditionValue1);
        return heroCnt;
    }
    // 21 消耗X个道具（解锁角色用，当是这个条件时，解锁需要消耗约定道具，在解锁时扣除）
    else if (missionData.conditionType == Consts.MISSION_CONDITION_TYPE.USE_XX_PROP) {
        if (valueType == Consts.MISSION_PROGRESS_VALUE_TYPE.USE_ID) {
            var id = vProgress;
            if (id == missionData.conditionValue1) {
                return 1;
            }
        }
        return 0;
    }
    //27 几个角色核心技能进阶到几级
    else if (missionData.conditionType === Consts.MISSION_CONDITION_TYPE.ANY_XX_HERO_SKILL_TO_XX_LV) {
        var tempProgress = -1;
        var heroMSkillLvCnt = self.player.findHeroSkillCntData(missionData.conditionValue2, missionData.conditionValue1);
        return heroMSkillLvCnt;
    }else
    //64 所有装备精炼等级大于等于
    if (missionData.conditionType == Consts.MISSION_CONDITION_TYPE.ALL_EQUIP_STRENGTHEN_XX_LV) {
        var tempValue = self.player.armBag.getStrengthenMinLv(missionData.conditionValue1);
        return tempValue;
    }

    if (valueType == Consts.MISSION_PROGRESS_VALUE_TYPE.ADD_VALUE) {
        if (vProgress == null) {
            vProgress = 1;
        }
    }
    return vProgress;
};
/**
 * 添加英雄跑马灯
 * @param heroData
 */
pro.progressAddHero = function (heroData) {
    if (!heroData) {
        return;
    }
    var self = this;
    var conditionType = Consts.MISSION_CONDITION_TYPE.ADD_HERO;
    var arg = [];
    arg.push({type: Consts.MAIL_PARAM_TYPE.CONFIG_VALUE, value: heroData.data.id, dropType: Consts.DROP_TYPE.HERO});
    var valueType = Consts.MISSION_PROGRESS_VALUE_TYPE.CUR_VALUE;
    var progress = heroData.data.roleGrade;
    self.progressUpdate(conditionType, valueType, progress, arg);

}
/**
 * 根据conditionType获取唯一的refdata数据
 * @param conditionType
 */
pro.getDataByConditionType = function (conditionType,stage) {
    stage = stage || 0;
    if (this.progressByType[conditionType]) {
        stage = this.progressByType[conditionType];
    }
    var missionData = dataApi.Mission.getDataByProgress(conditionType, stage);
    return missionData;
}

pro.updateProgress = function (conditionType, valueType,vProgress,stage) {
    var missionData = this.getDataByConditionType(conditionType,stage);
    if (!missionData) {
        // logger.error("playerid:%s  missionData error conditionType:%s", this.player.id, conditionType);
        return;
    }
    // _.map( conditionTypeGroup,function( missionData ){
    var missionType = missionData.missionType;
    var groupType = missionData.groupType;
    var progreesTemp = this.getNewProgress(missionData, vProgress, valueType);
    if(progreesTemp!=null){
        this.doUpdateProgress(conditionType, missionType, groupType, progreesTemp, valueType, null);
    }

};

//进度推进
pro.progressUpdate = function (conditionType, valueType, vProgress, arg) {
    valueType = valueType || Consts.MISSION_PROGRESS_VALUE_TYPE.ADD_VALUE;
    var self = this;

    var missionData = this.getDataByConditionType(conditionType);
    if (!missionData) {
        // logger.error("playerid:%s  missionData error conditionType:%s", this.player.id, conditionType);
        return;
    }
    // _.map( conditionTypeGroup,function( missionData ){
    var missionType = missionData.missionType;
    var groupType = missionData.groupType;
    var progreesTemp = self.getNewProgress(missionData, vProgress, valueType);
    if (!!progreesTemp) {
        self.doUpdateProgress(conditionType, missionType, groupType, progreesTemp, valueType, arg)
    }
    // });
};

/*
 *  是否达成开启条件
 *  */
pro.isOpenCondition = function (missionId) {
    var missionData = dataApi.Mission.findById(missionId);
    if (!missionData) {
        logger.warn('isOpenCondition missionId: %s not found!', missionId);
        return false;
    }
    var openCondition = missionData.openCondition;
    if (openCondition > 0) {
        return this.player.passedBarrierMgr.isPassed(openCondition);
    }
    else {
        return true;
    }
};

/*
 *  是否可以领取奖励
 *  */
pro.isCanGetAward = function (missionId) {
    var missionData = dataApi.Mission.findById(missionId);
    if (!missionData) {
        logger.warn('isOpenCondition missionId: %s not found!', missionId);
        return false;
    }
    var conditionType = missionData.conditionType;

    var key = getMissionDataKey(missionData.conditionType, missionData.missionType, missionData.groupType);
    var mission = this.missionsByType[key];
    if (!mission) {
        return false;
    }

    if (!mission.isCanGetAward(missionId)) {
        return false;
    }
    return true;
};

/*
 *  是否完成进度
 *  */
pro.isProgressOK = function (missionId) {
    var missionData = dataApi.Mission.findById(missionId);
    if (!missionData) {
        logger.warn('isOpenCondition missionId: %s not found!', missionId);
        return false;
    }
    var key = getMissionDataKey(missionData.conditionType, missionData.missionType, missionData.groupType);
    var mission = this.missionsByType[key];
    if (!mission) {
        return false;
    }
    // var progreesTemp = this.getNewProgress(missionData, null, Consts.MISSION_PROGRESS_VALUE_TYPE.CUR_VALUE);

    return mission.isProgressOK(missionId);
};

/*
 *  是否完成跑马灯
 *  */
pro.isRollingProgressOK = function (missionId) {
    var missionData = dataApi.Mission.findById(missionId);
    if (!missionData) {
        logger.warn('isOpenCondition missionId: %s not found!', missionId);
        return false;
    }
    var key = getMissionDataKey(missionData.conditionType, missionData.missionType, missionData.groupType);
    var mission = this.missionsByType[key];
    if (!mission) {
        return false;
    }
    var progreesTemp = this.getNewProgress(missionData, null, Consts.MISSION_PROGRESS_VALUE_TYPE.CUR_VALUE);
    return mission.isProgressOK(missionId,progreesTemp);
};

/*
 *  标记为已经领取（1为已经领取）
 *  */
pro.setDrew = function (missionId, conditionType) {
    var missionData = dataApi.Mission.findById(missionId);
    if (!missionData) {
        logger.warn('setDrew missionId: %s not found!', missionId);
        return false;
    }
    var key = getMissionDataKey(missionData.conditionType, missionData.missionType, missionData.groupType);
    var mission = this.missionsByType[key];
    if (!mission) {
        return false;
    }
    mission.setDrew(missionId);
    this.progressByType[mission.conditionType] = mission.stage;
    // progressUpdate = function (conditionType, valueType, vProgress, arg) {
    this.updateProgress(missionData.conditionType,Consts.MISSION_PROGRESS_VALUE_TYPE.CUR_VALUE,mission.progress);
};

/*
 * 重置每日任务
 * */
pro.reset = function () {
    this.player.resetDailyMissionTik();
    var self = this;
    if (!!this.missions && this.missions.length > 0) {
        this.missions.forEach(function (mission) {
            if (mission.missionType == Consts.MISSION_TYPE.TASK) {
                mission.progress = 0;
                mission.drewList = [];
                mission.stage = 0;
                var key = getMissionDataKey(mission.conditionType, mission.missionType, mission.groupType);
                self.missionsByType[key] = mission;
                mission.saveData();
            }
        });
        this.pushMissionList();
    }
};

pro.processOfflineReset = function () {
    var trigger = pomelo.app.get('cronManager').getTriggerById(9),
        nextExecuteTime, now = Date.now();
    if (!this.resetTick) {
        // 第一次
        this.reset();
        return;
    }
    if (!!trigger && !!this.resetTick) {
        nextExecuteTime = trigger.nextExcuteTime(this.resetTick);
        logger.debug('processOfflineReset %s', new Date(this.resetTick).toString());
        if (nextExecuteTime < now) {
            this.reset();
        }
    }
};