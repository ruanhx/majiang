/**
 * Created by kilua on 2015-10-19.
 */

var async = require('async'),
    _ = require('underscore');

var exp = module.exports = {};

function getStatByPlayerId(dbClient, playerId, cb){
    var all = (!playerId), sql, args;
    if(all){
        sql = 'SELECT playerId, PVPTotal, PVPCycleTotal, PVETotal, PVECycleTotal FROM ExceptionStatistics';
        args = [];
    }else {
        sql = 'SELECT playerId, PVPTotal, PVPCycleTotal, PVETotal, PVECycleTotal FROM ExceptionStatistics WHERE playerId = ?';
        args = [playerId];
    }
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('getStatByPlayerId err = %s, args = %j', err.stack, args);
            return cb(err.message, []);
        }
        return cb(null, res || []);
    });
}

function getTraceByPlayerIds(dbClient, playerIds, cb){
    var sql = 'SELECT * FROM ExceptionPlayer WHERE playerId IN (?)',
        args = [playerIds];
    if(playerIds.length <= 0){
        return cb(null, []);
    }
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('getTraceByPlayerIds err = %s, args = %j', err.stack, args);
            cb(err.message, []);
        }else{
            cb(null, res || []);
        }
    });
}

exp.getStat = function(dbClient, username, playerId, playerName, cb){
    function getBaseInfo(dbClient, playerIds, cb){
        var sql = 'SELECT U.MAC AS username, P.name AS playerName, P.id AS playerId FROM User AS U INNER JOIN Player AS P' +
                ' ON U.id = P.userId WHERE P.id IN (?)',
            args = [playerIds];
        dbClient.query(sql, args, function(err, res){
            if(err){
                console.error('getBaseInfo err = %s, args = %j', err.stack, args);
                return cb(err.message, []);
            }
            return cb(null, res || []);
        });
    }

    getStatByPlayerId(dbClient, playerId, function(err, stats){
        if(err){
            return cb(err, []);
        }
        if(stats.length <= 0){
            return cb(null, []);
        }
        var playerIds = _.pluck(stats, 'playerId');
        async.parallel(
            [
                function(callback){
                    getBaseInfo(dbClient, playerIds, callback);
                },
                function(callback){
                    getTraceByPlayerIds(dbClient, playerIds, callback);
                }
            ],
            function(err, results){
                if(err){
                    return cb(err);
                }
                var players = results[0],
                    traceRecs = results[1],
                    playerById = _.indexBy(players, 'playerId') || {},
                    traceRecByPlayerId = _.indexBy(traceRecs, 'playerId') || {};
                stats.forEach(function(stat){
                    var player = playerById[stat.playerId],
                        traceRec = traceRecByPlayerId[stat.playerId];
                    if(player){
                        stat.username = player.username;
                        stat.playerName = player.playerName;
                    }
                    stat.traced = !!traceRec ? true : false;
                });
                cb(null, stats);
            }
        );
    });
};

function getAllTraceRecord(dbClient, cb){
    var sql = 'SELECT * FROM ExceptionPlayer';
    dbClient.query(sql, [], function(err, res){
        if(err){
            console.error('getAllTraceRecord err = %s', err.stack);
            cb(err.message, []);
        }else{
            cb(null, res || []);
        }
    });
}

exp.getTraceRecord = function(dbClient, username, playerId, playerName, cb){
    function getBaseInfo(dbClient, playerIds, cb){
        if(playerIds.length <= 0){
            return cb(null, []);
        }
        var sql = 'SELECT U.MAC AS username, P.id AS playerId, P.name AS playerName, P.level FROM User AS U INNER JOIN Player AS P ON U.id = P.userId' +
            ' WHERE P.id IN (?)',
            args = [playerIds];
        dbClient.query(sql, args, function(err, res){
            if(err){
                console.error('getBaseInfo err = %s, args = %j', err.stack, args);
                return cb(err.message, []);
            }
            return cb(null, res || []);
        });
    }

    function onTraceRecCb(err, traceRecs){
        if(err){
            return cb(err);
        }
        var playerIds = _.pluck(traceRecs, 'playerId');
        getBaseInfo(dbClient, playerIds, function(err, players){
            if(err){
                return cb(err);
            }
            var playersById = _.indexBy(players, 'playerId');
            traceRecs.forEach(function(traceRec){
                var player = playersById[traceRec.playerId];
                if(player){
                    traceRec.username = player.username;
                    traceRec.playerName = player.playerName;
                    traceRec.level = player.level;
                }
            });
            cb(null, traceRecs);
        });
    }
    var all = (!username && !playerId && !playerName);
    if(all){
        getAllTraceRecord(dbClient, onTraceRecCb);
    }else{
        getTraceByPlayerIds(dbClient, [playerId], onTraceRecCb);
    }
};