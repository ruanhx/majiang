/**
 * Created by kilua on 2015-10-09.
 */

var util = require('util');

var _ = require('underscore'),
    async = require('async');

var exp = module.exports = {};

exp.getUserByName = function(dbClient, username, cb){
    var sql = 'SELECT * FROM GMAccount WHERE username = ?',
        args = [username];
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('getUserByName err = %s, args = %j', err.stack, args);
            cb(err.message, null);
        }else{
            if(!!res && res.length === 1){
                cb(null, res[0]);
            }else{
                cb();
            }
        }
    });
};

exp.addGMAccount = function(dbClient, username, password, privilege, cb){
    var sql = 'INSERT INTO GMAccount(username, password, privilege) VALUES(?, ?, ?)',
        args = [username, password, privilege];
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('addGMAccount err = %s, args = %j', err.stack, args);
            cb(err.message, false);
        }else{
            if(!!res && res.affectedRows === 1){
                cb(null, true);
            }else{
                cb(null, false);
            }
        }
    });
};

exp.getUserList = function(dbClient, cb){
    var sql = 'SELECT * FROM GMAccount';
    dbClient.query(sql, [], function(err, res){
        if(err){
            console.error('getUserList err = %s', err.stack);
            cb(err.message, []);
        }else{
            cb(null, res);
        }
    });
};

/*
*   修改帐号权限
* */
exp.updatePrivilege = function(dbClient, username, privilege, cb){
    var sql = 'UPDATE GMAccount SET privilege = ? WHERE username = ?',
        args = [privilege, username];
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('updatePrivilege err = %s, args = %j', err.stack, args);
            cb(err.message, false);
        }else{
            cb(null, res.affectedRows === 1);
        }
    });
};

function getPlayerBaseInfo(dbClient, username, playerId, playerName, cb){
    // 由于帐号会加上平台前缀，所以用模糊查询
    var sql, args;
    if(username) {
        sql = 'SELECT U.id AS uid, U.MAC AS username, P.id AS playerId, P.name AS playerName, P.level AS level, U.isOnline FROM Player AS P \
    INNER JOIN User AS U ON P.userId = U.id WHERE (P.id = ? OR P.name = ? OR U.MAC LIKE ?)';
        args = [playerId || 0, playerName || '', util.format('%%%s%%', username || '')];
    }else{
        sql = 'SELECT U.id AS uid, U.MAC AS username, P.id AS playerId, P.name AS playerName, P.level AS level, U.isOnline FROM Player AS P \
    INNER JOIN User AS U ON P.userId = U.id WHERE (P.id = ? OR P.name = ?)';
        args = [playerId || 0, playerName || ''];
    }
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('getPlayerBaseInfo err = %s, args = %j', err.stack, args);
            cb(err.message, []);
        }else{
            if(!!res && res.length > 0){
                cb(null, res);
            }else{
                cb(null, []);
            }
        }
    });
}

function getUserControl(dbClient, uids, ops, cb){
    var sql = 'SELECT uid, op, startTime, endTime FROM UserControl WHERE uid in (?) AND op in (?)',
        args = [uids, ops];
    if(uids.length <= 0 || ops.length <= 0){
        return cb(null, []);
    }
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('getUserControl err = %s, args = %j', err.stack, args);
            cb(err.message, []);
        }else{
            if(!!res && res.length > 0){
                return cb(null, res);
            }else{
                return cb(null, []);
            }
        }
    });
}
/*
*   查找玩家
* */
exp.findPlayer = function(dbClient, username, playerId, playerName, cb){
    getPlayerBaseInfo(dbClient, username, playerId, playerName, function(err, playerList){
        if(err){
            return cb(err, []);
        }
        // 查询GM操作
        var uids = _.pluck(playerList, 'uid');
        getUserControl(dbClient, uids, [1, 2], function(err, ops){
            if(err){
                return cb(err, playerList);
            }
            // 拼接结果
            var playersByUid = _.indexBy(playerList, 'uid');
            ops.forEach(function(opRec){
                var playerInfo = playersByUid[opRec.uid];
                if(playerInfo){
                    if(!playerInfo.opRecs){
                        playerInfo.opRecs = [];
                    }
                    playerInfo.opRecs.push({op: opRec.op, interval: Math.ceil(Math.max(0, opRec.endTime - Date.now()) / (60 * 1000))});
                }
            });
            return cb(null, playerList);
        });
    });
};

exp.getPlayerDetail = function(dbClient, username, playerId, playerName, cb){
    function getBaseInfo(dbClient, username, playerId, playerName, cb){
        var sql, args;
        if(username) {
            sql = 'SELECT U.MAC AS username, P.id AS playerId, P.name AS playerName, P.level, P.vipLv, U.isOnline,' +
                ' U.registerTime, U.logonTime, U.logoffTime, U.totalOnlineTime, U.firstChargeTime, U.lastChargeTime,' +
                ' U.chargeTotal FROM Player AS P INNER JOIN User AS U ON P.userId = U.id WHERE (P.id = ? OR P.name = ? OR U.MAC LIKE ?)';
            args = [playerId || 0, playerName || '', util.format('%%%s%%', username || '')];
        }else {
            sql = 'SELECT U.MAC AS username, P.id AS playerId, P.name AS playerName, P.level, P.vipLv, U.isOnline,' +
                ' U.registerTime, U.logonTime, U.logoffTime, U.totalOnlineTime, U.firstChargeTime, U.lastChargeTime,' +
                ' U.chargeTotal FROM Player AS P INNER JOIN User AS U ON P.userId = U.id WHERE (P.id = ? OR P.name = ?)';
            args = [playerId || 0, playerName || ''];
        }
        dbClient.query(sql, args, function(err, res){
            if(err){
                console.error('getBaseInfo err = %s, args = %j', err.stack, args);
                cb(err.message, []);
            }else{
                cb(null, res || []);
            }
        });
    }

    function getPlayerRankByIds(dbClient, playerIds, cb){
        var sql = 'SELECT rank, playerId FROM PlayerRank WHERE playerId IN (?)',
            args = [playerIds];
        if(playerIds.length <= 0){
            return cb(null, []);
        }
        dbClient.query(sql, args, function(err, res){
            if(err){
                console.error('getPlayerRankByIds err = %s, args = %j', playerIds, args);
                cb(err.message, []);
            }else{
                cb(null, res || []);
            }
        });
    }

    function getBarrierProgressByIds(dbClient, playerIds, cb){
        //通关关卡id中，id在10000之前的最大值
        //var sql = 'SELECT MAX(barrierId) AS progress, playerId FROM PassedBarrier WHERE playerId IN (?) AND barrierId < 10000',
        var sql = 'SELECT MAX(lastPassedBarrierId) AS progress, playerId FROM passedcampbarrier WHERE playerId IN (?) AND lastPassedBarrierId > 0',
            args = [playerIds];
        if(playerIds.length <= 0){
            return cb(null, []);
        }
        dbClient.query(sql, args, function(err, res){
            if(err){
                console.error('getBarrierProgressByIds err = %s, args = %j', err.stack, args);
                cb(err.message, []);
            }else{
                cb(null, res || []);
            }
        });
    }

    function getBuildingInfosByIds(dbClient, playerIds, types, cb){
        if(playerIds.length <= 0 || types.length <= 0){
            return cb(null, []);
        }
        var sql = 'SELECT type AS buildingType, lv AS level, playerId FROM Buildings WHERE playerId IN (?) AND type IN (?)',
            args = [playerIds, types];
        dbClient.query(sql, args, function(err, res){
            if(err){
                console.error('getBuildingInfosByIds err = %s, args = %j', err.stack, args);
                cb(err.message, []);
            }else{
                cb(null, res || []);
            }
        });
    }

    getBaseInfo(dbClient, username, playerId, playerName, function(err, players){
        if(err){
            return cb(err);
        }
        if(players.length <= 0){
            return cb(null, []);
        }
        var playerIds = _.pluck(players, 'playerId');
        async.parallel(
            [
                function(callback){
                    getPlayerRankByIds(dbClient, playerIds, callback);
                },
                function(callback){
                    getBarrierProgressByIds(dbClient, playerIds, callback);
                },
                function(callback){
                    getBuildingInfosByIds(dbClient, playerIds, [1, 2, 5, 3], callback);
                }
            ],
            function(err, results){
                if(err){
                    return cb(err);
                }
                var rankByPlayerId = _.indexBy(results[0], 'playerId'),
                    barrierProgressById = _.indexBy(results[1], 'playerId'),
                    buidingInfoById = _.groupBy(results[2], 'playerId');
                // 将关卡进度、竞技排名和建筑信息附到players上面
                players.forEach(function(player){
                    var rankInfo = rankByPlayerId[player.playerId],
                        progressInfo = barrierProgressById[player.playerId],
                        buildingsInfo = buidingInfoById[player.playerId] || [];
                    // 0表示不在榜上
                    player.rank = rankInfo ? rankInfo.rank : 0;
                    player.barrierProgress = progressInfo ? progressInfo.progress : 0;
                    buildingsInfo.forEach(function(buildingInfo){
                        delete buildingInfo.playerId;
                    });
                    player.buildings = buildingsInfo;
                });
                cb(null, players);
            }
        );
    });
};

function getBaseInfo(dbClient, username, playerId, playerName, cb){
    var sql, args;
    if(username) {
        sql = 'SELECT U.MAC AS username, P.id AS playerId, P.name AS playerName, P.level FROM User AS U INNER JOIN' +
            ' Player AS P ON U.id = P.userId WHERE (P.id = ? OR P.name = ? OR U.MAC LIKE ?)';
        args = [playerId || 0, playerName || '', util.format('%%%s%%', username || '')];
    }else{
        sql = 'SELECT U.MAC AS username, P.id AS playerId, P.name AS playerName, P.level FROM User AS U INNER JOIN' +
            ' Player AS P ON U.id = P.userId WHERE (P.id = ? OR P.name = ?)';
        args = [playerId || 0, playerName || ''];
    }
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('getBaseInfo err = %s, args = %j', err.stack, args);
            cb(err.message, []);
        }else{
            cb(null, res || []);
        }
    });
}

exp.listItems = function(dbClient, username, playerId, playerName, cb){
    function getExpItems(dbClient, playerIds, cb){
        if(playerIds.length <= 0){
            return cb(null, []);
        }
        var sql = 'SELECT itemId, playerId, count FROM ExpItemBag WHERE playerId IN (?)',
            args = [playerIds];
        dbClient.query(sql, args, function(err, res){
            if(err){
                console.error('getExpItems err = %s, args = %j', err.stack, args);
                cb(err.message, []);
            }else{
                // 过滤掉空格
                var items = _.filter(res || [], function(item){
                    return (item.itemId !== 0);
                });
                cb(null, items);
            }
        });
    }

    function getMaterials(dbClient, playerIds, cb){
        if(playerIds.length <= 0){
            return cb(null, []);
        }
        var sql = 'SELECT itemId, playerId, cnt AS count FROM MaterialBag WHERE playerId IN (?)',
            args = [playerIds];
        dbClient.query(sql, args, function(err, res){
            if(err){
                console.error('getMaterials err = %s, args = %j', err.stack, args);
                cb(err.message, []);
            }else{
                cb(null, res || []);
            }
        });
    }

    function getSweepTickets(dbClient, playerIds, cb){
        if(playerIds.length <= 0){
            return cb(null, []);
        }
        var sql = 'SELECT itemId, playerId, cnt AS count FROM SweepBag WHERE playerId IN (?)',
            args = [playerIds];
        dbClient.query(sql, args, function(err, res){
            if(err){
                console.error('getSweepTickets err = %s, args = %j', err.stack, args);
                cb(err.message, []);
            }else{
                cb(null, res || []);
            }
        });
    }

    function getEquips(dbClient, playerIds, cb){
        if(playerIds.length <= 0){
            return cb(null, []);
        }
        var sql = 'SELECT itemId, playerId, 1 AS count, level FROM EquipBag WHERE playerId IN (?)',
            args = [playerIds];
        dbClient.query(sql, args, function(err, res){
            if(err){
                console.error('getEquips err = %s, args = %j', err.stack, args);
                cb(err.message, []);
            }else{
                cb(null, res || []);
            }
        });
    }
    getBaseInfo(dbClient, username, playerId, playerName, function(err, players){
        if(err){
            return cb(err);
        }
        if(players.length <= 0){
            return cb(null, []);
        }
        var playerIds = _.pluck(players, 'playerId');
        async.parallel(
            [
                function(callback){
                    getExpItems(dbClient, playerIds, callback);
                },
                function(callback){
                    getMaterials(dbClient, playerIds, callback);
                },
                function(callback){
                    getSweepTickets(dbClient, playerIds, callback);
                },
                function(callback){
                    getEquips(dbClient, playerIds, callback);
                }
            ],
            function(err, results){
                if(err){
                    return cb(err);
                }
                var expItemsByPlayerId = _.groupBy(results[0], 'playerId'),
                    materialsByPlayerId = _.groupBy(results[1], 'playerId'),
                    sweepTicketsByPlayerId = _.groupBy(results[2], 'playerId'),
                    equipsByPlayerId = _.groupBy(results[3], 'playerId');

                players.forEach(function(player){
                    var expItems = expItemsByPlayerId[player.playerId] || [],
                        materials = materialsByPlayerId[player.playerId] || [],
                        sweepTickets = sweepTicketsByPlayerId[player.playerId] || [],
                        equips = equipsByPlayerId[player.playerId] || [];
                    [expItems, materials, sweepTickets, equips].forEach(function(playerItems){
                        playerItems.forEach(function(playerItem){
                            delete playerItem.playerId;
                        });
                    });
                    player.expItems = expItems;
                    player.materials = materials;
                    player.sweepTickets = sweepTickets;
                    player.equips = equips;
                });
                cb(null, players);
            }
        );
    });
};

exp.listCards = function(dbClient, username, playerId, playerName, cb){
    function getCards(dbClient, playerIds, cb){
        if(playerIds.length <= 0){
            return cb(null, []);
        }
        var sql = 'SELECT cardId, playerId, level, superSkillLV FROM Cards WHERE playerId IN (?)',
            args = [playerIds];
        dbClient.query(sql, args, function(err, res){
            if(err){
                console.error('getCards err = %s, args = %j', err.stack, args);
                cb(err.message, []);
            }else{
                cb(null, res || []);
            }
        });
    }

    getBaseInfo(dbClient, username, playerId, playerName, function(err, players){
        if(err){
            return cb(err);
        }
        if(players.length <= 0){
            return cb(null, []);
        }
        getCards(dbClient, _.pluck(players, 'playerId'), function(err, cards){
            if(err){
                return cb(err);
            }
            var cardsByPlayerId = _.groupBy(cards, 'playerId');
            // 将关卡进度、竞技排名和建筑信息附到players上面
            players.forEach(function(player){
                var cards = cardsByPlayerId[player.playerId] || [];
                cards.forEach(function(cardInfo){
                    delete cardInfo.playerId;
                });
                player.cards = cards;
            });
            cb(null, players);
        });
    });
};

exp.listCardFrags = function(dbClient, username, playerId, playerName, cb){
    function getCardFrags(dbClient, playerIds, cb){
        if(playerIds.length <= 0){
            return cb(null, []);
        }
        var sql = 'SELECT itemId, playerId, frag AS count FROM CardFrag WHERE playerId IN (?)',
            args = [playerIds];
        dbClient.query(sql, args, function(err, res){
            if(err){
                console.error('getCardFrags err = %s, args = %j', err.stack, args);
                cb(err.message, []);
            }else{
                cb(null, res || []);
            }
        });
    }

    getBaseInfo(dbClient, username, playerId, playerName, function(err, players){
        if(err){
            return cb(err, []);
        }
        if(players.length <= 0){
            return cb(null, []);
        }
        getCardFrags(dbClient, _.pluck(players, 'playerId'), function(err, frags){
            if(err){
                return cb(err);
            }
            var fragsByPlayerId = _.groupBy(frags, 'playerId');
            players.forEach(function(player){
                var playerFrags = fragsByPlayerId[player.playerId] || [];
                playerFrags.forEach(function(playerFrag){
                    delete playerFrag.playerId;
                });
                player.frags = playerFrags;
            });
            cb(null, players);
        });
    });
};

exp.getPlayerIdByUser = function(dbClient, username, cb){
    var sql = 'SELECT P.id AS playerId FROM Player AS P INNER JOIN User AS U ON P.userId = U.id WHERE U.MAC = ?',
        args = [username];
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('getPlayerIdByUser err = %s, args = %j', err.stack, args);
            cb(err.message, 0);
        }else{
            if(!!res && !!res[0]) {
                cb(null, res[0].playerId || 0);
            }else{
                cb(null, 0);
            }
        }
    });
};

exp.getPlayerIdByName = function(dbClient, name, cb){
    var sql = 'SELECT id AS playerId FROM Player WHERE name = ?',
        args = [name];
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('getPlayerIdByName err = %s, args = %j', err.stack, args);
            cb(err.message, 0);
        }else{
            if(!!res && !!res[0]){
                cb(null, res[0].playerId || 0);
            }else{
                cb(null, 0);
            }
        }
    });
};

exp.getUserInfoByPlayerId = function(dbClient, playerId, cb){
    var sql = 'SELECT P.name, U.MAC AS username FROM Player AS P INNER JOIN User AS U ON P.userId = U.id WHERE P.id = ?',
        args = [playerId];
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('getUserInfoByPlayerId err = %s, args = %j', err.stack, args);
            cb(err.message);
        }else{
            if(!!res){
                cb(null, res[0]);
            }else{
                cb();
            }
        }
    });
};

exp.getUserInfoByPlayerIds = function(dbClient, playerIds, cb){
    var sql = 'SELECT P.id AS playerId, P.name, U.MAC AS username FROM Player AS P INNER JOIN User AS U ON P.userId = U.id WHERE P.id IN (?)',
        args = [playerIds];
    if(!playerIds || playerIds.length === 0){
        return cb(null, []);
    }
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('getUserInfoByPlayerIds err = %s, args = %j', err.stack, args);
            cb(err.message, []);
        }else{
            cb(null, res);
        }
    });
};

exp.getUserInfoByUsername = function(dbClient, username, cb){
    var sql = 'SELECT P.name, U.MAC AS username FROM Player AS P INNER JOIN User AS U ON P.userId = U.id WHERE U.MAC = ?',
        args = [username];
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('getUserInfoByUsername err = %s, args = %j', err.stack, args);
            cb(err.message);
        }else{
            if(!!res){
                cb(null, res[0]);
            }else{
                cb();
            }
        }
    });
};