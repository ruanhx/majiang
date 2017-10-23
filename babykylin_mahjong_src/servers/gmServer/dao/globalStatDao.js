/**
 * Created by kilua on 2015-10-14.
 */

var exp = module.exports = {};

exp.queryByDate = function(dbClient, start, end, cb){
    var sql = 'SELECT * FROM DailyReport WHERE sampleTick >= ? AND sampleTick <= ?',
        args = [start, end];
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('queryByDate err = %s, args = %j', err.stack, args);
            cb(err.message);
        }else{
            cb(null, res);
        }
    });
};