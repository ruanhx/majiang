/**
 * Created by kilua on 2016/6/17 0017.
 */

var dao = module.exports = {};

dao.getOnlineTimePercent = function (dbClient, cb) {
    var sql = 'SELECT * FROM DailyOnlineTimePercent';

    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('getOnlineTimePercent failed!err = %s', err.stack);
            cb(err.message, []);
        } else {
            cb(null, res || []);
        }
    });
};
