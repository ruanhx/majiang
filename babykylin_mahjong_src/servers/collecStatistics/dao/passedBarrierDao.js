/**
 * Created by kilua on 2016/5/30 0030.
 */

var dao = module.exports = {};

dao.getStarAwardAvailableTotal = function (dbClient, barrierIds, reqStars, cb) {
    var sql = 'SELECT COUNT(A.playerId) AS availableTotal FROM (SELECT P.playerId, SUM(P.star) AS totalStar FROM' +
            ' `passedBarrier` P WHERE P.barrierId in (?) GROUP BY P.playerId) A WHERE A.totalStar >= ?',
        args = [barrierIds, reqStars];

    dbClient.query(sql, args, function (err, res) {
        if (err) {
            console.error('getStarAwardAvailableTotal failed!err = %s, args = %j', err.stack, args);
            cb(err.message);
        } else {
            cb(null, (!!res && !!res[0] && res[0].availableTotal) || 0);
        }
    });
};

dao.makeBarrierRemain = function (dbClient, cb) {
    var sql = 'CALL makeBarrierRemain()';
    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('makeBarrierRemain err = %s', err.stack);
            cb(err.message, false);
        } else {
            cb(null, true);
        }
    });
};

dao.getBarrierRemain = function (dbClient, cb) {
    var sql = 'SELECT barrier,pass,total,singleLoss,totalLoss,avgCostTick,avgPower,avgReviveCnt,avgSuperSkillCnt,' +
        'avgJumpCnt,avgJumpSkillCnt,avgLoseCnt,avgLosePower FROM BarrierRemain';
    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('getBarrierRemain err = %s', err.stack);
            cb(err.message, []);
        } else {
            res = res || [];
            var rows = [];
            res.forEach(function (rec) {
                var row = {barrier: rec.barrier};
                if (rec.total === 0) {
                    row.pass = 0;
                    row.singleLoss = 0;
                    row.totalLoss = 0;
                } else {
                    row.pass = rec.pass / rec.total * 100;
                    row.singleLoss = rec.singleLoss / rec.total * 100;
                    row.totalLoss = rec.totalLoss / rec.total * 100;
                }
                row.avgCostTick = rec.avgCostTick;
                row.avgPower = rec.avgPower;
                row.avgReviveCnt = rec.avgReviveCnt;
                row.avgSuperSkillCnt = rec.avgSuperSkillCnt;
                row.avgJumpCnt = rec.avgJumpCnt;
                row.avgJumpSkillCnt = rec.avgJumpSkillCnt;
                row.avgLoseCnt = rec.avgLoseCnt;
                row.avgLosePower = rec.avgLosePower;
                rows.push(row);
            });
            cb(null, rows);
        }
    });
};


dao.getNewBarrierId = function (dbClient, cb) {
    var sql = 'SELECT * FROM newBarrierIdSTTE';

    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('newBarrierIdSTTE failed!err = %s', err.stack);
            cb(err.message, []);
        } else {
            cb(null, res || []);
        }
    });
};

dao.getDailyChapterStarCnt = function (dbClient, cb) {
    var sql = 'SELECT * FROM barrierStarSTTE';
    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('getDailyChapterStarCnt failed!err = %s', err.stack);
            cb(err.message, []);
        } else {
            cb(null, res || []);
        }
    });
};