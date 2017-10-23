/**
 * Created by employee11 on 2015/12/11.
 */
var utils = require('../../util/utils');
var logger = require('pomelo-logger').getLogger(__filename);

var Sync = module.exports = {};

/*
 *   保存
 * */
Sync.save = function (client, trainVO, cb) {
    var sql = 'INSERT INTO train(playerId,gainStep,trainValue,freeCnt,costCnt,clearFreeCntTime,lastSetValTime,nextFreeTime,clickRemainCnt,clickCoolEndTime,lastGainClickTime) VALUES(?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY ' +
            'UPDATE gainStep = VALUES(gainStep),trainValue = VALUES(trainValue), freeCnt = VALUES(freeCnt),costCnt=VALUES(costCnt),clearFreeCntTime=VALUES(clearFreeCntTime),lastSetValTime= VALUES(lastSetValTime),' +
            'nextFreeTime= VALUES(nextFreeTime), clickRemainCnt=VALUES(clickRemainCnt),clickCoolEndTime=VALUES(clickCoolEndTime),lastGainClickTime=VALUES(lastGainClickTime)',
        args = [trainVO.playerId, trainVO.gainStep||0,trainVO.trainValue||0, trainVO.freeCnt||0,trainVO.costCnt||0,trainVO.clearFreeCntTime||0,trainVO.lastSetValTime||0,trainVO.nextFreeTime||0,trainVO.clickRemainCnt||0,trainVO.clickCoolEndTime||0,trainVO.lastGainClickTime||0];
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