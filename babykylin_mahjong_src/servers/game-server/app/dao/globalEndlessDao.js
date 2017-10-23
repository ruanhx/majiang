/**
 * Created by rhx on 2017/8/29.
 */
var logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo');

var utils = require('../util/utils');

var dao = module.exports = {};

dao.findAll  = function (cb) {
    var sql = 'SELECT * FROM globalEndless',
        args = [];

    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('load failed! ' + err.stack);
            utils.invokeCallback(cb, err.message, []);
        } else {
            utils.invokeCallback(cb, null, res || []);
        }
    });
};