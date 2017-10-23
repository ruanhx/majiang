/**
 * Created by employee11 on 2016/01/13.
 */
var utils = require('../../util/utils');
var logger = require('pomelo-logger').getLogger(__filename);

var daoSync = module.exports = {};

daoSync.save = function (client, data, cb) {
    logger.debug("@@@@ divisionSync 保存数据！");
    var sql = 'INSERT INTO division(divisionId, playerId, name, heroId, hPower, hScore,divScore,isRobot) VALUES(?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE' +
            ' divisionId = VALUES(divisionId),playerId = VALUES(playerId),name = VALUES(name),heroId = VALUES(heroId),hPower = VALUES(hPower),hScore = VALUES(hScore),divScore = VALUES(divScore),isRobot = VALUES(isRobot)',
        args = [data.divisionId, data.playerId, data.name, data.heroId, data.hPower, data.hScore, data.divScore,data.isRobot];
    client.query(sql, args, function (err, res) {
        if (err) {
            logger.error('save err = %s, slotData = %j', err.stack, data);
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!!res && res.affectedRows > 0)
                utils.invokeCallback(cb, null, true);
            else {
                logger.debug('save failed!slotData = %j', data);
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};



