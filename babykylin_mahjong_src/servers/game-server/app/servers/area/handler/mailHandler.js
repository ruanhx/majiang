/**
 * Created by cxy on 2015-05-23.
 */
var _ = require('underscore');
var logger = require('pomelo-logger').getLogger(__filename);
var area = require('../../../domain/area/area'),
    mailDao = require('../../../dao/mailDao'),
    Consts = require('../../../consts/consts'),
    dataUtils = require('../../../util/dataUtils'),
    Code = require('../../../../shared/code'),
    pomelo = require('pomelo');

var Handler = function (app) {
    this.app = app;
};

var pro = Handler.prototype;

module.exports = function (app) {
    return new Handler(app);
};

function RemoveByTimeSort(finalList, dirtyList, deleteList, capacity) {
    dirtyList.sort(function (a, b) {
        if (a.delTime < b.delTime)
            return false;
        return true;
    });

    _.each(dirtyList, function (entry) {
        if (finalList.length < capacity)
            finalList.push(entry);
        else
            deleteList.push(entry);
    });
}

function getMailById(items, id) {
    var i;
    for (i = 0; i < items.length; ++i) {
        if (items[i].id === id) {
            return items[i];
        }
    }
    return null;
}


pro.createMailTest = function (msg, session, next) {
    /*
     var self = this;
     var detail = [{title: "test", sender: "system", info: "myself", drop: 1205, life: 60000000}];
     self.app.rpc.world.mailRemote.CreateMail(session, session.get('playerId'), detail, null);
     next(null, {code: Code.OK, title: {}});
     return;
     */

    next(null);
}

//新版本补助邮件
// function sendVersionMail(player){
//     var versionMailSended = JSON.parse(player.versionMail);
//     var i = versionMailSended.length;
//     var b = true;//是否已经发送
//     while( i --){
//         if(versionMailSended[i] === dataUtils.getOptionValue('update', 'LoaclVersion', '')){
//             b = false;
//             break;
//         }
//     }
//     if(b){
//         var mailDropId = dataUtils.getOptionValue('notice', 'mailDropId', -1);
//         if(mailDropId != -1){
//             var mailSender = dataUtils.getOptionValue('notice', 'mailSender', "");
//             var mailHeader = dataUtils.getOptionValue('notice', 'mailHeader', "");
//             var mailTheme = dataUtils.getOptionValue('notice', 'applyMailTheme', "");
//             var mailContent = dataUtils.getOptionValue('notice', 'applyMailContent', "");
//
//             var myHeader = mailHeader.replace("%n", player.name);
//             pomelo.app.rpc.world.mailRemote.CreateMail.toServer('*', player.id, [{
//                 title: mailTheme,
//                 sender: mailSender,
//                 info: myHeader + '\r\n' + mailContent,
//                 drop: mailDropId
//             }], null);
//             //versionMailSended = [];//删除过期的存储数据
//             versionMailSended.push(dataUtils.getOptionValue('update', 'LoaclVersion', ''));
//             player.set('versionMail', JSON.stringify(versionMailSended));
//         }
//     }
// }

/*** 获取邮件列表, msg = {} */
pro.getMailTitle = function (msg, session, next) {
    var player = area.getPlayer(session.get('playerId'));
    player.mailPersonMgr.getMailTitle(function(mailList){
        next(null, {code: Code.OK, title:mailList});
    });
    // var player = area.getPlayer(session.get('playerId')),
    //     items = player.getMailInfo();
    //
    // if (items) {
    //     var info = [];
    //     _.each(items, function (entry) {
    //         if (null != entry && Date.now() < entry.delTime) {
    //             info.push({
    //                 id: entry.id,
    //                 title: entry.title,
    //                 addTime: entry.addTime,
    //                 delTime: entry.delTime,
    //                 status: entry.status,
    //                 itemCnt: entry.drops.length,
    //                 type:entry.type
    //             });
    //         }
    //     });
    //
    //     next(null, {code: Code.OK, title: info});
    // }
    // else {
    //     var self = this;
    //     // 须从数据库加载
    //     mailDao.getByPlayerId(self.app.get('dbclient'), session.get('playerId'), Date.now(), function (err, items) {
    //         if (err) {
    //             next(null, {code: Code.DB_ERR});
    //         } else {
    //             if (!!items) {
    //                 player.setMailInfo(items);
    //                 var info = [], deleteList = [];
    //                 var capacity = dataUtils.getOptionValue('mailCapacity', 2);
    //
    //                 if (items.length > capacity) {
    //                     var count = items.length, finalList = [];
    //
    //                     // 已读, 时间最短
    //                     var dirtyList = [];
    //                     _.each(items, function (entry) {
    //                         if (entry.status == Consts.MAIL_STATUS.READED)
    //                             dirtyList.push(entry);
    //                         else
    //                             finalList.push(entry);
    //                     });
    //
    //                     RemoveByTimeSort(finalList, dirtyList, deleteList, capacity);
    //
    //                     // 未读, 不带附件
    //                     dirtyList = [], items = finalList, finalList = [];
    //                     if (items.length > capacity) {
    //                         _.each(items, function (entry) {
    //                             if (entry.status < Consts.MAIL_STATUS.READED && entry.drops.length == 0)
    //                                 dirtyList.push(entry);
    //                             else
    //                                 finalList.push(entry);
    //                         });
    //                     }
    //                     else
    //                     {
    //                         finalList = items;
    //                     }
    //
    //                     RemoveByTimeSort(finalList, dirtyList, deleteList, capacity);
    //
    //                     // 未读, 带附件
    //                     dirtyList = [], items = finalList, finalList = [];
    //                     if (items.length > capacity) {
    //                         _.each(items, function (entry) {
    //                             if (entry.status < Consts.MAIL_STATUS.READED && entry.drops.length != 0)
    //                                 dirtyList.push(entry);
    //                             else
    //                                 finalList.push(entry);
    //                         });
    //                     }
    //                     else
    //                     {
    //                         finalList = items;
    //                     }
    //
    //                     RemoveByTimeSort(finalList, dirtyList, deleteList, capacity);
    //
    //                     player.setMailInfo(finalList);
    //                     items = finalList;
    //
    //                     var idList = [];
    //                     _.each(deleteList, function (entry) {
    //                         idList.push(entry.id);
    //                     });
    //
    //                     mailDao.removeByMailIdList(self.app.get('dbclient'), idList, function (err, isOK) {});
    //                 }
    //
    //                 _.each(items, function (entry) {
    //                     if (null != entry && Date.now() < entry.delTime) {
    //                         info.push({
    //                             id: entry.id,
    //                             title: entry.title,
    //                             addTime: entry.addTime,
    //                             delTime: entry.delTime,
    //                             status: entry.status,
    //                             itemCnt: entry.drops.length,
    //                             type:entry.type
    //                         });
    //                     }
    //                 });
    //                 next(null, {code: Code.OK, title: info});
    //             }
    //             else {
    //                 next(null, {code: Code.OK, title:[]});
    //             }
    //             //sendVersionMail(player);
    //         }
    //     });
    // }
}

/*** 读取邮件详情, msg = {id = 0} */
pro.getMailDetail = function (msg, session, next) {
    var player = area.getPlayer(session.get('playerId'));
    player.mailPersonMgr.getMailDetail(msg.id,function(rs,mail){
        if(rs){
            next(null, {code: Code.OK, detail:mail});
        }else{
            next(null, {code: Code.FAIL});
        }
    });
    // var player = area.getPlayer(session.get('playerId')),
    //     items = player.getMailInfo();
    //
    // if (null == items) {
    //     next(null, {code: Code.FAIL}); // 未曾获取列表
    //     return;
    // }
    // else {
    //     var mail = getMailById(items, msg.id);
    //
    //     if (null == mail || Date.now() > mail.delTime) {
    //         next(null, {code: Code.AREA.MAIL_TIME_UP});  // 邮件不存在, 或者已过期
    //         return;
    //     }
    //
    //     if (mail.status == Consts.MAIL_STATUS.READED) {
    //         mail.canGet = (mail.drops.length > 0);
    //         next(null, {code: Code.OK, detail: mail});
    //         return;
    //     }
    //
    //     if (mail.drops.length <= 0) {
    //         mail.status = Consts.MAIL_STATUS.READED;
    //
    //         var ReadExpired = dataUtils.getOptionValue('mailReadExpired', 3);
    //         ReadExpired = ReadExpired * 24 * 60 * 60 * 1000;
    //
    //         if (mail.delTime - Date.now() > ReadExpired)
    //         {
    //             mail.delTime = Date.now() + ReadExpired;
    //             //console.log('getMailDetail = %s', new Date(mail.delTime));
    //         }
    //     }
    //
    //     mailDao.updateStatus(this.app.get('dbclient'), session.get('playerId'), mail.status, mail.id, mail.delTime, function (err, isOK) {
    //         if (isOK) {
    //             mail.canGet = (mail.drops.length > 0);
    //             next(null, {code: Code.OK, detail: mail});
    //         }
    //         else {
    //             next(null, {code: Code.DB_ERR});
    //         }
    //     });
    // }
}

/*** 领取邮件附件, msg = {id = 0} */
pro.getMailItems = function (msg, session, next) {
    var player = area.getPlayer(session.get('playerId'));
    player.mailPersonMgr.getMailItems(msg.id,function(rs,args){
        if(rs){
            next(null, {code: Code.OK, drops: args.drops, status: args.status, id: args.id, delTime: args.delTime});
        }else{
            next(null, {code: Code.FAIL});
        }
    });
    // var player = area.getPlayer(session.get('playerId')),
    //     items = player.getMailInfo(),
    //     logClient = this.app.get('logClient');
    //
    // if (null == items) {
    //     next(null, {code: Code.FAIL}); // 未曾获取列表
    //     return;
    // }
    // else {
    //     var mail = getMailById(items, msg.id);
    //
    //     if (null == mail || Date.now() > mail.delTime) {
    //         next(null, {code: Code.AREA.MAIL_TIME_UP});  // 邮件不存在, 或者已过期
    //         return;
    //     }
    //
    //     if (mail.status == Consts.MAIL_STATUS.READED) {
    //         next(null, {code: Code.FAIL});  // 邮件奖励已领取, 或者奖励不存在
    //         return;
    //     }
    //
    //     var ReadExpired = dataUtils.getOptionValue('mailReadExpired', 3);
    //     ReadExpired = ReadExpired * 24 * 60 * 60 * 1000;
    //
    //     if (mail.delTime - Date.now() > ReadExpired)
    //     {
    //         mail.delTime = Date.now() + ReadExpired;
    //         var time = Date(mail.delTime);
    //     }
    //
    //     mailDao.updateStatus(this.app.get('dbclient'), session.get('playerId'), Consts.MAIL_STATUS.READED, mail.id, mail.delTime, function (err, isOK) {
    //         if (isOK) {
    //             mail.status = Consts.MAIL_STATUS.READED;
    //
    //             // 计算掉落
    //             //var awardManager = dropManager.create();
    //             //awardManager.dropItems = mail.drops;
    //             //awardManager.apply(player);
    //             // 记录领取邮件附件获得钻石的日志
    //             // var dropDiamond = dropManager.getDropDiamondTotal(mail.drops);
    //             // if(dropDiamond > 0){
    //             //     diamondFlowDao.log(logClient, player.id, player.level, diamondFlowDao.LOG_TYPE.MAIL_ATTACHMENT_GOT, dropDiamond, mail.title);
    //             // }
    //
    //             var awardDrops =  player.applyDrops( mail.drops );
    //             next(null, {code: Code.OK, drops: awardDrops, status: mail.status, id: mail.id, delTime: mail.delTime});
    //         }
    //         else {
    //             next(null, {code: Code.DB_ERR});
    //         }
    //     })
    // }
}

/*** 获取邮件列表, msg = {id = 0} */
pro.getAllMailItems = function (msg, session, next) {
    var player = area.getPlayer(session.get('playerId'));
    player.mailPersonMgr.getAllMailItems(function(rs,drops){
        if(rs){
            next(null, {code: Code.OK, allDrops:drops});
        }else{
            next(null, {code: Code.FAIL});
        }
    });
    // var player = area.getPlayer(session.get('playerId')),
    //     items = player.getMailInfo(),
    //     logClient = this.app.get('logClient');
    //
    // if (null == items) {
    //     next(null, {code: Code.FAIL}); // 未曾获取列表
    //     return;
    // }
    // else {
    //     var ReadExpired = dataUtils.getOptionValue('mailReadExpired', 3);
    //     ReadExpired = Date.now() + ReadExpired * 24 * 60 *60;
    //
    //     mailDao.updateStatusToValue(this.app.get('dbclient'), session.get('playerId'), Consts.MAIL_STATUS.READED, ReadExpired, function (err, isOK) {
    //         if (isOK) {
    //             var   allDrops = [], retData = [];
    //
    //             var ReadExpired = dataUtils.getOptionValue('mailReadExpired', 3);
    //             ReadExpired = ReadExpired * 24 * 60 * 60 * 1000;
    //
    //             _.each(items, function (mail) {
    //                 var nowCheck = Date.now();
    //                 if (null != mail
    //                     && Consts.MAIL_STATUS.READED != mail.status
    //                     && mail.drops.length != 0
    //                     && nowCheck <= mail.delTime) {
    //                     _.each(mail.drops, function (entry) {
    //                         allDrops.push(entry);
    //                     });
    //
    //                     if (mail.delTime - Date.now() > ReadExpired)
    //                         mail.delTime = Date.now() + ReadExpired;
    //
    //                     mail.status = Consts.MAIL_STATUS.READED;
    //                     retData.push({drops: mail.drops, status: mail.status, id: mail.id});
    //                 }
    //             });
    //             player.applyDrops(allDrops);
    //             // awardManager.dropItems = allDrops;
    //             // awardManager.apply(player);
    //             //
    //             // // 记录领取邮件附件获得钻石的日志
    //             // var dropDiamond = dropManager.getDropDiamondTotal(awardManager.drops);
    //             // if(dropDiamond > 0){
    //             //     diamondFlowDao.log(logClient, player.id, player.level, diamondFlowDao.LOG_TYPE.MAIL_ATTACHMENT_GOT, dropDiamond, 'all');
    //             // }
    //             logger.debug("邮件全部领取成功 allDrops：%j",allDrops);
    //             next(null, {code: Code.OK,allDrops:allDrops});
    //         }
    //         else {
    //             next(null, {code: Code.DB_ERR});
    //         }
    //     });
    // }
};

/*** 删除邮件 msg = {id = 0} */
pro.removeMail = function (msg, session, next) {
    var player = area.getPlayer(session.get('playerId'));
    player.mailPersonMgr.removeMail(msg.id,function(rs){
        if(rs){
            next(null, {code: Code.OK});
        }else{
            next(null, {code: Code.FAIL});
        }
    });
    // var player = area.getPlayer(session.get('playerId')),
    //     items = player.getMailInfo();
    //
    // if (null == items) {
    //     next(null, {code: Code.FAIL}); // 未曾获取列表
    //     return;
    // }
    // else {
    //     var mail = getMailById(items, msg.id);
    //
    //     if (null == mail || Date.now() > mail.delTime) {
    //         next(null, {code: Code.AREA.MAIL_TIME_UP});  // 邮件不存在, 或者已过期
    //         return;
    //     }
    //
    //     mailDao.removeByMailId(this.app.get('dbclient'), mail.id, function (err, isOK) {
    //         if (isOK) {
    //             var newInfo = [], retIds = [];
    //             var dirty = mail.id;
    //             _.each(items, function (mail) {
    //                 if (mail.id != dirty) {
    //                     newInfo.push(mail);
    //                 }
    //             });
    //
    //             player.setMailInfo(newInfo);
    //             next(null, {code: Code.OK});
    //         }
    //         else {
    //             next(null, {code: Code.DB_ERR});
    //         }
    //     })
    // }
};

/*** 删除邮件 msg = {id = 0} */
pro.removeAllMail = function (msg, session, next) {
    var player = area.getPlayer(session.get('playerId'));
    player.mailPersonMgr.removeAllMail(function(rs,retIds){
        if(rs){
            next(null, {code: Code.OK,ids: retIds});
        }else{
            next(null, {code: Code.FAIL});
        }
    });
    // var player = area.getPlayer(session.get('playerId')),
    //     items = player.getMailInfo();
    //
    // if (null == items) {
    //     next(null, {code: Code.FAIL}); // 未曾获取列表
    //     return;
    // }
    // else {
    //     mailDao.removeByMailStatus(this.app.get('dbclient'), session.get('playerId'), Consts.MAIL_STATUS.READED, function (err, isOK) {
    //         if (isOK) {
    //             var newInfo = [], retIds = [];
    //
    //             _.each(items, function (mail) {
    //                 if (Consts.MAIL_STATUS.READED != mail.status) {
    //                     newInfo.push(mail);
    //                 }
    //                 else {
    //                     retIds.push(mail.id);
    //                 }
    //             });
    //
    //             player.setMailInfo(newInfo);
    //             next(null, {code: Code.OK, ids: retIds});
    //         }
    //         else {
    //             next(null, {code: Code.DB_ERR});
    //         }
    //     });
    // }
};
