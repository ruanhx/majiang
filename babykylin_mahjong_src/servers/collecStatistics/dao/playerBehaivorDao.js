/**
 * Created by tony on 2016/11/28.
 */
var dao = module.exports = {};
/*
 * 玩家数据
 * */
dao.getPlayerBehaivor = function (dbClient, cb) {
    var sql = 'SELECT * FROM STTEPlayerBehaivor';

    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('getPlayerBehaivor failed!err = %s', err.stack);
            cb(err.message, []);
        } else {
            cb(null, res || []);
        }
    });
};