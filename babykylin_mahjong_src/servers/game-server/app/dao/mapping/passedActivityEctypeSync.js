/**
 * Created by employee11 on 2015/12/11.
 */
var utils = require('../../util/utils');
var logger = require('pomelo-logger').getLogger(__filename);

var passedActivityEctypeSync = module.exports = {};

/*
 *   保存已通关
 * */
passedActivityEctypeSync.updatePassedInfo = function (client, activityEctype, cb) {
    var sql = 'INSERT INTO PassedActivityEctype(playerid,activityid,star,cooltime) VALUES(?,?,?,?) ON DUPLICATE KEY ' +
            'UPDATE activityid = VALUES(activityid),star = VALUES(star), cooltime = VALUES(cooltime) ',
        args = [activityEctype.playerid, activityEctype.activityid,activityEctype.star, activityEctype.cooltime];
    client.query(sql, args, function (err, res) {
        if (err) {
            logger.error('upSert err = %s, args = %j', err.stack, args);
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!!res && res.affectedRows > 0)
                utils.invokeCallback(cb, null, true);
            else {
                logger.debug('upSert failed!activityEctype = %j', activityEctype);
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};