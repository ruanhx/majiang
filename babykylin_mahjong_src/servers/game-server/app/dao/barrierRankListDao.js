/**
 * Created by rhx on 2017/6/5.
 */
var logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo');

var utils = require('../util/utils'),
    dataApi = require('../util/dataApi');

var dao = module.exports = {};

dao.load = function (type,cb) {
    var sql = 'SELECT * FROM barrierRankList WHERE type = ?',
        args = [type];

    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('load failed! ' + err.stack);
            utils.invokeCallback(cb, err.message, []);
        } else {
            utils.invokeCallback(cb, null, res || []);
        }
    });
};

/*
 *   查询总榜上玩家的其他信息
 * */
dao.getPlayerRankingInfo = function (playerIds,type, cb) {
    var sql = 'SELECT P.id, P.playername,P.headPicId,H.posInfo FROM player P INNER JOIN heroBag H ON P.id = H.playerId AND' +
        ' P.curHeroPos = H.pos WHERE P.id IN (?)';
    playerIds = playerIds || [];
    if (playerIds.length <= 0) {
        return utils.invokeCallback(cb, null, []);
    }
    pomelo.app.get('dbclient').query(sql, [playerIds], function (err, res) {
        if (err) {
            logger.error('getPlayerRankingInfo err = %s, playerIds = %j', err.stack, playerIds);
            utils.invokeCallback(cb, err.message, []);
        } else {
            res = res || [];
            res.forEach(function (rec) {
                try {
                    var heroInfo = JSON.parse(rec.posInfo),
                        heroData = dataApi.HeroAttribute.findByIndex({
                            heroId: heroInfo.roleId,
                            quality: heroInfo.quality
                        });
                    rec.heroId = heroData.id;
                } catch (ex) {
                    logger.warn('getPlayerRankingInfo parser posInfo = %s failed!', rec.posInfo);
                    rec.heroId = 0;
                }
                //delete rec.posInfo;
            });
            utils.invokeCallback(cb, null, res);
        }
    });
};
