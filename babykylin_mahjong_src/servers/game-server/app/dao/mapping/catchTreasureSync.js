/**
 * Created by employee11 on 2015/12/11.
 */
var utils = require('../../util/utils');
var logger = require('pomelo-logger').getLogger(__filename);

var Sync = module.exports = {};

/*
 *   保存已
 * */
Sync.save = function (client, VO, cb) {
    var sql = 'INSERT INTO CatchTreasure(playerId,inGame,buyCount,isFog) VALUES(?,?,?,?) ON DUPLICATE KEY ' +
            'UPDATE playerId = VALUES(playerId),inGame = VALUES(inGame), buyCount = VALUES(buyCount) ,isFog=VALUES(isFog)',
        args = [VO.playerId, VO.inGame,VO.buyCount, VO.isFog];
    client.query(sql, args, function (err, res) {
        if (err) {
            logger.error('upSert err = %s, args = %j', err.stack, args);
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!!res && res.affectedRows > 0)
                utils.invokeCallback(cb, null, true);
            else {
                logger.debug('upSert failed!catchTreasure = %j', VO);
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};