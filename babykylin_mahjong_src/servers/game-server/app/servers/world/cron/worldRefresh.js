/**
 * Created by rhx on 2017/6/19.
 */
/**
 * Created by kilua on 2016/7/5 0005.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var playerMiniData = require('../../../domain/world/playerMiniData');
var divisionRankingList = require('../../../domain/world/rankList/divisionRankingList');

var Cron = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Cron(app);
};

var pro = Cron.prototype;

pro.miniDataRefresh = function () {
    playerMiniData.getInstance().init();
};


