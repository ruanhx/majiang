/**
 * Created by kilua on 2016/5/30 0030.
 */

var dao = module.exports = {};

dao.getStarAwardDrawCntByChapterIdAndCondId = function (dbClient, chapterId, condId, cb) {
    var sql = 'CALL getStarAwardDrawCntByChapterIdAndCondId(?,?)',
        args = [chapterId, condId];

    dbClient.query(sql, args, function (err, res) {
        if (err) {
            console.error('getStarAwardDrawCntByChapterIdAndCondId failed!err = %s, args = %j', err.stack, args);
            cb(err.message);
        } else {
            cb(null, (!!res && !!res[0] && !!res[0][0] && res[0][0].total) || 0);
        }
    });
};
