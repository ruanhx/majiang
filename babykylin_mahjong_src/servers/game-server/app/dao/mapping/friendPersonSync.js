/**
 * Created by employee11 on 2015/12/11.
 */
var utils = require('../../util/utils');
var logger = require('pomelo-logger').getLogger(__filename);

var Sync = module.exports = {};

/*
 *   保存已
 * */
Sync.update = function (client, friendPerson, cb) {
    var sql = 'INSERT INTO FriendPerson(playerId,friendRemoveCnt,recommend,clearFRCntTime,sendEnergy,agreeCnt) VALUES(?,?,?,?,?,?) ON DUPLICATE KEY ' +
            'UPDATE playerId = VALUES(playerId),friendRemoveCnt = VALUES(friendRemoveCnt), recommend = VALUES(recommend),clearFRCntTime=VALUES(clearFRCntTime),sendEnergy = VALUES(sendEnergy),agreeCnt = VALUES(agreeCnt) ',
        args = [friendPerson.playerId, friendPerson.friendRemoveCnt,JSON.stringify(friendPerson.recommend||[]),friendPerson.clearFRCntTime,JSON.stringify(friendPerson.sendEnergy||[]),friendPerson.agreeCnt];
    client.query(sql, args, function (err, res) {
        if (err) {
            logger.error('upSert err = %s, args = %j', err.stack, args);
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!!res && res.affectedRows > 0)
                utils.invokeCallback(cb, null, true);
            else {
                logger.debug('upSert failed!divisionPerson = %j', friendPerson);
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};