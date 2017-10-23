/**
 * Created by kilua on 2016/7/5 0005.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var scoreRankingList = require('../../../domain/world/scoreRankingList');
var catchRankingList = require('../../../domain/world/rankList/catchRankingList'),
    divisionRankingList = require('../../../domain/world/rankList/divisionRankingList'),
    Consts = require('../../../consts/consts');
    barrierScoreRankingList = require('../../../domain/world/rankList/barrierScoreRankingList');

var Cron = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Cron(app);
};

var pro = Cron.prototype;
// 无尽奖励
pro.dispatch = function () {
    logger.debug('dispatch time = %s', new Date().toTimeString());
    // 发放奖励
    // 策划需求屏蔽周榜奖励
    // scoreRankingList.getWeekScoreRankingList().dispatchAwards();
    // scoreRankingList.getScoreRankingList().dispatchAwards(Consts.RANKING_TYPE.TOTAL);
    scoreRankingList.getWeekScoreRankingList().clearData();
};
// 抓宝奖励
pro.dispatchDaily = function(){
    catchRankingList.getCatchRankingList().dispatchAwards();
    catchRankingList.getCatchRankingList().clearData();
};
// 段位排行奖励
pro.resetDivisionRankList = function(){
    divisionRankingList.getModle().dispatchAwards();
    divisionRankingList.getModle().clearData();
};

// 关卡排行积分奖励
pro.barrierScoreDispatchDaily = function(){
    barrierScoreRankingList.getModle().dispatchAwards();
};