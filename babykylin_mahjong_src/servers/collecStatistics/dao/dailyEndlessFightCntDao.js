/**
 * Created by tony on 2016/10/12.
 */

var dao = module.exports = {};

dao.getDailyEndlessFightCnt = function (dbClient, cb) {
    var sql = 'SELECT * FROM DailyEndlessSTTE';

    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('DailyEndlessSTTE failed!err = %s', err.stack);
            cb(err.message, []);
        } else {
            cb(null, res || []);
        }
    });
};
