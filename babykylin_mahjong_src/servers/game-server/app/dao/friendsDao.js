/**
 * Created by kilua on 2016/7/17 0017.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo');

var utils = require('../util/utils'),
    dataApi = require('../util/dataApi'),
    consts = require('../consts/consts');

var dao = module.exports = {};

dao.getFullByPlayerId = function (playerIdList, cb) {
    var sql = 'SELECT p.id AS playerId, playername, highPower, headPicId, logonTime, d.divisionId,weekHighScore,lastWeekHighScore FROM player p LEFT JOIN division d ON p.id=d.playerId where p.id IN (?)',
        args = [(playerIdList.length<1?[0]:playerIdList)];
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('getFullByPlayerId failed! ' + err.stack);
            utils.invokeCallback(cb, err.message, []);
        } else {
            res = res || [];
            utils.invokeCallback(cb, null, res || []);
        }
    });
};

// dao.save = function (friendData, cb) {
//     var sql = 'INSERT INTO friends(playerId, friendId,status) VALUES(?,?,?) ON DUPLICATE KEY UPDATE' +
//             ' playerId = VALUES(playerId),friendId = VALUES(friendId),status = VALUES(status)',
//         args = [friendData.playerId || 0, friendData.friendId || 0, friendData.status || 0];
//     pomelo.app.get('dbclient').query(sql, args, function (err, res) {
//         if (err) {
//             logger.error('save err = %s, friendData = %j', err.stack, friendData);
//             utils.invokeCallback(cb, err.message, false);
//         } else {
//             if (!!res && res.affectedRows > 0)
//                 utils.invokeCallback(cb, null, true);
//             else {
//                 logger.debug('save failed!friendData = %j', friendData);
//                 utils.invokeCallback(cb, null, false);
//             }
//         }
//     });
// };

dao.getRecommend = function(miniPower,maxPower,playerIds,cb){
    logger.debug("获取好友推荐列表 getRecommend miniPower:%d ,maxPower:%d , playerIds:%d",miniPower,maxPower,playerIds);
    var sql = 'SELECT p.id AS playerId, playername, highPower, headPicId, logonTime, d.divisionId FROM player p LEFT JOIN division d ON p.id=d.playerId where highPower>? AND highPower<? AND p.id NOT IN (?) ORDER BY isOnline,logonTime desc LIMIT 5',
        args = [miniPower,maxPower,(playerIds.length<1?[0]:playerIds)];

    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if(err){
            logger.error('获取好友推荐列表失败 err = %s', err.stack);
            utils.invokeCallback(cb, err.message, []);
        }else{
            utils.invokeCallback(cb, null, res || []);
        }
    });
}



dao.loadAllFriend = function (cb) {
    var sql = 'select * from friends ',
        args = [];

    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if(err){
            logger.error('loadAll err = %s', err.stack);
            utils.invokeCallback(cb, err.message, []);
        }else{
            utils.invokeCallback(cb, null, res||[]);
        }
    });
};
