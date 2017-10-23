/**
 * Created by employee11 on 2016/3/2.
 */

var utils = require('../../util/utils');
var logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo');

var barrierRankListSync = module.exports = {};

/*
 * 必须在下发奖励成功之后才会去清除
 * **/
var clear = function (cb) {
    // logger.debug("\n\n\n\n\n rankListDao   - clear \n\n\n\n\n");

    // scoreRankingList.clernWeekRankList();
    var sql = 'DELETE FROM barrierRankList WHERE 1';
    pomelo.app.query(sql, [], function (err, res) {
        if (err) {
            logger.error('clear err = %s', err.stack);
            utils.invokeCallback(cb, err.message, false);
        } else {
            utils.invokeCallback(cb, null, true);
        }
    });
};


var updateAndAdd = function(dbRank , cb)
{
     // logger.debug("\n\n\n\n\n barrierRankListSync   - updateAndAdd \n\n\n\n\n");
    var sql = 'INSERT INTO barrierRankList(type,playerId,rank,score,barrierId) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE' +
            ' type = VALUES(type), playerId = VALUES(playerId), rank = VALUES(rank), score = VALUES(score), barrierId = VALUES(barrierId)',
        args = [ dbRank.type,dbRank.playerId, dbRank.rank, dbRank.score,dbRank.barrierId];

    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err)
        {
            logger.error('insertRank err = %s', err.message);
            utils.invokeCallback(cb, err.message, false);
        } else
        {
            utils.invokeCallback(cb, null, true);
        }
    });
};

barrierRankListSync.save = function (dbClient, dbRank, cb) {
    if (dbRank.remove) {
        clear(cb);
    } else {
        updateAndAdd(dbRank, cb);
    }
};
