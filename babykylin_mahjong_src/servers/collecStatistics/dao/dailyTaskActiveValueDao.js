/**
 * Created by tony on 2016/10/12.
 */

var dao = module.exports = {};

dao.getDailyTaskActiveValue = function (dbClient, cb) {
    var sql = 'SELECT * FROM DailyTaskActiveValueSTTE';

    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('DailyTaskActiveValueSTTE failed!err = %s', err.stack);
            cb(err.message, []);
        } else {
            cb(null, res || []);
        }
    });
};
