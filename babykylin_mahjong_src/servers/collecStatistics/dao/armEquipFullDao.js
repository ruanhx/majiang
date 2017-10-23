/**
 * Created by tony on 2016/10/13.
 */
var dao = module.exports = {};

dao.getArmEquipFull = function (dbClient, cb) {
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
