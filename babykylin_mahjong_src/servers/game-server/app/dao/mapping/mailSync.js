/**
 * Created by employee11 on 2015/12/11.
 */
var utils = require('../../util/utils');
var logger = require('pomelo-logger').getLogger(__filename);

var Sync = module.exports = {};

/*
 *   保存
 * */
Sync.save = function (client, mailVO, cb) {
    var sql = 'update playerMail SET status=?,delTime=? WHERE id=?',
        args = [mailVO.status,mailVO.delTime,mailVO.id];

    client.query(sql, args, function (err, res) {
        if (err) {
            logger.error('save err = %s, args = %j', err.stack, args);
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!!res && res.affectedRows > 0) {
                utils.invokeCallback(cb, null, true);
            }else {
                logger.debug('save failed!mailVO = %j', mailVO);
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

Sync.remove = function(client, mailIdList, cb){
    var sql = 'delete from playerMail where id in (?)',
        args = [mailIdList.id];

    client.query(sql, args, function (err, res) {
        if (err) {
            logger.error('delete err = %s, args = %j', err.stack, args);
            utils.invokeCallback(cb, err.message, false);
        } else {
            if (!!res && res.affectedRows > 0) {
                utils.invokeCallback(cb, null, true);
            }else {
                logger.debug('delete failed!mailIdList = %j', mailIdList.id);
                utils.invokeCallback(cb, null, false);
            }
        }
    });
}