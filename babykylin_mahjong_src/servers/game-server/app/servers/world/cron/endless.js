/**
 * Created by kilua on 2016/7/5 0005.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var endlessReport = require('../../../domain/world/endlessReport').get(),
    endlessMgr = require('../../../domain/world/endlessMgr');

var Cron = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Cron(app);
};

var pro = Cron.prototype;

pro.removeOut = function () {
    logger.debug('无尽战役记录缓存清理 removeOut time = %s', new Date().toTimeString());
    endlessReport.removeOut();
};

pro.endlessMatchCntReset = function () {
    endlessMgr.getInstance().matchCntReset();
}
