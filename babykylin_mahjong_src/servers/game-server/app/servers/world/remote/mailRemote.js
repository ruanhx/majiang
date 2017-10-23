/**
 * Created by cxy on 2015-05-26.
 */

var pomelo = require('pomelo'),
    async = require('async'),
    logger = require('pomelo-logger').getLogger(__filename),
    mailDao = require('../../../dao/mailDao'),
    dataUtils = require('../../../util/dataUtils'),
    PlayerManager = require('../../../domain/world/playerManager'),
    playerMiniData = require('../../../domain/world/playerMiniData'),
    dropUtils = require('../../../domain/area/dropUtils'),
    common = require('../../../util/utils'),
_ = require('underscore');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

/*
 *   @param {Number OR String}
 * */
function makeDrops(drop) {
    var dropIdxList = common.parseParams(drop, "#");
    var barrierDropList = [];
    dropIdxList.forEach(function (dropIdx) {
        var drops = dropUtils.getDropItems(dropIdx);
        //barrierDropList.push(drops);
        barrierDropList = _.union(barrierDropList, drops);
    });
    //player.applyDrops(drops);
    return barrierDropList;
}

pro.CreateMailByCustom = function (playerId, mail,items, next) {
    var self = this;
    mail.items = items;
    mailDao.createOne(this.app.get('dbclient'), mail, function (err, isOK, rs) {
        if (isOK) {
            /*var playerManager = self.app.get('playerManager');
             if (!playerManager) {
             playerManager = new PlayerManager();
             self.app.set('playerManager', playerManager);
             }*/
            var playerManager = PlayerManager.get();

            var player = playerManager.getPlayer(playerId);
            if (null != player) {
                mail.id = rs[0][0].mailId;
                pomelo.app.rpc.area.mailRemote.newMail.toServer(player.areaName, playerId, mail, function(){});
            }
        }
        else {
            logger.error("CreateMail failed %j", mail)
        }
    });

    mailDao.removeMailDirty(this.app.get('dbclient'), playerId, Date.now(), function (err, count) {
    });

    return next(null);
};

// pro.CreateMail = function (playerId, args, next) {
//     var capacity = dataUtils.getOptionValue('mailUnReadExpired', 7);
//     _.each(args, function (entry) {
//         // 计算掉落
//         // 掉落按次序分组
//         entry.drops = makeDrops(entry.drop);
//         logger.debug("生成邮件~~@~~entry.drop:%d, entry.drops:%j",entry.drop,entry.drops);
//         entry.drops = JSON.stringify(entry.drops);
//
//         if (entry.life == null) {
//             entry.life = capacity * 24 * 60 * 60; // 7天
//         }
//
//         entry.addTime = Date.now();
//         entry.delTime = Date.now() + entry.life * 1000;
//     });
//
//     var self = this;
//     mailDao.createByInfo(this.app.get('dbclient'), playerId, args, function (err, isOK) {
//         if (isOK) {
//             /*var playerManager = self.app.get('playerManager');
//             if (!playerManager) {
//                 playerManager = new PlayerManager();
//                 self.app.set('playerManager', playerManager);
//             }*/
//             var playerManager = PlayerManager.get();
//
//             var player = playerManager.getPlayer(playerId);
//             if (null != player){
//                 //TODO:设置ID
//                 pomelo.app.rpc.area.mailRemote.newMail.toServer(player.areaName, playerId,args, null);
//             }
//
//         }
//         else {
//             logger.error("CreateMail failed %j", args)
//         }
//     });
//
//     mailDao.removeMailDirty(this.app.get('dbclient'), playerId, Date.now(), function (err, count) {
//     });
//
//     return next(null);
// };
/**
 * 新版的生成邮件
 * @param playerId
 * @param args
 * @param next
 * @returns {*}
 * @constructor
 */
pro.CreateMailNew = function (playerId, mail, next) {
    var capacity = dataUtils.getOptionValue('mailUnReadExpired', 7);
    // 计算掉落
    // 掉落按次序分组
    mail.drops = makeDrops(mail.drop);
    //logger.debug("生成邮件~~@~~entry.drop:%d, entry.drops:%j", mail.drop, mail.drops);
    //mail.drops = JSON.stringify(mail.drops);
    mail.items = JSON.stringify(mail.drops);
    if (mail.life == null) {
        mail.life = capacity * 24 * 60 * 60; // 7天
    }

    mail.addTime = Date.now();
    mail.delTime = Date.now() + mail.life * 1000;
    mail.playerId = playerId;
    var self = this;
    mailDao.createOne(this.app.get('dbclient'), mail, function (err, isOK, rs) {
        if (isOK) {
            var playerManager = PlayerManager.get();

            var player = playerManager.getPlayer(playerId);
            if (null != player) {
                mail.id = rs[0][0].mailId;
                pomelo.app.rpc.area.mailRemote.newMail.toServer(player.areaName, playerId, mail, function(){});
            }
            next(null);
        }
        else {
            logger.error("CreateMail failed %j", mail)
        }
    });

    mailDao.removeMailDirty(this.app.get('dbclient'), playerId, Date.now(), function (err, count) {
    });


};
// pro.CreateMailByUser = function(args, next){
//     var capacity = dataUtils.getOptionValue('mailUnReadExpired', 7);
//     _.each(args.mail, function (entry) {
//         // 掉落按次序分组
//         entry.drops = makeDrops(entry.drop);
//         entry.drops = JSON.stringify(entry.drops);
//
//         if (entry.life == null) {
//             entry.life = capacity * 24 * 60 * 60; // 7天
//         }
//
//         entry.addTime = Date.now();
//         entry.delTime = Date.now() + entry.life * 1000; // life 秒为单位
//     });
//
//     var self = this, count = 0, failed = [];
//     _.each(args.userList, function (username) {
//         _.each(args.mail, function (mail) {
//             count++;
//             mailDao.createMailByUser(self.app.get('dbclient'), username, mail, function (err, playerId) {
//                 if (null != playerId && playerId != 0) {
//                     /*var playerManager = self.app.get('playerManager');
//                      if (!playerManager) {
//                      playerManager = new PlayerManager();
//                      self.app.set('playerManager', playerManager);
//                      }*/
//                     var playerManager = PlayerManager.get();
//
//                     var player = playerManager.getPlayer(playerId);
//                     if (null != player){
//                         //TODO:设置ID
//                         pomelo.app.rpc.area.mailRemote.newMail.toServer(player.areaName, playerId,mail, null);
//                     }
//
//                 }
//                 else {
//                     failed.push(username);
//                 }
//
//                 if (0 == --count)
//                     next(null, failed);
//             });
//         });
//     });
// };

pro.CreateMailByPlayerName = function (args, next) {
    //console.log('CreateMail args = %j', args);

    var capacity = dataUtils.getOptionValue('mailUnReadExpired', 7);

    // 掉落按次序分组
    args.mail.items = makeDrops(args.mail.drop);
    logger.debug("CreateMailByPlayerName entry.drop:%d, entry.drops:%j", args.mail.drop, args.mail.items);
    args.mail.items = JSON.stringify(args.mail.items);

    if (args.mail.life == null) {
        args.mail.life = capacity * 24 * 60 * 60; // 7天
    }

    args.mail.addTime = Date.now();
    args.mail.delTime = Date.now() + args.mail.life * 1000;

    var self = this, count = 0, failed = [];
    async.eachSeries(args.nameList, function (name, callback) {
        count++;
        mailDao.createMailByTarget(self.app.get('dbclient'), name, args.mail, function (err, playerId, mailId) {
            if (null != playerId && playerId != 0) {
                var playerManager = PlayerManager.get();
                var player = playerManager.getPlayer(playerId);
                if (null != player) {
                    args.mail.playerId = playerId;
                    args.mail.id = mailId;
                    pomelo.app.rpc.area.mailRemote.newMail.toServer(player.areaName, playerId, args.mail, function(){});
                }
            }
            else {
                failed.push(name);
            }

            if (0 == --count)
                next(null, failed);

            callback();
        });
    }, function (err) {

    });


    //return next(null);
};
/**
 * 全服邮件
 * @param args 邮件参数
 * @param next
 * @constructor
 */
pro.creatServerMail = function (args, next) {
    var idList = playerMiniData.getInstance().getAllPlayer();
    args.idList = idList;
    this.CreateMailByPlayerID(args, next);
};

pro.CreateMailByPlayerID = function (args, next) {
    // console.log('CreateMail args = %j', args);

    var capacity = dataUtils.getOptionValue('mailUnReadExpired', 7);

    // 掉落按次序分组
    args.mail.items = makeDrops(args.mail.drop);
    //logger.debug("生成邮件~~@~~entry.drop:%s, entry.drops:%j", args.mail.drop, args.mail.items);
    args.mail.items = JSON.stringify(args.mail.items);

    if (args.mail.life == null) {
        args.mail.life = capacity * 24 * 60 * 60; // 7天
    }

    args.mail.addTime = Date.now();
    args.mail.delTime = Date.now() + args.mail.life * 1000;

    var self = this, count = 0, failed = [], mails = [];
    args.idList.forEach(function (playerId) {
        count++;
        args.mail.playerId = playerId;
        mailDao.createOne(self.app.get('dbclient'), args.mail, function (err, isOK, rs) {
            if (isOK) {
                var playerManager = PlayerManager.get();
                args.mail.playerId = playerId;
                var player = playerManager.getPlayer(playerId);
                if (null != player) {
                    args.mail.id = rs[0][0].mailId;
                    pomelo.app.rpc.area.mailRemote.newMail.toServer(player.areaName, playerId, args.mail, function(){});
                }

            }
            else {
                failed.push(playerId);
            }

            if (0 == --count)
                next(null, failed);


        });
    });


};

// pro.CreateMailByLvLimit = function (args, next) {
//     //console.log('CreateMail args = %j', args);
//
//     var capacity = dataUtils.getOptionValue('mailUnReadExpired', 7);
//
//     _.each(args.mail, function (entry) {
//         //// 计算掉落
//         // 掉落按次序分组
//         entry.drops = makeDrops(entry.drop);
//         entry.drops = JSON.stringify(entry.drops);
//
//         if (entry.life == null) {
//             entry.life = capacity * 24 * 60 * 60; // 7天
//         }
//
//         entry.addTime = Date.now();
//         entry.delTime = Date.now() + entry.life * 1000; // life 秒为单位
//     });
//
//     var self = this,
//         processTotal = 0,
//         successTotal = 0;
//     _.each(args.mail, function (mail) {
//         var up = parseInt(args.up),
//             low = parseInt(args.low),
//             tmp = up;
//         up = Math.max(up, low);
//         low = Math.min(tmp, low);
//         mailDao.createMailByLimit(self.app.get('dbclient'), up, low, mail, function (err, idList) {
//             processTotal++;
//             if (null == err) {
//                 console.info('CreateMailByLvLimit ok!idList = %j', idList);
//                 /*var playerManager = self.app.get('playerManager');
//                  if (!playerManager) {
//                  playerManager = new PlayerManager();
//                  self.app.set('playerManager', playerManager);
//                  }*/
//                 var playerManager = PlayerManager.get();
//                 if(idList.length > 0){
//                     successTotal++;
//                 }
//                 idList = _.pluck(idList, 'id');
//                 _.each(idList, function (playerId) {
//                     var player = playerManager.getPlayer(playerId);
//                     if (null != player){
//                         //TODO:设置ID
//                         pomelo.app.rpc.area.mailRemote.newMail.toServer(player.areaName, playerId,mail, null);
//                     }
//
//                 });
//             }
//             else {
//                 logger.error("Faild to send mail by level limit!");
//             }
//             if(processTotal >= args.mail.length){
//                 return next(null, (successTotal >= processTotal) ? 'ok' : 'fail');
//             }
//         });
//     });
//
//     //return next(null);
// };