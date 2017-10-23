/**
 * Created by kilua on 2016/5/30 0030.
 */

var dao = module.exports = {};

dao.makeLossLevelPercent = function (dbClient, cb) {
    var sql = 'CALL makeLossLevelPercent(1)';

    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('makeLossLevelPercent failed!err = %s', err.stack);
            cb(err.message, false);
        } else {
            cb(null, true);
        }
    });
};

dao.getLossLevelPercent = function (dbClient, cb) {
    var sql = 'SELECT level, loss, lossTotal FROM LossLevelPercent';
    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('getLossLevelPercent err = %s', err.stack);
            cb(err.message, []);
        } else {
            res = res || [];
            res.forEach(function (rec) {
                if (rec.lossTotal === 0) {
                    rec.percent = 0;
                } else {
                    rec.percent = rec.loss / rec.lossTotal;
                }
                delete rec.loss;
                delete rec.lossTotal;
            });
            cb(null, res);
        }
    });
};

dao.getPlayerTotal = function (dbClient, cb) {
    var sql = 'SELECT COUNT(*) AS total FROM player';
    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('getPlayerTotal err = %s', err.stack);
            cb(err.message, 0);
        } else {
            cb(null, (!!res && !!res[0] && res[0].total) || 0);
        }
    });
};