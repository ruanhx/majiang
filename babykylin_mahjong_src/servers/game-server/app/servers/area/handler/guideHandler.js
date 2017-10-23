/**
 * Created by kilua on 2016/5/17 0017.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    dataApi = require('../../../util/dataApi'),
    flow = require('../../../consts/flow'),
    guidePrizeManager = require('../../../domain/area/guidePrizeManager'),
    dropUtils = require('../../../domain/area/dropUtils'),
    guideAchievementDao = require('../../../dao/guideAchievementDao');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

/*
 *  引导完成，领取奖励
 * */
pro.finish = function (msg, session, next) {
    logger.debug('finish playerId = %s, guideId = %s', session.get('playerId'), msg.guideId);
    var guideData = dataApi.Guide.findById(msg.guideId),
        player = area.getPlayer(session.get('playerId')),
        guidePrizeMgr = guidePrizeManager.get(player);
    if (!guideData) {
        logger.debug('NO_SUCH_GUIDE！');
        return next(null, {code: Code.AREA.NO_SUCH_GUIDE});
    }
    if (guidePrizeMgr.exists(msg.guideId)) {
        logger.debug('GUIDE_PRIZE_DREW！');
        return next(null, {code: Code.AREA.GUIDE_PRIZE_DREW});
    }
    guidePrizeMgr.add(msg.guideId);
    guideAchievementDao.save(msg.guideId);
    if (!guideData.reward) {
        // 无奖励
        // 记录已领取奖励
        logger.debug('guideFinish no prizes.');
        return next(null, {code: Code.OK, guideId: msg.guideId});
    }
    var drops = dropUtils.getDropItems(guideData.reward);
    drops = player.applyDrops(drops,null,flow.ITEM_FLOW.GUIDE_FINISH_GAIN);
    next(null, {code: Code.OK, guideId: msg.guideId, drops: drops});
};