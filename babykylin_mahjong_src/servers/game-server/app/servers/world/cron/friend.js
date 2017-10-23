/**
 * Created by kilua on 2016/7/5 0005.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var friendsMgr = require('../../../domain/world/friendsMgr').get();

var Cron = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Cron(app);
};

var pro = Cron.prototype;

pro.dailyReset = function () {
    //logger.debug('好友每日清除 time = %s', new Date().toTimeString());
    //friendsMgr.dailyReset();
};
