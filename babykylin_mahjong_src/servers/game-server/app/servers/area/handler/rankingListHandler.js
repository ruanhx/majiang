/**
 * Created by kilua on 2016/7/17 0017.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts'),
    flow = require('../../../consts/flow'),
    weekScoreRankingAwardDao = require('../../../dao/weekScoreRankingAwardDao'),
    scoreRankingAwardDao = require('../../../dao/scoreRankingAwardDao'),
    catchRankingAwardDao = require('../../../dao/catchRankingAwardDao'),
    dropUtils = require('../../../domain/area/dropUtils'),
    dataApi = require('../../../util/dataApi');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

function getAwards(type, rank) {
    var dropIdx = dataApi.EndlessRankReward.getDropIdByTypeAndRank(type, rank);
    if (dropIdx) {
        return dropUtils.getDropItems(dropIdx);
    }
    return [];
}
/*
 *   领取奖励前，预览自己的奖励
 * */
pro.previewMyAwards = function (msg, session, next) {
    logger.debug('previewMyAwards playerId = %s, type = %s', session.get('playerId'), msg.type);
    if (msg.type === Consts.RANKING_TYPE.WEEK) {
        return weekScoreRankingAwardDao.getByPlayerId(session.get('playerId'), function (err, res) {
            if (res.rank) {
                return next(null, {code: Code.OK, type: msg.type, awards: getAwards(msg.type, res.rank)});
            }
            return next(null, {code: Code.AREA.NO_RANKING_AWARDS, type: msg.type});
        });
    }
    if (msg.type === Consts.RANKING_TYPE.TOTAL) {
        return scoreRankingAwardDao.getByPlayerId(session.get('playerId'), function (err, res) {
            if (res.rank) {
                return next(null, {code: Code.OK, type: msg.type, awards: getAwards(msg.type, res.rank)});
            }
            return next(null, {code: Code.AREA.NO_RANKING_AWARDS, type: msg.type});
        });
    }
    if (msg.type === Consts.RANKING_TYPE.CATCH) {
        return catchRankingAwardDao.getByPlayerId(session.get('playerId'), function (err, res) {
            if (res.rank) {
                return next(null, {code: Code.OK, type: msg.type, awards: getAwards(msg.type, res.rank)});
            }
            return next(null, {code: Code.AREA.NO_RANKING_AWARDS, type: msg.type});
        });
    }
    return next(null, {code: Code.FAIL});
};

function applyRankingAwards(player, type, awardRank, next) {
    var awards = getAwards(type, awardRank);
    awards = player.applyDrops(awards,null,flow.ITEM_FLOW.RANKING_LIST_AWARD);
    return next(null, {code: Code.OK, type: type, awards: awards});
}
/*
 *   领取排行榜奖励
 * */
pro.drawAwards = function (msg, session, next) {
    logger.debug('drawAwards playerId = %s, type = %s', session.get('playerId'), msg.type);
    var player = area.getPlayer(session.get('playerId'));
    if (msg.type === Consts.RANKING_TYPE.WEEK) {
        return weekScoreRankingAwardDao.getByPlayerId(player.id, function (err, res) {
            if (!res.rank) {
                return next(null, {code: Code.AREA.NO_RANKING_AWARDS, type: msg.type});
            }
            if (res.drew) {
                return next(null, {code: Code.AREA.RANKING_AWARDS_DREW, type: msg.type});
            }
            // 内部设置条件drew=0，以放置连续发包，重复领取
            weekScoreRankingAwardDao.setDrew(player.id, function (err, success) {
                if (success) {
                    applyRankingAwards(player, msg.type, res.rank, next);
                } else {
                    return next(null, {code: Code.FAIL, type: msg.type});
                }
            });
        });
    }
    if (msg.type === Consts.RANKING_TYPE.TOTAL) {
        return scoreRankingAwardDao.getByPlayerId(player.id, function (err, res) {
            if (!res.rank) {
                return next(null, {code: Code.AREA.NO_RANKING_AWARDS, type: msg.type});
            }
            if (res.drew) {
                return next(null, {code: Code.AREA.RANKING_AWARDS_DREW, type: msg.type});
            }
            // 内部设置条件drew=0，以放置连续发包，重复领取
            scoreRankingAwardDao.setDrew(player.id, function (err, success) {
                if (success) {
                    applyRankingAwards(player, msg.type, res.rank, next);
                } else {
                    return next(null, {code: Code.FAIL, type: msg.type});
                }
            });
        });
    }
    if (msg.type === Consts.RANKING_TYPE.CATCH) {
        return catchRankingAwardDao.getByPlayerId(player.id, function (err, res) {
            if (!res.rank) {
                return next(null, {code: Code.AREA.NO_RANKING_AWARDS, type: msg.type});
            }
            if (res.drew) {
                return next(null, {code: Code.AREA.RANKING_AWARDS_DREW, type: msg.type});
            }
            // 内部设置条件drew=0，以放置连续发包，重复领取
            catchRankingAwardDao.setDrew(player.id, function (err, success) {
                if (success) {
                    applyRankingAwards(player, msg.type, res.rank, next);
                } else {
                    return next(null, {code: Code.FAIL, type: msg.type});
                }
            });
        });
    }
    return next(null, {code: Code.FAIL, type: msg.type});
};