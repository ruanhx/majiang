/**
 * Created by kilua on 2015-05-17.
 */

var util = require('util');

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

pro.add = function (args, cb) {
    // logger.debug("*****args:【%j】 加入聊天服务器****",args);
    var app = this.app;
    if (app.get('chatService').add(args)) {
        this.enterGuild(args.sid, args.frontendId, args.guildId||0, function () {
        });
        //app.get('chatService').addToChannel(args.sid, args.frontendId, Consts.CHAT_CHANNEL.SYSTEM, function (err){
            app.get('chatService').addToChannel(args.sid, args.frontendId, Consts.CHAT_CHANNEL.WORLD, function (err) {
                app.get('chatService').pushNewChatRecs(args.playerId);
                //cb(err);
            });
        //});
    }
    return cb(util.format('may be duplicated!sid = %s, frontendId = %s', args.sid, args.frontendId));
};

pro.leave = function (sid, frontendId, cb) {
    // logger.debug("*****sessionId:【%j】 退出聊天服务器****",sid);
    if (this.app.get('chatService').leave(sid, frontendId)) {
        return cb(null);
    }
    return cb(util.format('sid = %s, frontendId = %s not found!', sid, frontendId));
};

pro.enterGuild = function (sid, frontendId, guildId, cb) {
    if (0 != guildId) {
        var app = this.app;
        return app.get('chatService').addToGuildChannel(sid, frontendId, guildId, cb);
    }

    return cb(null);
};

pro.leaveGuild = function (sid, frontendId, guildId, cb) {
    if (0 != guildId) {
        if (this.app.get('chatService').removeFromGuildChannels(sid, frontendId, guildId)) {
            return cb(null);
        }
    }

    return cb(util.format('sid = %s, frontendId = %s not found for guild = %d!', sid, frontendId, guildId));
};

pro.updatePlayerInfo = function (args, cb) {
    var app = this.app;
    app.get('chatService').updatePlayerInfo(args);
    return cb(util.format('may be duplicated!sid = %s, frontendId = %s', args.sid, args.frontendId));
};

// pro.syncPlayerName = function (sid, frontendId, newName, cb) {
//     if (this.app.get('chatService').modifyName(sid, frontendId, newName)) {
//         return cb(null);
//     }
//     return cb(util.format('sid = %s, frontendId = %s not found!', sid, frontendId));
// };
//
// pro.syncPlayerProp = function (sid, frontendId, prop, val, cb) {
//     if (prop === 'name') {
//         return this.syncPlayerName(sid, frontendId, val, cb);
//     }
//     if (this.app.get('chatService').syncPlayerProp(sid, frontendId, prop, val)) {
//         return cb(null);
//     }
//     return cb(util.format('sid = %s, frontendId = %s not found!', sid, frontendId));
// };

pro.addToChannel = function (sid, frontendId, channel, cb) {
    this.app.get('chatService').addToChannel(sid, frontendId, channel, cb);
};

pro.setEndlessMatchInfo = function (msg, cb) {
    if(!msg)return cb(Code.FAIL);
    var chatService = this.app.get('chatService');
    msg.sendTime = Date.now();
    msg.channel = Consts.CHAT_CHANNEL.SYSTEM;
    chatService.changeEndlessChatRec(msg);

    return chatService.broadcast([], 'chat.acceptEndlessBattle', {playerId:msg.playerId}, function (err) {
        if (err) {
            logger.error('send err = %s', err.stack);
            return cb(Code.FAIL);
        } else {
            return cb(Code.OK);
        }
    });
};

pro.sendSysMsg = function (msg, cb) {
    logger.debug('sendSysMsg  msg = %j', msg);
    if(!msg)return cb(Code.FAIL);
    var chatService = this.app.get('chatService');
    msg.sendTime = Date.now();
    msg.channel = Consts.CHAT_CHANNEL.SYSTEM;
    chatService.cacheChatRec(msg);
    // 处理过滤
    return chatService.broadcast([], 'chat.push', msg, function (err) {
        if (err) {
            logger.error('send err = %s', err.stack);
            return cb(Code.FAIL);
        } else {
            return cb(Code.OK);
        }
    });

};
//
// pro.sendGuildMsg = function (guildId, sendId, msg, cb) {
//     logger.debug('sendSysMsg channel = %d, msg = %j', Consts.CHAT_CHANNEL.GUILD_BEGIN + guildId, msg);
//     var chatService = this.app.get('chatService');
//     var sender = chatService.getPlayer(sendId);
//     var channelObj = chatService.getChannelByGuild(guildId);
//
//     var pushMsg = {
//         channel: Consts.CHAT_CHANNEL.GUILD_BEGIN,
//         content: msg,
//         time: Date.now()
//     };
//
//     if (null != sender)
//     {
//         pushMsg.senderId = sender.playerId;
//         pushMsg.senderName = sender.name;
//         //pushMsg.senderVipLv = sender.vipLv;
//     }
//
//     if (channelObj) {
//         channelObj.pushMessage('chat.push', pushMsg , [], function (err) {
//             if (err) {
//                 logger.error('send err = %s, failIds = %j', err.stack);
//             }
//         });
//     }
//
//     return cb();
// };

// pro.disableChat = function (uid, interval, gm, cb) {
//     var dbClient = this.app.get('dbclient'),
//         chatService = this.app.get('chatService');
//
//     function getEndTime(interval) {
//         interval = Math.max(0, Math.ceil(interval * 60 * 1000));
//         return (Date.now() + interval);
//     }
//
//     userDao.getPlayerByUid(dbClient, uid, function (err, player) {
//         if (player) {
//             return userControlDao.saveUserControl(dbClient, uid, Consts.USER_CONTROL.NO_CHAT, getEndTime(interval), gm, function (err, success) {
//                 if (success && chatService) {
//                     chatService.addUserControl({uid: uid, endTime: getEndTime(interval)});
//                     return cb(null, 'ok');
//                 }
//                 return cb(null, 'fail');
//             });
//         }
//         return cb(null, 'no this player');
//     });
// };
//
// pro.enableChat = function (uid, cb) {
//     var dbClient = this.app.get('dbclient'),
//         chatService = this.app.get('chatService');
//     userControlDao.eraseUserControl(dbClient, uid, Consts.USER_CONTROL.NO_CHAT, function (err, success) {
//         if (err) {
//             return cb(err);
//         }
//         if (success && chatService) {
//             chatService.eraseUserControl(uid);
//             return cb(null, 'ok');
//         }
//         return cb(null, 'fail');
//     });
// };