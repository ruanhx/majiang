/**
 * Created by lishaoshen on 2015/10/12.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo'),
    async = require('async');

var Player = require('../domain/entity/player'),
    utils = require('../util/utils'),
    dataApi = require('../util/dataApi'),
    bagDao = require('./bagDao'),
    heroBagDao = require('./heroBagDao'),
    petBagDao = require('./petBagDao'),
    passedBarrierDao = require('./passedBarrierDao'),
    unlockChapterDao = require('./unlockChapterDao'),
    hasBuyHeroDao = require('./hasBuyHeroDao'),
    dataUtils = require('../util/dataUtils'),
    Consts = require('../consts/consts'),
    guidePrizeDao = require('./guidePrizeDao'),
    clientSaveDao = require('./clientSaveDao'),
    playerShopDao = require('./playerShopDao'),
    playerActivityDao = require('./playerActivityDao'),
    equipBagDao = require('./equipBagDao'),
    equipConfDao = require('./equipConfDao'),
    endlessBuffDao = require('./endlessBuffDao'),
    endlessOccasionDao = require('./endlessOccasionDao'),
    wakeUpBagDao = require('./wakeUpBagDao'),
    equipWashDao = require('./equipWashDao'),
    equipAchievedDao = require('./equipAchievedDao'),
    orderListDao =  require('./orderListDao'),
    missionDao = require('./missionDao'),
    randBossDao = require('./randBossDao'),
    randomShopDao = require('./randomShopDao'),
    statisticsDao = require('./statisticsDao'),
    randBossRecordDao = require('./randBossRecordDao'),
    heroHistoryDao = require('./heroHistoryDao'),
    offlineFightRecordDao = require('./offlineFightRecordDao'),
    passedActivityEctypeDao = require('./passedActivityEctypeDao'),
    equipHistoryDao = require('./equipHistoryDao'),
    friendPersonDao = require('./friendPersonDao'),
    playerRefreshDao = require('./playerRefreshDao'),
    assistFightDao = require('./assistFightDao'),
    trainDao = require('./trainDao'),
    catchTreasureDao = require('./catchTreasureDao'),
    mailDao = require('./mailDao'),
    endlessPVPBoxDao = require('./endlessPVPBoxDao'),
    divisionPersonDao = require('./divisionPersonDao'),
    barrierPromoteDao = require('./barrierPromoteDao');

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
            // ,
            // function (callback) {
            //     heroBagDao.getHeroBagByPlayerId(playerId, callback);
            // },
            // function (callback) {
            //     petBagDao.getPetBagByPlayerId(playerId, callback);
            // }, function (callback) {
            //     passedBarrierDao.getByPlayerId(playerId, callback);
            // }, function (callback) {
            //     bagDao.getItemByPlayerId(playerId, callback);
            // }, function (callback) {
            //     unlockChapterDao.getByPlayerId(playerId, callback);
            // }, function (callback) {
            //     hasBuyHeroDao.getByPlayerId(playerId, callback);
            // }, function (callback) {
            //     guidePrizeDao.getByPlayerId(playerId, callback);
            // }, function (callback) {
            //     clientSaveDao.load(playerId, callback);
            // }, function (callback) {
            //     playerShopDao.getByPlayerId(playerId, callback);
            // }, function (callback) {
            //     playerActivityDao.getByPlayerId(playerId, callback);
            // }, function (callback) {
            //     equipBagDao.getByPlayerId(playerId, callback);
            // }, function (callback) {
            //     equipConfDao.getByPlayerId(playerId, callback);
            // }, function (callback) {
            //     endlessBuffDao.getByPlayerId(playerId, callback);
            // }, function (callback) {
            //     //endlessOccasionDao.getByPlayerId(playerId, callback);
            //     pomelo.app.rpc.world.endlessRemote.getEndlessOccasion("*",playerId, callback);
            // }, function (callback) {
            //     wakeUpBagDao.getByPlayerId(playerId, callback);
            // }, function (callback) {
            //     equipWashDao.getByPlayerId(playerId, callback);
            // },function (callback) {
            //     equipAchievedDao.getByPlayerId(playerId, callback);
            // },function (callback) {
            //     orderListDao.getByPlayerId(playerId, callback);
            // },function(callback){
            //     missionDao.getByPlayerId(playerId,callback);
            // },function(callback){
            //     statisticsDao.getByPlayerId(playerId,callback);
            // },function(callback){
            //     randBossDao.getByPlayerId(playerId,callback);
            // },function(callback){
            //     randomShopDao.getByPlayerId(playerId,callback);
            // },function(callback){
            //     bagDao.getFragItemByPlayerId(playerId,callback);
            // },function(callback){
            //     //randBossRecordDao.getRecordByPlayerId(playerId,callback);
            //     randBossRecordDao.getWinCntByWeekPlayerOnly(playerId,callback);
            // },function(callback){
            //     heroHistoryDao.getByPlayerId(playerId,callback);
            // },function(callback){
            //     offlineFightRecordDao.getRecordByPlayerId(playerId,callback);
            // },function(callback){
            //     passedActivityEctypeDao.getByPlayerId(playerId,callback);
            // },function(callback){
            //     equipHistoryDao.getByPlayerId(playerId,callback);
            // },function(callback){
            //     divisionPersonDao.getByPlayerId(playerId,callback);
            // },function(callback){
            //     friendPersonDao.getByPlayerId(playerId,callback);
            // },function(callback){
            //     playerRefreshDao.getByPlayerId(playerId,callback);
            // },function(callback){
            //     assistFightDao.getByPlayerId(playerId,callback);
            // },function(callback){
            //     trainDao.getByPlayerId(playerId,callback);
            // },function(callback){
            //     catchTreasureDao.getByPlayerId(playerId,callback);
            // },function(callback){
            //     mailDao.getByPlayerId(pomelo.app.get('dbclient'),playerId,Date.now(),callback);
            // },function(callback){
            //     endlessPVPBoxDao.getByPlayerId(playerId,callback);
            // },function(callback){
            //     barrierPromoteDao.getByPlayerId(playerId,callback);
            // }
        ],
        function (err, results) {
            var allInfo = {};
            allInfo.player = results[0];
            // allInfo.heroBag = results[1];
            // allInfo.petBag = results[2];
            // allInfo.passedBarrier = results[3];
            // allInfo.bagData = results[4];
            // allInfo.unlockChapter = results[5];
            // allInfo.hasBuyHeroIds = results[6];
            // allInfo.guideIds = results[7];
            // allInfo.clientSaveData = results[8];
            // allInfo.shopInfo = results[9];
            // allInfo.activityList = results[10];
            // allInfo.equipBag = results[11];
            // allInfo.equipConf = results[12];
            // allInfo.buffs = results[13];
            // allInfo.occasions = results[14];
            // allInfo.wakeUpBag = results[15];
            // allInfo.washData =  results[16];
            // allInfo.equipAchievedList =  results[17];
            // allInfo.orderList =  results[18];
            // allInfo.missionList = results[19];
            // allInfo.dataStatisticList = results[20];
            // allInfo.barrierRandBoss = results[21];
            // allInfo.randomShopInfo = results[22];
            // allInfo.fragBag = results[23];
            // allInfo.randBossRecordCnt = results[24];
            // allInfo.heroHistorys = results[25];
            // allInfo.offlineFightRecord = results[26];
            // allInfo.passedActivityEctype = results[27];
            // allInfo.equipHistorys = results[28];
            // allInfo.divisionPerson = results[29];
            // allInfo.friendPerson = results[30];
            // allInfo.playerRefresh = results[31];
            // allInfo.assistFight = results[32];
            // allInfo.train = results[33];
            // allInfo.catchTreasure = results[34];
            // allInfo.mails = results[35];
            // allInfo.endlessPVPBox = results[36];
            // allInfo.barrierPromote = results[37];
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




