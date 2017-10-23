/**
 * Created by kilua on 2015-10-01.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var userDao = require('../../../dao/playerDao'),
    //userControlDao = require('../../../dao/userControlDao'),
    Consts = require('../../../consts/consts');

var FLAG = {
    BY_USER_NAME: 1,
    BY_PLAYER_ID: 2,
    BY_PLAYER_NAME: 3
};

module.exports = function(app, http){
    /*
    *   http://192.168.1.150:3601/findPlayer?flag=1&keyword=123460
    * */
    http.get('/findPlayer', function(req, res) {
        var values = req.query,
            flag = parseInt(values['flag']),
            keyword = values['keyword'],
            dbClient = app.get('dbclient');
        logger.debug('findPlayer flag = %s, keyword = %s', flag, keyword);

        function daoCallback(err, playerInfo){
            res.header("Content-Type", "application/json;charset=utf-8");
            if(playerInfo){
                return res.send({code: 'ok', playerInfo: playerInfo});
            }else{
                return res.send({code: 'fail'});
            }
        }

        if(flag === FLAG.BY_USER_NAME){
            userDao.getPlayerInfoByUserName(dbClient, keyword, daoCallback);
        }else if(flag === FLAG.BY_PLAYER_ID){
            userDao.getPlayerInfoByPlayerId(dbClient, keyword, daoCallback);
        }else if(flag === FLAG.BY_PLAYER_NAME){
            userDao.getPlayerInfoByPlayerName(dbClient, keyword, daoCallback);
        }else{
            logger.debug('findPlayer unknown flag %s', flag);
            daoCallback();
        }
    });
    /*
    *   踢人
    * */
    http.get('/kickPlayer', function(req, res){
        var values = req.query,
            playerId = values['playerId'];
        app.rpc.world.playerRemote.kickPlayerByPlayerId.toServer('*', playerId, function(err){
            if(err) {
                res.send(err);
            }else{
                res.send('ok');
            }
        });
    });
    /*
    *   禁言
    * */
    http.get('/disableChat', function(req, res){
        var values = req.query,
            uid = values['uid'],
            interval = values['interval'] || 0,
            gm = values['gm'] || '';
        app.rpc.chat.chatRemote.disableChat.toServer('*', uid, interval, gm, function(err, result){
            if(err){
                return res.send(err);
            }
            return res.send(result);
        });
    });
    /*
    *   解除禁言
    * */
    http.get('/enableChat', function(req, res){
        var values = req.query,
            uid = values['uid'];
        app.rpc.chat.chatRemote.enableChat.toServer('*', uid, function(err, result){
            if(err){
                return res.send(err);
            }
            return res.send(result);
        });
    });
    /*
    *   封号
    * */
    http.get('/disableLogon', function(req, res){
        var values = req.query,
            uid = parseInt(values['uid']),
            interval = values['interval'],
            gm = values['gm'] || '',
            dbClient = app.get('dbclient');

        function getEndTime(interval){
            interval = Math.max(0, Math.ceil(interval * 60 * 1000));
            return (Date.now() + interval);
        }

        userDao.getPlayerByUid(dbClient, uid, function(err, player){
            if(player){
                return userControlDao.saveUserControl(dbClient, uid, Consts.USER_CONTROL.NO_LOGON, getEndTime(interval), gm, function(err, success){
                    if(success){
                        res.send('ok');
                        return app.rpc.world.playerRemote.kickPlayerByPlayerId.toServer('*', player.id, function(){});
                    }
                    return res.send('fail');
                });
            }
            return res.send('no this player');
        });
    });

    /*
    *   解除封号
    * */
    http.get('/enableLogon', function(req, res){
        var values = req.query,
            uid = values['uid'];
        userControlDao.eraseUserControl(app.get('dbclient'), uid, Consts.USER_CONTROL.NO_LOGON, function(err, success){
            if(err){
                return res.send(err);
            }
            var result = success ? 'ok' : 'fail';
            return res.send(result);
        });
    });
};