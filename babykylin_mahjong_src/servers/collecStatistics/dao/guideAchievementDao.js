/**
 * Created by kilua on 2016/6/4 0004.
 */

var dao = module.exports = {};

dao.getGuideAchievement = function (dbClient, cb) {
    var sql = 'SELECT * FROM GuideAchievementPercent';

    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('getGuideAchievement failed!err = %s', err.stack);
            cb(err.message, []);
        } else {
            cb(null, res || []);
        }
    });
};
