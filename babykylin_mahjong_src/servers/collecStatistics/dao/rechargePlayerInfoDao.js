/**
 * Created by tony on 2016/11/4.
 */
var dao = module.exports = {};


/*
 * 每日精炼总次数
 * */
dao.getRechargeAllInfo = function (dbClient, cb) {
    var sql = 'SELECT * FROM logRechargePlayerInfo';

    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('getDailyRefineCnt failed!err = %s', err.stack);
            cb(err.message, []);
        } else {
            cb(null, res || []);
        }
    });
};
