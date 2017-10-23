/**
 * Created by kilua on 2016/7/20 0020.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo');

var utils = require('../util/utils');

var dao = module.exports = {};

dao.getByPlayerId = function (playerId, cb) {
    var sql = 'SELECT * FROM EndlessOccasion WHERE playerId = ?',
        args = [playerId];

    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('getByPlayerId err = %s, args = %j', err.stack, args);
            utils.invokeCallback(cb, err.message,[]);
        } else {
            utils.invokeCallback(cb, null, res || []);
        }
    });
};

// dao.getByPlayerIdAndOccasionId = function (playerId, occasionId, cb) {
//     var sql = 'SELECT maxWin,maxLose FROM EndlessOccasion WHERE playerId = ? AND occasionId = ?',
//         args = [playerId, occasionId];
//     pomelo.app.get('dbclient').query(sql, args, function (err, res) {
//         if (err) {
//             logger.error('getByPlayerIdAndOccasionId err = %s, args = %j', err.stack, args);
//             utils.invokeCallback(cb, err.message);
//         } else {
//             utils.invokeCallback(cb, null, (!!res && res[0]));
//         }
//     });
// };

dao.save = function (valStr, cb) {
    var sql ="REPLACE INTO EndlessOccasion(playerId, occasionId, dailyCnt,dailyBuyCnt,maxWin,maxLose,totalCnt) VALUES ";
    sql += valStr.substring(0,valStr.length -1);
    pomelo.app.get('dbclient').query(sql, [], function (err, res) {
        if (err) {
            logger.error('exe err = %s, args = %j', err.stack, args);
            utils.invokeCallback(cb, err.message, 0);
        } else {
            utils.invokeCallback(cb, null, res.affectedRows||0);
        }
    });
}