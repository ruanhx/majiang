/**
 * Created by kilua on 2015-10-17.
 */

var exp = module.exports = {};

exp.getSnHistories = function(dbClient, begin, end, username, playerId, playerName, cb){
    var all = (!username && !playerId && !playerName), sql, args;
    if(all){
        sql = 'SELECT logTime, playerId, detail FROM PlayerActionLog WHERE logTime >= ? AND logTime <= ? AND type = ?';
        args = [begin, end, 4];
    }else{
        // ��ʱֻ֧��playerId
        sql = 'SELECT logTime, playerId, detail FROM PlayerActionLog WHERE logTime >= ? AND logTime <= ? AND playerId = ? AND type = ?';
        args = [begin, end, playerId, 4]

    }
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('getSnHistories err = %s, args = %j', err.stack, args);
            cb(err.message, []);
        }else{
            res = res || [];
            // ����detail,����detail�Ĳ�ȥ��
            res.forEach(function(row){
                var detail = row.detail = JSON.parse(row.detail);
                row.uid = detail.uid;
                row.playerName = detail.playerName;
                row.sn = detail.sn;
                row.awardId = detail.awardId;
                row.awardName = detail.awardName;
                delete row.detail;
            });
            cb(null, res);
        }
    });
};

exp.getBattleException = function(dbClient, begin, end, username, playerId, playerName, cb){
    var all = (!username && !playerId && !playerName), sql, args;
    if(all){
        sql = 'SELECT playerId, type, logTime, detail FROM PlayerActionLog WHERE logTime >= ? AND logTime <= ? AND type IN (?)';
        args = [begin, end, [2, 3]];
    }else{
        sql = 'SELECT playerId, type, logTime, detail FROM PlayerActionLog WHERE logTime >= ? AND logTime <= ? AND type IN (?) AND playerId = ?';
        args = [begin, end, [2, 3], playerId];
    }
    dbClient.query(sql, args, function(err, res){
        if(err){
            console.error('getBattleException err = %s, args = %j', err.stack, args);
            cb(err.message, []);
        }else{
            res = res || [];
            res.forEach(function(row){
                var detail = row.detail = JSON.parse(row.detail);
                if(row.type === 2){
                    // PVP
                    row.myLV = detail.myLV;
                    row.myPower = detail.myPower;
                    row.targetLV = detail.targetLV || 0;
                    row.targetPower = detail.targetPower;
                    row.targetId = detail.targetId || 0;
                }else{
                    // PVE
                    row.myLV = detail.myLV;
                    row.myPower = detail.myPower;
                    row.barrierId = detail.barrierId;
                    row.barrierPower = detail.barrierPower;
                }
                delete row.detail;
            });
            cb(null, res);
        }
    });
};