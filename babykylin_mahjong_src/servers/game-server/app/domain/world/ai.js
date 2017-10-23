/**
 * Created by kilua on 2016/7/23 0023.
 */

var _ = require('underscore');

var dataUtils = require('../../util/dataUtils'),
    dataApi = require('../../util/dataApi');

var exp = module.exports = {};

/*
 *   计算AI战力
 *   @param {Number} playerPower 玩家战力
 * */
exp.getPower = function (playerPower) {
    var option = dataUtils.getRangeOption('Endless_AiPowerRate');
    return Math.ceil(playerPower * (Math.random() * (option.high - (option.low)) + (option.low)));
};

/*
 *   计算AI得分加成
 *   @param {Number} playerScoreAddPercent 玩家得分加成
 * */
exp.getScoreAddPercent = function (playerScoreAddPercent) {
    var option = dataUtils.getRangeOption('Endless_AiAddScoreRate');
    return playerScoreAddPercent * (Math.random() * (option.high - (option.low)) + (option.low));
};

/*
 *   随机生成名字
 *   @param {Boolean} forAI 是否为AI生成
 * */
exp.getRndFullName = function () {
    return dataApi.FamilyNameList.getRndFamilyNameByType(true) +"#"+dataApi.NameList.getRndNameByType(true);
};

exp.getRndName = function () {
    return dataApi.NameList.getRndNameByType(true);
};

exp.getRndFamilyName = function () {
    return dataApi.FamilyNameList.getRndFamilyNameByType(true);
};

/*
 *   计算玩家当前匹配用的战力
 *   @param {Number} playerPower 玩家当前战力
 *   @param {Number} maxWin 连胜次数
 *   @param {Number} maxLose 连败次数
 * */
exp.getToMatchPower = function (playerPower, maxWin, maxLose) {
    if (maxWin === 0 && maxLose === 0) {
        return playerPower;
    }
    if (maxWin > 0) {
        return playerPower * (1 + dataUtils.getOptionValue('Endless_MatchPowerAdd', 0.1) * maxWin);
    }
    return playerPower * (1 - dataUtils.getOptionValue('Endless_MatchPowerReduce', 0.1) * maxLose);
};

/*
 *   计算玩家是否可以赢机器人
 * */
exp.getPlayerWin = function (maxWin, maxLose) {
    var robotWinPro;
    if (maxWin === 0 && maxLose === 0) {
        robotWinPro = dataUtils.getOptionValue('Endless_AiWinRate03', 0.5);
    } else if (maxWin > 0) {
        robotWinPro = dataUtils.getOptionListValueByIndex('Endless_AiWinRate01', maxWin - 1, '&');
    } else {
        robotWinPro = dataUtils.getOptionListValueByIndex('Endless_AiWinRate02', maxLose - 1, '&');
    }
    return (Math.random() > robotWinPro);
};

/*
 *    机器人预期失败时，预先算好其第几关将会退出
 * */
exp.getFailBattleId = function (result, occasionId) {
    var occasionData = dataApi.EndlessType.findById(occasionId);
    if (result && occasionData) {
        var battleDatas = dataApi.EndlessBattle.findBy('id', occasionData.endlessId);
        var i, battleData, failPro = dataUtils.getOptionValue('Endless_AiLoseEndRate', 0.1);
        for (i = 0; i < battleDatas.length; ++i) {
            battleData = battleDatas[i];
            if (Math.random() < failPro) {
                return battleData.systemId;
            }
        }
    }
    return 0;
};
/*
 *   生成无尽模式PVP机器人信息
 * */
exp.makeRobot = function (occasionId, playerPower, playerScorePer, maxWin, maxLose,aiWinRate) {
    var power = exp.getPower(exp.getToMatchPower(playerPower, maxWin, maxLose)),
        result;
    if(aiWinRate){
        result = Math.random() > aiWinRate ? false: true;
    }else {
        result = exp.getPlayerWin(maxWin, maxLose);
    }

    // 机器人没有playerId
    return {
        name: exp.getRndFullName(),
        fightHeroId: dataApi.EndlessAi.getRndHeroIdByPower(power),
        fightPetId: dataApi.EndlessAi.getRndHeroIdByPower(power),
        power: power,
        scorePer: exp.getScoreAddPercent(playerScorePer),
        // 赛事结果预期,true是玩家方赢，false是玩家方输
        result: result,
        failBattleId: exp.getFailBattleId(result, occasionId),
        // familyName:exp.getRndFamilyName()
    }
};

/*
 *   计算AI当前得分
 * */
exp.getRobotCurScore = function (playerWin, playerCurScore, robotLastScore) {
    if (playerWin) {
        return _.random(robotLastScore, Math.floor(playerCurScore * dataUtils.getOptionValue('Endless_LoseAiScore', 1.1)));
    } else {
        return _.random(robotLastScore, Math.floor(playerCurScore * dataUtils.getOptionValue('Endless_WinAiScore01', 1.1)));
    }
};
