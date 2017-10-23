/**
 * Created by employee11 on 2015/12/11.
 */
var utils = require('../../util/utils');
var logger = require('pomelo-logger').getLogger(__filename);

var endlessPVPBoxSync = module.exports = {};

/*
 *   保存无尽宝箱数据
 * */
endlessPVPBoxSync.save = function (client,rec, cb) {
    var sql = 'INSERT INTO EndlessPVPBox(endlessId,playerId,occasionId,score,drew,reopenCnt,boxDouble,systemId) VALUES(?,?,?,?,?,?,?,?)' +
            ' ON DUPLICATE KEY UPDATE endlessId=VALUES(endlessId),occasionId=VALUES(occasionId),score=VALUES(score),' +
            'drew=VALUES(drew),reopenCnt=VALUES(reopenCnt),boxDouble=VALUES(boxDouble),systemId=VALUES(systemId)',
        args = [rec.endlessId, rec.playerId, rec.occasionId, rec.score, rec.drew, rec.reopenCnt, rec.boxDouble, rec.systemId];
    client.query(sql, args, function (err, res) {
        if (err) {
            logger.error('save err = %s, args = %j', err.stack, args);
            utils.invokeCallback(cb, err.message, false);
        } else {
            utils.invokeCallback(cb, null, !!res && res.affectedRows > 0);
        }
    });
};