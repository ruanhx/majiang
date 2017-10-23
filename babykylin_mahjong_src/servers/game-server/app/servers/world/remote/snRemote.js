 /**
 * Created by kilua on 2015-06-11.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    snHistoryDao = require('../../../dao/snHistoryDao'),
    Code = require('../../../../shared/code'),
    snExchangeAwardDao = require('../../../dao/snExchangeAwardDao'),
    snExchange = require('../../../snExchange'),
    dataApi = require('../../../util/dataApi');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

pro.everUsed = function(sn, playerId, cb){
    var dbClient = this.app.get('dbclient');
    snHistoryDao.everUsed(dbClient, playerId, sn, function(err, everUsed){
        if(everUsed){
            return cb(null, true);
        }else{
            // 未使用过，记录
            snHistoryDao.record(dbClient, playerId, sn, function(err, success){
                if(success){
                    return cb(null, false);
                }else{
                    // 记录失败，当成已使用过，防止被刷
                    return cb(null, true);
                }
            });
        }
    });
};

pro.canUse = function(ifName, sn, playerId, cb){
    var dbClient = this.app.get('dbclient');
    snExchange.query(ifName, sn, function(err, code, type, awardId){
        if(err){
            logger.error('canUse err = %s', err);
            return cb(null, Code.FAIL);
        }
        if(code !== snExchange.CODE.OK){
            return cb(null, Code.AREA.SN_ERROR);
        }
        var userPlayerId = (type === snExchange.TYPE.WORLD) ? 0 : playerId;
        snHistoryDao.everUsed(dbClient, userPlayerId, sn, function(err, everUsed){
            if(everUsed){
                return cb(null, Code.AREA.SN_USED);
            }else{
                // 判断每个玩家每个奖励的领取次数
                snExchangeAwardDao.getByPlayerId(dbClient, playerId, awardId, function(err, rec){
                    if(err){
                        logger.debug('canUse query draw cnt error!playerId = %s, awardId = %s', playerId, awardId);
                        return cb(null, Code.AREA.SN_MAX_DRAW_CNT);
                    }else{
                        rec = rec || {};
                        rec.cnt = rec.cnt || 0;
                        var snAwardData = dataApi.SnAwards.findById(awardId);
                        if(!snAwardData){
                            logger.debug('canUse no such awardId %s, playerId = %s, sn = %s', awardId, playerId, sn);
                            return cb(null, Code.FAIL);
                        }
                        if(snAwardData.drawCount !== -1 && rec.cnt >= snAwardData.drawCount){
                            // 已达到领取上限
                            return cb(null, Code.AREA.SN_MAX_DRAW_CNT);
                        }
                        // 未使用过，记录
                        snHistoryDao.record(dbClient, userPlayerId, sn, function(err, success){
                            if(success){
                                // 记录领取次数
                                snExchangeAwardDao.save(dbClient, playerId, awardId, rec.cnt + 1, function(err, success){
                                    if(success) {
                                        return cb(null, Code.OK, awardId);
                                    }else{
                                        logger.debug('canUse snExchangeAwardDao.save failed!');
                                        return cb(null, Code.FAIL);
                                    }
                                });
                            }else{
                                // 记录失败，当成已使用过，防止被刷
                                logger.debug('canUse record sn history failed!');
                                return cb(null, Code.FAIL);
                            }
                        });
                    }
                });
            }
        });
    });
};