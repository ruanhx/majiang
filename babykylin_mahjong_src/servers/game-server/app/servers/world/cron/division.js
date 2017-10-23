/**
 * Created by kilua on 2016/7/5 0005.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var divisionMgr = require('../../../domain/world/divisionMgr').get();
var divisionRankingList = require('../../../domain/world/rankList/divisionRankingList');

var Cron = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Cron(app);
};

var pro = Cron.prototype;

pro.weekReset = function () {
    logger.debug('段位每周重置 time = %s', new Date().toTimeString());
    divisionMgr.weekReset();
};

pro.dispatchAwards = function(){
    logger.debug('段位每天发奖励 time = %s', new Date().toTimeString());
    divisionMgr.dispatchAwards();
}
