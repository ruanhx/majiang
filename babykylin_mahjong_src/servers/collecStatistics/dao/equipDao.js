/**
 * Created by tony on 2016/10/13.
 */
var dao = module.exports = {};

dao.getArmEquipFull = function (dbClient, cb) {
    var sql = 'SELECT * FROM ArmEquipFullSTTE';

    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('ArmEquipFullSTTE failed!err = %s', err.stack);
            cb(err.message, []);
        } else {
            cb(null, res || []);
        }
    });
};

/*
* 每日精炼总次数
* */
dao.getDailyRefineCnt = function (dbClient, cb) {
    var sql = 'SELECT * FROM DailyRefineCntSTTE';

    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('getDailyRefineCnt failed!err = %s', err.stack);
            cb(err.message, []);
        } else {
            cb(null, res || []);
        }
    });
};

/*
 * 装备详细养成统计
 * 统计每个玩家每天各个装备位的精炼情况，24点的时候统计
 * */
dao.getDailyRefineLvInfo = function (dbClient, cb) {
    var sql = 'SELECT * FROM DailyEquipRefineLvSTTE';

    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('getDailyRefineLvInfo failed!err = %s', err.stack);
            cb(err.message, []);
        } else {
            cb(null, res || []);
        }
    });
};

/*
 * 装备详细养成统计
 * 统计每个玩家每天各个装备位的觉醒情况：
 * */
dao.getDailyAwakeLvInfo = function (dbClient, cb) {
    var sql = 'SELECT * FROM DailyEquipAwakeLvSTTE';

    dbClient.query(sql, [], function (err, res) {
        if (err) {
            console.error('getDailyAwakeLvInfo failed!err = %s', err.stack);
            cb(err.message, []);
        } else {
            cb(null, res || []);
        }
    });
};
