/**
 * Created by kilua on 2015-10-17.
 */

var exp = module.exports = {};

/**
 * Get player by playerId
 * @param {Number} playerId User Id.
 * @param {function} cb Callback function.
 */
exp.getPlayersById = function (dbClient,playerId, cb) {
    // var sql = 'select id,playername,createTime,totalRechargeNum,diamondCnt,goldCnt,energy,comPoint,bronzeCoin,silverCoin,goldCoin,'+
    //     'highPower,highScore,weekHighScore,weekCardEndTick,monthCardEndTick,foreverCardEndTick from player where id = ?';
    var sql = 'select id,playername,createTime,totalRechargeNum,diamondCnt,goldCnt,energy,comPoint,bronzeCoin,silverCoin,goldCoin,highPower,highScore,weekHighScore,weekCardEndTick,monthCardEndTick,foreverCardEndTick,b.highDivision,c.divisionId,c.divScore from player a LEFT JOIN divisionperson b ON a.id = b.playerId LEFT JOIN division c ON a.id = c.playerId where a.id = ?';

    var args = [playerId];
    dbClient.query(sql, args, function (err, res) {
        if (err) {
            cb(null, []);
            return;
        }
        if (!res || res.length <= 0) {
            cb(null, []);
        } else {
            res[0].weekCardEndTick = new Date(res[0].weekCardEndTick);
            // res[0].weekCardEndTick = res[0].weekCardEndTick.getFullYear() + '-';
            res[0].monthCardEndTick = new Date(res[0].monthCardEndTick);
            res[0].foreverCardEndTick = new Date(res[0].foreverCardEndTick);
            cb(null, res[0]);
        }
    });
};

exp.getPlayersByName = function (dbClient,playerName, cb) {
    // var sql = 'select id,playername,createTime,totalRechargeNum,diamondCnt,goldCnt,energy,comPoint,bronzeCoin,silverCoin,goldCoin,'+
    //     'highPower,highScore,weekHighScore,weekCardEndTick,monthCardEndTick,foreverCardEndTick from player a where playername = ?';
    var sql = 'select id,playername,createTime,totalRechargeNum,diamondCnt,goldCnt,energy,comPoint,bronzeCoin,silverCoin,goldCoin,highPower,highScore,weekHighScore,weekCardEndTick,monthCardEndTick,foreverCardEndTick,b.highDivision,c.divisionId,c.divScore from player a LEFT JOIN divisionperson b ON a.id = b.playerId LEFT JOIN division c ON a.id = c.playerId where a.playername = ?';
    var args = [playerName];
    dbClient.query(sql, args, function (err, res) {
        if (err) {
            cb(null, []);
            return;
        }
        if (!res || res.length <= 0) {
            cb(null, []);
        } else {
            res[0].weekCardEndTick = new Date(res[0].weekCardEndTick);
            res[0].monthCardEndTick = new Date(res[0].monthCardEndTick);
            res[0].foreverCardEndTick = new Date(res[0].foreverCardEndTick);
            cb(null, res[0]);
        }
    });
};