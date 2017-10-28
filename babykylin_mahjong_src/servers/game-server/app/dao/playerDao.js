/**
 * Created by lishaoshen on 2015/10/12.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo'),
    async = require('async');

var Player = require('../domain/entity/player'),
    utils = require('../util/utils'),
    dataApi = require('../util/dataApi'),
    dataUtils = require('../util/dataUtils'),
    Consts = require('../consts/consts');

var playerDao = module.exports;

/**
 * Get player by MAC
 * @param {Number} uid User Id.
 * @param {function} cb Callback function.
 */
playerDao.getPlayersByUid = function (uid, cb) {
    var sql = 'select * from player where MAC = ?';
    var args = [uid];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            utils.invokeCallback(cb, err.message, null);
            return;
        }
        if (!res || res.length <= 0) {
            logger.info('getPlayersByUid no player found!uid = %s', uid);
            return utils.invokeCallback(cb, null, null);
        } else {
            logger.info('getPlayersByUid= %j', res[0]);
            utils.invokeCallback(cb, null, new Player(res[0]));
        }
    });
};

playerDao.getPlayerMiniDao = function (cb) {
    var sql = 'SELECT P.id, P.playername,P.headPicId,H.posInfo,P.highPower,P.VIPLevel FROM player P LEFT JOIN heroBag H ON P.id = H.playerId AND' +
        ' P.curHeroPos = H.pos';
    pomelo.app.get('dbclient').query(sql, [], function (err, res) {
        if (err) {
            logger.error('getPlayerMiniDao err = %s', err.stack);
            utils.invokeCallback(cb, err.message, []);
        } else {
            res = res || [];
            res.forEach(function (rec) {
                try {
                    var heroInfo = JSON.parse(rec.posInfo),
                        heroData = dataApi.HeroAttribute.findByIndex({
                            heroId: heroInfo.roleId,
                            quality: heroInfo.quality
                        });
                    rec.heroId = heroData.id;
                } catch (ex) {
                    logger.warn('getPlayerMiniDao parser posInfo = %s failed!', rec.posInfo);
                    rec.heroId = 0;
                }
                //delete rec.posInfo;
            });
            utils.invokeCallback(cb, null, res);
        }
    });
};

/**
 * Get player by playerId
 * @param {Number} uid User Id.
 * @param {function} cb Callback function.
 */
playerDao.getPlayersById = function (playerId, cb) {
    var sql = 'select * from player where id = ?';
    var args = [playerId];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            utils.invokeCallback(cb, null, err.message, null);
            return;
        }
        if (!res || res.length <= 0) {
            utils.invokeCallback(cb, null, []);
        } else {
            utils.invokeCallback(cb, null, res[0]);
        }
    });
};

/**
 * get by Name
 * @param {String} name Player name
 * @param {function} cb Callback function
 */
playerDao.getPlayerByName = function (name, cb) {
    var sql = 'select * from player where playername = ?';
    var args = [name];

    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else if (!res || res.length <= 0) {
            utils.invokeCallback(cb, null, null);
        } else {
            utils.invokeCallback(cb, null, new Player(res[0]));
        }
    });
};

/*
 *   创角角色
 * */
playerDao.createPlayer = function (uid, name, pwd, cb) {
    if(name == ""){//为空串，就把uid当作playername，是为了防止意外，紧接着就会重置playname
        name = uid;
    }
    var sql = 'insert into player (MAC,password,playername,gem,createTime,roomId)' +
            ' values(?,?,?,?,?,?)',
        now = Date.now(),
        args = [uid, pwd, name,99,now,0];

    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err !== null) {
            logger.error('create player failed! ' + err.message);
            logger.error(err);
            utils.invokeCallback(cb, err.message, null);
        } else {
            var playerId = res.insertId;
            // var sql1 = 'update player set playername=? where id = ?',
            //     args1 = ['player'+playerId, playerId];
            // pomelo.app.get('dbclient').query(sql1, args1, function (err, res) {//[139099]【客户端】需要能够控制游戏开始的时候是否自动随机名字
            //     if (err !== null) {
            //         logger.error('update player playername failed! ' + err.message);
            //         logger.error(err);
            //     }
            // });
            utils.invokeCallback(cb, null, playerId);
        }
    });
};

/*
 *   删除角色
 * */
playerDao.deletePlayer = function (playerId, cb) {
    var sql = 'delete from player where id = ?';
    var args = [playerId];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, err.message, null);
        } else {
            if (!!res && res.affectedRows > 0) {
                utils.invokeCallback(cb, null, true);
            } else {
                utils.invokeCallback(cb, null, false);
            }
        }
    });
};

playerDao.getPlayerAllInfo = function (playerId, cb) {
    async.parallel([
            function (callback) {
                playerDao.getPlayersById(playerId, callback);
            }

        ],
        function (err, results) {
            var allInfo = {};
            allInfo.player = results[0];
            // allInfo.heroBag = results[1];

            if (!!err) {
                utils.invokeCallback(cb, err.message);
            } else {
                utils.invokeCallback(cb, null, allInfo);
            }
        });
};

playerDao.onUserLogon = function (playerId, cb) {
    var sql = 'CALL onUserLogon(?,?)';
    pomelo.app.get('dbclient').query(sql, [playerId, Date.now()], function (err, res) {
        if (!!err) {
            logger.error('onUserLogon err = %s', err.stack);
            utils.invokeCallback(cb, err.message, false);
        } else {
            utils.invokeCallback(cb, null, true);
        }
    });
};

function clearOnline(cb) {
    var sql = 'UPDATE player SET isOnline = 0 ';
    pomelo.app.get('dbclient').query(sql, [], function (err) {
        if (!!err) {
            logger.error('clearOnline err = %s', err.stack);
            utils.invokeCallback(cb, err.message, false);
        } else {
            utils.invokeCallback(cb, null, true);
        }
    });
}

playerDao.clearCache = function (cb) {
    async.parallel(
        [
            function (callback) {
                clearOnline(callback);
            }
        ],
        function (err, results) {
            if (err) {
                utils.invokeCallback(cb, null, false);
            } else {
                var result = _.every(results);
                utils.invokeCallback(cb, null, result);
            }
        }
    );
};

playerDao.playerLogoff = function (playerId, cb) {
    var sql = 'UPDATE player SET isOnline = ?,logoffTime = ? where id = ?';
    var args = [0, Date.now(), playerId];
    pomelo.app.get('dbclient').query(sql, args, function (err) {
        if (!!err) {
            logger.error('playerLogoff err = %s', err.stack);
            utils.invokeCallback(cb, err.message, false);
        } else {
            utils.invokeCallback(cb, null, true);
        }
    });
};


playerDao.playerExistByName = function ( name, cb ) {
    var sql = 'SELECT COUNT(*) AS count FROM player WHERE playername = ?',
        args = [name];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('playerExistByName err = %s, args = %s', err.stack, args);
            utils.invokeCallback(cb, err.message, true);
        } else {
            if (!!res && res.length === 1) {
                utils.invokeCallback(cb, null, (res[0].count > 0));
            } else {
                utils.invokeCallback(cb, null, true);
            }
        }
    });
};

/*
 *   创建角色名
 * */
// playerDao.createPlayerName = function ( playerId, name, cb) {
//     var sql = 'UPDATE player SET playername = ? WHERE id = ?',
//         args = [name, playerId];
//     pomelo.app.get('dbclient').query(sql, args, function (err, res) {
//         if (err) {
//             // 可能重名
//             logger.debug('createPlayerName err = %s,args = %j', err.stack, args);
//             utils.invokeCallback(cb, err.message, false);
//         } else {
//             if (!!res && res.affectedRows === 1) {
//                 utils.invokeCallback(cb, null, true);
//             } else {
//                 logger.debug('createPlayerName failed!args = %j', args);
//                 utils.invokeCallback(cb, null, false);
//             }
//         }
//     });
// };




