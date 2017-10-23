/**
 * Created by kilua on 2015-05-17.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts'),
    utils = require('../../../../mylib/utils/lib/utils');

function isChannelValid(channel) {
    return _.contains(_.values(Consts.CHAT_CHANNEL), channel);
}

function isPlayerChannel(channel) {
    var validChannel = [Consts.CHAT_CHANNEL.WORLD, Consts.CHAT_CHANNEL.PRIVATE,Consts.CHAT_CHANNEL.SYSTEM];
    return _.contains(validChannel, channel);
}

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

pro.send = function (msg, session, next) {
    logger.debug('send playerId = %s, channel = %s, content = %s, receiverName = %s', session.get('playerId'),
        msg.channel, msg.content, msg.receiverPid);
    var chatService = this.app.get('chatService'),
        sender = chatService.getPlayer(session.get('playerId')),
        receiver, pushMsg, channelObj;
    if (!sender) {
        logger.error('send sender %s not found!', session.get('playerId'));
        return next(null, {code: Code.FAIL});
    }

    // 检查是否处于禁言中
    if (chatService.isForbiddenChatByPid(sender.playerId)) {
        return next(null, {code: Code.CHAT.NO_CHAT});
    }

    // 检查频道
    if (msg.channel != Consts.CHAT_CHANNEL.GUILD_BEGIN && !isPlayerChannel(msg.channel)) {
        return next(null, {code: Code.CHAT.INVALID_CHANNEL});
    }
    // 内容不可为空
    msg.content = utils.trim(msg.content);
    if (!msg.content) {
        return next(null, {code: Code.CHAT.NO_BLANK_CONTENT});
    }
    if (msg.content.length > 100) {
        return next(null, {code: Code.CHAT.CONTENT_TOO_LONG});
    }
    pushMsg = {
        channel: msg.channel,
        senderId: sender.playerId,
        senderName: sender.name,
        content: msg.content,
        time: Date.now(),
        senderDivision : sender.division||1,
        senderCard : sender.card,
        senderHeadPicId : sender.headPicId
    };

    if (sender.inChatCD(msg.channel)) {
        return next(null, {code: Code.CHAT.IN_CHAT_CD});
    }
    if(!sender.checkSendCount(msg.channel)){
        return next(null, {code: Code.CHAT.CHAT_FREQUENTLY});
    }
    sender.startChatCD(msg.channel);

    // 检查对象
    if (msg.channel === Consts.CHAT_CHANNEL.PRIVATE) {
        // 加入私聊频道关卡开启限制
        var app = this.app;
        if (!msg.receiverPid) {
            return next(null, {code: Code.CHAT.PLAYER_NAME_BLANK});
        }
        receiver = chatService.getPlayer(msg.receiverPid);
        if (!receiver) {
            return next(null, {code: Code.CHAT.PLAYER_OFFLINE});
        }
        if (sender.playerId === receiver.playerId) {
            return next(null, {code: Code.CHAT.NOT_TALK_TO_YOURSELF});
        }
        //查找接收人的黑名单
        this.app.rpc.word.friendsRemote.getBlackList(session,receiver.playerId,function(err,blackList){
            if(err){//如果有错就当做没有黑名单，先给发送
                chatService.pushPrivateMsg(sender.playerId, receiver.playerId, 'chat.push', pushMsg);
                sender.addSendCount(msg.channel);
                return next(null, {code: Code.OK});
            }else{
                for (var i = 0; i < blackList.length; ++i) {
                    if (blackList[i] === sender.playerId) {
                        return next(null, {code: Code.CHAT.YOU_BLOCKED});
                    }
                }
                chatService.pushPrivateMsg(sender.playerId, receiver.playerId, 'chat.push', pushMsg);
                sender.addSendCount(msg.channel);
                return next(null, {code: Code.OK});
            }
        });

    }else  if (msg.channel === Consts.CHAT_CHANNEL.WORLD) {

        chatService.cacheChatRec(pushMsg);

        channelObj = chatService.getChannel(session.id, session.frontendId, msg.channel);
        if (channelObj) {
            return chatService.broadcast(_.pluck([], 'playerId'), 'chat.push', pushMsg, function (err) {
                if (err) {
                    logger.error('send err = %s', err.stack);
                    return next(null, {code: Code.FAIL});
                } else {
                    sender.addSendCount(msg.channel);
                    return next(null, {code: Code.OK});
                }
            });
        }
    } else if (msg.channel == Consts.CHAT_CHANNEL.GUILD_BEGIN && sender.guild != 0) {
        channelObj = chatService.getGuildChannel(session.id, session.frontendId, sender.guild);
        if (channelObj) {
            return channelObj.pushMessage('chat.push', pushMsg, [], function (err) {
                if (err) {
                    logger.error('send err = %s, failIds = %j', err.stack);
                    return next(null, {code: Code.FAIL});
                } else {
                    sender.addSendCount(msg.channel);
                    return next(null, {code: Code.OK});
                }
            });
        }
    }

    logger.error('send channel %s not support!', msg.channel);
    return next(null, {code: Code.FAIL});
};