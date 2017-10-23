/**
 * Created by kilua on 2016/7/20 0020.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var utils = require('../../util/utils');

var exp = module.exports = {};

exp.save = function (client, occasionData, cb) {
    var sql = 'INSERT INTO EndlessOccasion(playerId, occasionId, dailyCnt,dailyBuyCnt,totalCnt) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE' +
            ' dailyCnt = VALUES(dailyCnt),dailyBuyCnt = VALUES(dailyBuyCnt),totalCnt = VALUES(totalCnt)',
        args = [occasionData.playerId, occasionData.occasionId, occasionData.dailyCnt,occasionData.dailyBuyCnt,occasionData.totalCnt];
    client.query(sql, args, function (err, res) {
        if (err) {
            logger.error('save err = %s, occasionData = %j', err.stack, occasionData);
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!!res && res.affectedRows > 0)
                utils.invokeCallback(cb, null, true);
            else {
                logger.debug('save failed!occasionData = %j', occasionData);
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};