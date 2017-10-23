/**
 * Created by cxy on 2015-05-23.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var utils = require('../../mylib/utils/lib/utils');
var Consts = require('../consts/consts');

var mailDao = module.exports;

mailDao.getByPlayerId = function(dbClient, playerId, nowDate, cb){
    var sql = 'SELECT * FROM playerMail WHERE playerId = ? AND delTime > ? order by delTime';
    dbClient.query(sql, [playerId, nowDate], function(err, res){
        if(err){
            logger.error('getByPlayerId err = %s, playerId = %s', err.stack, playerId);
            utils.invokeCallback(cb, err.message, []);
        }else if(!!res && res.length > 0){
            //做一遍分类整理排序 -- 重要的排前面（到时候要做过滤删除时使用）
            var uReadItem = [],//未读带附件
                uReadNItem = [],//未读不带附件
                read = [];//已读
            _.each(res, function (item) {
                item.drops = JSON.parse(item.items);
                if(item.status < Consts.MAIL_STATUS.READED){
                    if(item.drops && item.drops.length != 0){
                        uReadItem.push(item);
                    }else{
                        uReadNItem.push(item)
                    }
                }else if(item.status == Consts.MAIL_STATUS.READED){
                    read.push(item);
                }else{
                    logger.error("存在非法邮件%j",item);
                }
            });
            utils.invokeCallback(cb, null, _.union(uReadItem,uReadNItem,read));
        }else{
            utils.invokeCallback(cb, null, []);
        }
    });

    var sql = 'DELETE FROM playerMail WHERE playerId = ? AND delTime < ?';
    dbClient.query(sql, [playerId, nowDate], function(err, res){
        if(err){
            logger.error('getByPlayerId delete error = %s, playerId = %s', err.stack, playerId);
        }
    });
};

mailDao.getMailCountByStatus = function(dbClient, playerId, status, date, cb) {
    var sql = 'SELECT count(*) FROM playerMail WHERE playerId = ? and status < ? and delTime > ?';
    dbClient.query(sql, [playerId,status,date], function(err, res){
        if(err){
            logger.error('getMailCountByStatus err = %s, status = %s', err.stack, status);
            utils.invokeCallback(cb, err.message, false);
        }else{
            utils.invokeCallback(cb, null, res[0]["count(*)"]);
        }
    });
};

mailDao.removeMailDirty = function(dbClient, playerId, date, cb) {
    var sql = 'DELETE FROM playerMail WHERE playerId = ? and delTime <= ?';
    dbClient.query(sql, [playerId,date ], function(err, res){
        if(err){
            logger.error('removeMailDirty err = %s, date = %s', err.stack, date);
            utils.invokeCallback(cb, err.message, false);
        }else{
            utils.invokeCallback(cb, null, res.affectedRows);
        }
    });
};

mailDao.removeByMailId = function(dbClient, mailId, cb){
    var sql = 'DELETE FROM playerMail WHERE id = ?';
    dbClient.query(sql, [mailId], function(err){
        if(err){
            logger.error('removeByPlayerId err = %s, mailId = %s', err.stack, mailId);
            utils.invokeCallback(cb, err.message, false);
        }else{
            utils.invokeCallback(cb, null, true);
        }
    });
};

mailDao.removeByMailIdList = function(dbClient, mailIdList, cb){
    var sql = 'DELETE FROM playerMail WHERE id in (?)';
    dbClient.query(sql, [mailIdList], function(err){
        if(err){
            logger.error('removeByPlayerId err = %s, mailId = %j', err.stack, mailIdList);
            utils.invokeCallback(cb, err.message, false);
        }else{
            utils.invokeCallback(cb, null, true);
        }
    });
};

mailDao.removeByMailStatus = function(dbClient, playerId, status, cb){
    var sql = 'DELETE FROM playerMail WHERE playerId = ? AND status = ?';
    dbClient.query(sql, [playerId, status], function(err){
        if(err){
            logger.error('removeByPlayerId err = %s, playerId = %s, status = %s', err.stack, playerId, status);
            utils.invokeCallback(cb, err.message, false);
        }else{
            utils.invokeCallback(cb, null, true);
        }
    });
}

mailDao.updateStatusToValue = function(dbClient, playerId, status, deltime, cb){
    var sql = 'UPDATE playerMail SET status = ?, delTime = ? WHERE playerId = ?';
    dbClient.query(sql, [status, deltime, playerId], function(err){
        if(err){
            logger.error('updateStatus err = %s, playerId = %s, id = &s', err.stack, playerId,id);
            utils.invokeCallback(cb, err.message, false);
        }else{
            utils.invokeCallback(cb, null, true);
        }
    });
};

mailDao.updateStatus = function(dbClient, playerId, status, id, delTime, cb){
    var sql = 'UPDATE playerMail SET status = ?, delTime = ?  WHERE playerId = ? AND id = ?';
    dbClient.query(sql, [status, delTime, playerId, id], function(err){
        if(err){
            logger.error('updateStatus err = %s, playerId = %s, id = &s', err.stack, playerId,id);
            utils.invokeCallback(cb, err.message, false);
        }else{
            utils.invokeCallback(cb, null, true);
        }
    });
};

mailDao.createByInfo = function(dbClient, playerId, mail, cb){
    var sql = 'INSERT INTO playerMail(playerId,title,info,sender,addTime,delTime,items,infoParams,type) VALUES ?', items = [];
    _.each(mail, function(entry){
        items.push([playerId, entry.title, entry.info, entry.sender, entry.addTime, entry.delTime, entry.drops,entry.infoParams,entry.type? entry.type:0]);
    });

    dbClient.query(sql, [items], function(err, res){
        if(err){
            logger.error('refresh err = %s, items = %j', err.stack, items);
            utils.invokeCallback(cb, err.message, false);
        }else{
            utils.invokeCallback(cb, null, true);
        }
    });
};

/**
 * 创建邮件一封有id返回 mail {playerId,title,info,sender,addTime,delTime,items,infoParams,type}
 * @param dbClient
 * @param mail
 * @param cb
 */
mailDao.createOne = function(dbClient, mail, cb){
    var sql = 'CALL sp_createMail(?,?,?,?,?,?,?,?,?);',
        args=[mail.playerId,mail.title,mail.info,mail.sender,mail.addTime,mail.delTime,mail.items||'[]',mail.infoParams||'',mail.type||0];
    dbClient.query(sql, args, function(err, res){
        if(err){
            logger.error('refresh err = %s, items = %j', err.stack, args);
            utils.invokeCallback(cb, err.message, false,res);
        }else{
            utils.invokeCallback(cb, null, true,res);
        }
    });
};

// mailDao.createMailByIdList = function(dbClient, idList, mailList, cb){
//     var sql = 'INSERT INTO playerMail(playerId,title,info,sender,addTime,delTime,items,infoParams,type) VALUES ?',
//         items = [];
//     _.each(idList, function(id){
//         _.each(mailList, function(mail) {
//             items.push([id, mail.title, mail.info, mail.sender, mail.addTime, mail.delTime, mail.drops,mail.infoParams,mail.type? mail.type:0]);
//         });
//     });
//     if(items.length <= 0){
//         utils.invokeCallback(cb, null, true);
//         return;
//     }
//     dbClient.query(sql, [items], function(err, res){
//         if(err){
//             logger.error('refresh err = %s, items = %j', err.stack, items);
//             utils.invokeCallback(cb, err.message, false);
//         }else{
//             var firstInsertId = res.insertId;
//             _.each(entries, function(entry){
//                 entry.id = firstInsertId++;
//             });
//             utils.invokeCallback(cb, null, true);
//         }
//     });
// };

// mailDao.createMailByUser = function(dbClient, username, mail, cb){
//     var sql = 'CALL createMailByUser(?,?,?,?,?,?,?,?,?);',
//         args = [username, mail.title, mail.info, mail.sender, mail.addTime, mail.delTime, mail.drops,mail.infoParams,mail.type? mail.type:0];
//     dbClient.query(sql, args, function(err, res){
//         if(err){
//             logger.error('createMailByUser err = %s, args = %j', err.stack, args);
//             utils.invokeCallback(cb, err.message, 0);
//         }else{
//             if(!!res && !!res[0] && !!res[0][0]) {
//                 utils.invokeCallback(cb, null, res[0][0].playerId);
//             }else{
//                 utils.invokeCallback(cb, null, 0);
//             }
//         }
//     });
// };

mailDao.createMailByTarget = function(dbClient, name, mail, cb){
    var sql = 'CALL sp_createMailByPName(?,?,?,?,?,?,?,?,?);';
    dbClient.query(sql, [name, mail.title, mail.info, mail.sender, mail.addTime, mail.delTime, mail.drops,mail.infoParams,mail.type? mail.type:0], function(err, res){
        if(err){
            logger.error('createMailByTarget err = %s, name = %s', err.stack, name);
            utils.invokeCallback(cb, err.message, null, null);
        }else{
            var playerId = res[0][0].playerId;
            var Id = res[0][0].mailId;
            utils.invokeCallback(cb, null, playerId,Id);
        }
    });
};

// mailDao.createMailByLimit = function(dbClient, lvup, lvlow, mail, cb){
//     var sql = 'CALL createMailByLimit(?,?,?,?,?,?,?,?,?);';
//     dbClient.query(sql, [lvup, lvlow, mail.title, mail.info, mail.sender, mail.addTime, mail.delTime, mail.drops,mail.infoParams], function(err, res){
//         if(err){
//             logger.error('createMailByLimit err = %s, items = %j', err.stack,  mail);
//             utils.invokeCallback(cb, err.message, null);
//         }else{
//             var playerId = res[0];
//             utils.invokeCallback(cb, null, playerId);
//         }
//     });
// };
//
// mailDao.refresh = function(dbClient, playerId, entries, cb){
//     removeByPlayerId(dbClient, playerId, page, function(err, success){
//         if(!err && success){
//             var sql = 'INSERT INTO playerMail(playerId,title,info,sender,addTime,delTime,items,infoParams,type) VALUES ?',
//                 items = [];
//             _.each(entries, function(entry){
//                 //dbData.userData = JSON.stringify(userData);
//                 items.push([playerId, page, entry.title, entry.info, entry.sender, entry.addTime, entry.delTime, entry.drops,entry.infoParams,entry.type? entry.type:0]);
//             });
//             if(items.length <= 0){
//                 utils.invokeCallback(cb, null, true);
//                 return;
//             }
//             dbClient.query(sql, [items], function(err, res){
//                 if(err){
//                     logger.error('refresh err = %s, items = %j', err.stack, items);
//                     utils.invokeCallback(cb, err.message, false);
//                 }else{
//                     var firstInsertId = res.insertId;
//                     _.each(entries, function(entry){
//                         entry.id = firstInsertId++;
//                     });
//                     utils.invokeCallback(cb, null, true);
//                 }
//             });
//         }else{
//             utils.invokeCallback(cb, err, false);
//         }
//     });
// };
