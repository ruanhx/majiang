/**
 * Created by kilua on 2016/5/30 0030.
 */

var dao = module.exports = {};

dao.getHeroStatistics = function (dbClient, cb) {
    var sql = 'CALL getHeroStatistics()';

    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('getHeroStatistics failed!err = %s', err.stack);
            cb(err.message);
        } else {
            cb(null, (!!res && !!res[0] && res[0][0]) || {});
        }
    });
};
