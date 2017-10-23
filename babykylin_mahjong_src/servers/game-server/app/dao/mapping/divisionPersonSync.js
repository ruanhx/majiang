/**
 * Created by employee11 on 2015/12/11.
 */
var utils = require('../../util/utils');
var logger = require('pomelo-logger').getLogger(__filename);

var divisionPersonSync = module.exports = {};

/*
 *   保存已
 * */
divisionPersonSync.update = function (client, divisionPerson, cb) {
    var sql = 'INSERT INTO DivisionPerson(playerId,highDivision,opponents,refreshCnt,clearTime) VALUES(?,?,?,?,?) ON DUPLICATE KEY ' +
            'UPDATE playerId = VALUES(playerId),highDivision = VALUES(highDivision), opponents = VALUES(opponents) ,refreshCnt=VALUES(refreshCnt),clearTime=VALUES(clearTime)',
        args = [divisionPerson.playerId, divisionPerson.highDivision,JSON.stringify(divisionPerson.opponents), divisionPerson.refreshCnt,divisionPerson.clearTime];
    client.query(sql, args, function (err, res) {
        if (err) {
            logger.error('upSert err = %s, args = %j', err.stack, args);
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!!res && res.affectedRows > 0)
                utils.invokeCallback(cb, null, true);
            else {
                logger.debug('upSert failed!divisionPerson = %j', divisionPerson);
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};