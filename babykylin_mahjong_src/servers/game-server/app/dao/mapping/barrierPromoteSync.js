/**
 * Created by employee11 on 2015/12/11.
 */
var utils = require('../../util/utils');
var logger = require('pomelo-logger').getLogger(__filename);

var Sync = module.exports = {};

/*
 *   保存
 * */
Sync.save = function (client, vo, cb) {
    var sql = 'INSERT INTO barrierPromote(playerId,chapterId,barrierPromoteDropIds,barrierPromoteEndTick,drew) VALUES(?,?,?,?,?) ON DUPLICATE KEY ' +
            'UPDATE playerId=VALUES(playerId),chapterId = VALUES(chapterId),barrierPromoteDropIds = VALUES(barrierPromoteDropIds),barrierPromoteEndTick = VALUES(barrierPromoteEndTick), drew = VALUES(drew)',
        args = [vo.playerId,vo.chapterId,JSON.stringify(vo.barrierPromoteDropIds),vo.barrierPromoteEndTick,vo.drew];
    client.query(sql, args, function (err, res) {
        if (err) {
            logger.error('upSert err = %s, args = %j', err.stack, args);
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!!res && res.affectedRows > 0)
                utils.invokeCallback(cb, null, true);
            else {
                logger.debug('upSert failed!trainVO = %j', trainVO);
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};