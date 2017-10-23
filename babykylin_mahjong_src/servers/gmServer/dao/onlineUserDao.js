/**
 * Created by kilua on 2015-10-15.
 */

var exp = module.exports = {};

exp.getOnlineBetween = function(dbClient, begin, end, cb){
    var sql = 'SELECT * FROM OnlineUser WHERE sampleTime >= ? AND sampleTime <= ?',
        args = [begin, end];
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('getOnlineBetween err = %s, args = %j', err.stack, args);
            cb(err.message, []);
        }else{
            cb(null, res);
        }
    });
};

exp.getOnlineTimeStat = function(dbClient, begin, end, cb){
    var sql = 'SELECT onlineTimeStat, todayHighOnline, createTime FROM DailyReport WHERE createTime >= ? AND createTime <= ?',
        args = [begin, end];
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('getOnlineTimeStat err = %s, args = %j', err.stack, args);
            return cb(err.message);
        }else{
            if(!!res && res.length > 0){
                res.forEach(function(row){
                    row.onlineTimeStat = JSON.parse(row.onlineTimeStat);
                });
                return cb(null, res);
            }else{
                return cb();
            }
        }
    });
};