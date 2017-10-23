/**
 * Created by kilua on 2015-10-15.
 */

var exp = module.exports = {};

exp.getConsumeStatByType = function(dbClient, begin, end, cb){
    var sql = 'SELECT * FROM ConsumeByType WHERE createTime >= ? AND createTime <= ?',
        args = [begin, end];
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('getConsumeStatByType err = %s, args = %j', err.stack, args);
            cb(err.message, []);
        }else{
            cb(null, res);
        }
    });
};

exp.getConsumeStatByItemId = function(dbClient, begin, end, cb){
    var sql = 'SELECT * FROM ConsumeByItemId WHERE createTime >= ? AND createTime <= ?',
        args = [begin, end];
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('getConsumeStatByItemId err = %s, args = %j', err.stack, args);
            cb(err.message, []);
        }else{
            cb(null, res);
        }
    });
};