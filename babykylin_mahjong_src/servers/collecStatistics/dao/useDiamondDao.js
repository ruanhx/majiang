/**
 * Created by tony on 2016/10/12.
 */

var dao = module.exports = {};

/*
 * 每日钻石使用
 * */
dao.getDailyUseDiamond = function (dbClient, cb) {
    var sql = 'SELECT * FROM DailyUseDiamondSTTE';

    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('getDailyUseDiamond failed!err = %s', err.stack);
            cb(err.message, []);
        } else {
            cb(null, res || []);
        }
    });
};