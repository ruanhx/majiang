/**
 * Created by employee11 on 2015/12/17.
 */
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../util/utils');

var playerSync = module.exports = {};
//'bronzeCoin','silverCoin','goldCoin'
playerSync.updatePlayer = function (client, player, cb) {
    var sql = 'UPDATE player SET gem =?,roomId=?' +
            ' where id=?',
        args = [
            player.gem, player.roomId, player.id
        ];
    console.debug("roomInsert sql:%j args:%j",sql,args);
    client.query(sql, args, function (err, res) {
        if (err) {
            logger.error('updatePlayer failed!err = %s, args = %j', err.stack, args);
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!res || res.affectedRows === 0) {
                logger.error('updatePlayer no player found!args = %j', args);
                utils.invokeCallback(cb, null, false);
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

playerSync.logoff = function (client, rec, cb) {
    var sql = 'CALL onUserLogoff(?)',
        args = [rec.id];
    client.query(sql, args, function (err) {
        if (!!err) {
            logger.error('logoff err = %s', err.stack);
            utils.invokeCallback(cb, err.message, false);
        } else {
            utils.invokeCallback(cb, null, true);
        }
    });
};