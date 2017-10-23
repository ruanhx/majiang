/**
 * Created by kilua on 2016/6/30 0030.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var serverStatusDao = require('../../../dao/serverStatusDao'),
    scoreRankingListDao = require('../../../dao/scoreRankingListDao'),
    weekScoreRankingListDao = require('../../../dao/weekScoreRankingListDao'),
    scoreRankingList = require('../../../domain/world/scoreRankingList'),
    barrierScoreRankingList = require('../../../domain/world/rankList/barrierScoreRankingList'),
    Code = require('../../../../shared/code');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

/*
 *   读取当前服务器运营标志
 * */
pro.getOpFlags = function (msg, session, next) {
    logger.debug('getOpFlags playerId = %s', session.get('playerId'));
    return next(null, {code: Code.OK, opFlags: this.app.get('opFlags')});
};

/*
 *   修改运营标志
 * */
pro.setOpFlags = function (msg, session, next) {
    logger.debug('setOpFlags playerId = %s, opFlags = %j', session.get('playerId'), msg.opFlags);
    if (!_.isArray(msg.opFlags)) {
        return next(null, {code: Code.FAIL});
    }
    if (!_.every(msg.opFlags, function (opFlag) {
            return _.isString(opFlag);
        })) {
        return next(null, {code: Code.FAIL});
    }
    var self = this;
    serverStatusDao.saveOpFlags(msg.opFlags, function (err, success) {
        if (success) {
            self.app.set('opFlags', msg.opFlags);
            self.app.rpc.area.serverStatusRemote.syncOpFlags.toServer('*', self.app.get('opFlags'), function(){});
        }
        return next(null, {code: success ? Code.OK : Code.FAIL, opFlags: self.app.get('opFlags')});
    });
};

/*
 *   手动保存总榜
 * */
pro.saveScoreRankingList = function (msg, session, next) {
    logger.debug('saveScoreRankingList playerId = %s', session.get('playerId'));
    scoreRankingListDao.save(scoreRankingList.getScoreRankingList().getData(), function (err, success) {
        next(null, {code: success ? Code.OK : Code.FAIL});
    });
};

/*
 *   手动保存周榜
 * */
pro.saveWeekScoreRankingList = function (msg, session, next) {
    logger.debug('saveWeekScoreRankingList playerId = %s', session.get('playerId'));
    weekScoreRankingListDao.save(scoreRankingList.getWeekScoreRankingList().getData(), function (err, success) {
        next(null, {code: success ? Code.OK : Code.FAIL});
    });
};

pro.sendBarrierScoreAward = function (msg, session, next) {
    barrierScoreRankingList.getModle().dispatchAwards();
    next(null, {code:Code.OK});
};