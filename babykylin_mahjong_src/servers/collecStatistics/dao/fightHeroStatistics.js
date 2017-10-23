/**
 * Created by kilua on 2016/6/17 0017.
 */

var dao = module.exports = {};

dao.getFightHeroPercent = function (dbClient, cb) {
    var sql = 'SELECT * FROM FightHeroStatistics';

    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('getFightHeroPercent failed!err = %s', err.stack);
            cb(err.message, []);
        } else {
            cb(null, res || []);
        }
    });
};

