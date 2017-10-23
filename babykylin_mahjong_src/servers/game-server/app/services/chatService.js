/**
 * Created by kilua on 2015-05-17.
 */

var util = require('util');

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore'),
    pomelo = require('pomelo');

var Consts = require('../consts/consts'),
    dataUtils = require('../util/dataUtils'),
    dataApi = require('../util/dataApi'),
    chatPersonDao = require('../dao/chatPersonDao');

var Player = function (args) {
    this.sid = args.sid||0;//area 的sessionId
    this.frontendId = args.frontendId||0;//area 的session.frontendId
    //this.uid = args.uid||0;
    this.playerId = args.playerId||0;
    this.name = args.name||0;//名字
    this.division = args.division||1;//段位
    this.card = args.card||0;//卡
    this.headPicId = args.headPicId||0;//头像
    this.VO = {
        playerId : args.playerId||0,
        channelInfo:{},// {channelId:{ nextReset : 0,//下次重置时间 //sendCount : 0//时间内发送次数}}
    }
};

/**
 * 开启冷却时间
 */
Player.prototype.startChatCD = function (channelId) {
    if(!this.channelInfo){
        this.channelInfo = {};
    }
    if(!this.channelInfo[channelId]){
        this.channelInfo[channelId] = {
            chatCDEndTime : 0
        }
    }
    var TalkChannel = dataApi.TalkChannel.findById(channelId);
    if(TalkChannel){
        this.channelInfo[channelId].chatCDEndTime = Date.now()+ (TalkChannel.messageInterval||0)* 1000;//设置下次可以发送的时间
    }
};
/**
 * 是否在CD中
 * @returns {boolean}
 */
Player.prototype.inChatCD = function (channelId) {
    if(!this.channelInfo) return false;
    if(!this.channelInfo[channelId] || !this.channelInfo[channelId].chatCDEndTime){
        return false;//不存表示刚开始--还不存在CD概念
    }else{
        return Date.now() < this.channelInfo[channelId].chatCDEndTime;
    }
};

/**
 *  发送次数限制检测
 * @returns {boolean}
 */
Player.prototype.checkSendCount = function(channelId){
    var TalkChannel = dataApi.TalkChannel.findById(channelId);
    if(!TalkChannel) return false;
    var channelInfo = this.VO.channelInfo[channelId];
    if(!channelInfo){
        this.VO.channelInfo[channelId] = {
            channelId : channelId,
            sendCount : 1,
            nextReset : Date.now()+TalkChannel.numberMessage[0]*60*60*1000
        }
        channelInfo = this.VO.channelInfo[channelId];
    }

    //如果下次重置发言次数时间 小于当前时间  重置发言次数 设置下次重置发言次数时间
    if(channelInfo.nextReset < Date.now()){
        channelInfo.sendCount = 0;
        channelInfo.nextReset = Date.now()+TalkChannel.numberMessage[0]*60*60*1000;
    }
    if(channelInfo.sendCount > TalkChannel.numberMessage[1]){
        //如果发言次数大于最大数  不让发送
        return false;
    }
    return true;
}

/**
 *  发送次数累加
 * @returns {boolean}
 */
Player.prototype.addSendCount = function(channelId){
    var TalkChannel = dataApi.TalkChannel.findById(channelId);
    if(!TalkChannel) return;
    var channelInfo = this.VO.channelInfo[channelId];
    if(channelInfo){
        channelInfo.sendCount ++;
    }
}

Player.prototype.pushMsg = function (route, msg, cb) {
    if(!(msg instanceof Object) || (msg instanceof Array)){
        logger.error("%j 消息格式不正确！",route);
        return;
    }
    pomelo.app.get('channelService').pushMessageByUids(route, msg, [{uid: this.playerId, sid: this.frontendId}], cb);
};

function makeSessionKey(sid, frontendId) {
    return util.format('%s#%s', frontendId, sid);
}

function getChannelName(channel) {
    return _.invert(Consts.CHAT_CHANNEL)[channel];
}

var ChatService = function (app) {
    this.app = app;
    this.sessionMap = {};
    this.playerIdMap = {};
    //this.nameMap = {};
    this.channelMap = {};//频道
    this.controlByPid = {};//控制--禁言使用
};

module.exports = ChatService;

var pro = ChatService.prototype;
pro.recs = {} ;//聊天记录 --一些指定频道
/**
 * 玩家上线，通知
 * @param args
 * @returns {boolean}
 */
pro.add = function (args) {
    var rec = new Player(args),
        sessionKey = makeSessionKey(args.sid, args.frontendId);
    if (!!this.sessionMap[sessionKey]) {
        // 重复chat
        return false;
    }
    //加载玩家聊天相关属性
    chatPersonDao.getByPlayerId(rec.playerId,function(dbData){
        rec.VO.playerId = rec.playerId;
        if(dbData!=null && dbData.length>0){
            rec.VO.channelInfo = JSON.parse(dbData[0].channelInfo);
        }else{
            rec.VO.channelInfo = {};
        }
        rec.pushMsg("chat.playerData",{info:_.values(rec.VO.channelInfo)},function(){});//推送玩家属性
    });
    this.sessionMap[sessionKey] = rec;
    this.playerIdMap[args.playerId] = rec;
    // this.nameMap[args.name] = rec;
    return true;
};

pro.updatePlayerInfo = function(args){
    var player = this.getPlayer(args.playerId);
    player.division = args.division||1;//段位
}

/**
 * 玩家下线通知
 * @param sid
 * @param frontendId
 * @returns {boolean}
 */
pro.leave = function (sid, frontendId) {
    var sessionKey = makeSessionKey(sid, frontendId),
        rec = this.sessionMap[sessionKey];

    function removeFromPlayerDict(dict, key, sid, frontendId) {
        var player = dict[key];
        if (player && player.sid === sid && player.frontendId === frontendId) {
            delete dict[key];
        }
    }

    if (!!rec) {
        this.removeFromChannels(sessionKey);
        delete this.sessionMap[sessionKey];
        // 防止重复登录踢人时，将后来登录的号保存的数据给清掉(后来登录的号可能在前一个号下线调用此函数清除数据的时候，已经覆盖前一个登录注册的数据)
        removeFromPlayerDict(this.playerIdMap, rec.playerId, sid, frontendId);
        chatPersonDao.save(rec.VO,function(){});
        return true;
    }
    return false;
};

// pro.modifyName = function (sid, frontendId, newName) {
//     var sessionKey = makeSessionKey(sid, frontendId),
//         rec = this.sessionMap[sessionKey];
//     if (!!rec) {
//         delete this.nameMap[rec.name];
//         rec.name = newName;
//         this.nameMap[rec.name] = rec;
//         return true;
//     }
//     return false;
// };

// pro.syncPlayerProp = function (sid, frontendId, prop, val) {
//     var sessionKey = makeSessionKey(sid, frontendId),
//         rec = this.sessionMap[sessionKey];
//     if (!!rec) {
//         rec[prop] = val;
//         return true;
//     }
//     return false;
// };

/**
 * 从频道中删除
 * @param sessionKey
 * @returns {boolean}
 */
pro.removeFromChannels = function (sessionKey) {
    var rec = this.sessionMap[sessionKey];
    if (!!this.channelMap[sessionKey] && !!rec) {
        _.each(this.channelMap[sessionKey], function (channel, channelName) {
            channel.leave(rec.uid, rec.frontendId);
            logger.debug('removeFromChannels channelName = %s, sid = %s, frontendId = %s', channelName, rec.sid, rec.frontendId);
        });
        delete this.channelMap[sessionKey];
        return true;
    }
    return false;
};

/**
 * 从公会频道移除
 * @param sid
 * @param frontendId
 * @param guildId
 * @returns {boolean}
 */
pro.removeFromGuildChannels = function (sid, frontendId, guildId) {
    var sessionKey = makeSessionKey(sid, frontendId),
        channelName = getChannelName(Consts.CHAT_CHANNEL.GUILD_BEGIN) + guildId,
        rec = this.sessionMap[sessionKey];

    var channel = this.channelMap[sessionKey][channelName];
    if (!!rec && !!channel) {
        channel.leave(rec.uid, rec.frontendId);
        logger.debug('removeFromChannels channelName = %s, sid = %s, frontendId = %s', channelName, rec.sid, rec.frontendId);
        delete this.channelMap[sessionKey][channelName];
        return true;
    }
    return false;
};

/**
 * 通过公会id获取频道
 * @param guildId
 * @returns {Channel}
 */
pro.getChannelByGuild = function (guildId) {
    var channelName = getChannelName(Consts.CHAT_CHANNEL.GUILD_BEGIN) + guildId;
    return this.app.get('channelService').getChannel(channelName, true);
};

/**
 * 加入公会频道
 * @param sid
 * @param frontendId
 * @param guildId
 * @param cb
 * @returns {boolean}
 */
pro.addToGuildChannel = function (sid, frontendId, guildId, cb) {
    if (0 == guildId) {
        cb(null)
        return false;
    }

    var sessionKey = makeSessionKey(sid, frontendId),
        channelName = getChannelName(Consts.CHAT_CHANNEL.GUILD_BEGIN) + guildId,
        channelOb, rec;

    if (!channelName) {
        cb(util.format('addToChannel unknown channel %d', Consts.CHAT_CHANNEL.GUILD_BEGIN + guildId));
        return false;
    }

    rec = this.sessionMap[sessionKey];

    if (!rec) {
        cb(util.format('addToChannel no player info found!sessionKey = %s', sessionKey));
        return false;
    }

    rec.guild = guildId;
    channelOb = this.app.get('channelService').getChannel(channelName, true);
    if (!channelOb) {
        cb(util.format('addToChannel getChannel %s failed!', channelName));
        return false;
    }

    channelOb.add(rec.playerId, rec.frontendId);
    logger.debug('addToChannel channel = %s, sid = %s, frontendId = %s', channelName, sid, frontendId);
    if (!this.channelMap[sessionKey]) {
        this.channelMap[sessionKey] = {};
    }
    this.channelMap[sessionKey][channelName] = channelOb;
    cb(null);
    return true;
};

/**
 * 加入频道
 * @param sid
 * @param frontendId
 * @param channel
 * @param cb
 * @returns {boolean}
 */
pro.addToChannel = function (sid, frontendId, channel, cb) {
    var sessionKey = makeSessionKey(sid, frontendId),
        channelName = getChannelName(channel),
        channelOb, rec;

    if (!channelName) {
        cb(util.format('addToChannel unknown channel %s', channel));
        return false;
    }
    // 防止重复创建频道
    if (!!this.channelMap[sessionKey] && !!this.channelMap[sessionKey][channelName]) {
        cb(util.format('addToChannel try to add duplicated channel!sid = %s, frontendId = %s, channelName = %s', sid, frontendId, channelName));
        return false;
    }
    rec = this.sessionMap[sessionKey];
    if (!rec) {
        cb(util.format('addToChannel no player info found!sessionKey = %s', sessionKey));
        return false;
    }
    channelOb = this.app.get('channelService').getChannel(channelName, true);
    if (!channelOb) {
        cb(util.format('addToChannel getChannel %s failed!', channelName));
        return false;
    }
    channelOb.add(rec.playerId, rec.frontendId);
    logger.debug('addToChannel channel = %s, sid = %s, frontendId = %s', channel, sid, frontendId);
    if (!this.channelMap[sessionKey]) {
        this.channelMap[sessionKey] = {};
    }
    this.channelMap[sessionKey][channelName] = channelOb;
    cb(null);
    return true;
};

/**
 * 私聊发送消息
 * @param fromPid
 * @param toPid
 * @param route
 * @param msg
 * @returns {boolean}
 */
pro.pushPrivateMsg = function (fromPid, toPid, route, msg) {
    var fromRec = this.playerIdMap[fromPid],
        toRec = this.playerIdMap[toPid],
        group = [];
    if (!fromRec || !toRec) {
        return false;
    }
    group.push({uid: fromRec.playerId, sid: fromRec.frontendId});
    group.push({uid: toRec.playerId, sid: toRec.frontendId});
    this.app.get('channelService').pushMessageByUids(route, msg, group, function (err) {
        if (err) {
            logger.error('pushPrivateMsg err = %s, fromPid = %s, toPid = %s, route = %s, msg = %j', err.stack,
                fromPid, toPid, route, msg);
        }
    });
};

/**
 * 广播消息
 * @param blockPlayerIds
 * @param route
 * @param msg
 * @param cb
 * @returns {*}
 */
pro.broadcast = function (blockPlayerIds, route, msg, cb) {
    var group = [];
    blockPlayerIds = blockPlayerIds || [];
    _.each(this.playerIdMap, function (player) {
        if (!_.contains(blockPlayerIds, player.playerId)) {
            group.push({uid: player.playerId, sid: player.frontendId});
        }
    });
    if (group.length === 0) {
        return cb();
    }
    this.app.get('channelService').pushMessageByUids(route, msg, group, cb);
};

// pro.getByPlayerName = function (name) {
//     return this.nameMap[name];
// };

pro.getPlayer = function (playerId) {
    return this.playerIdMap[playerId];
};

pro.getChannel = function (sid, frontendId, channel) {
    return this.channelMap[makeSessionKey(sid, frontendId)][getChannelName(channel)];
};

pro.getGuildChannel = function (sid, frontendId, guildId) {
    return this.channelMap[makeSessionKey(sid, frontendId)][getChannelName(Consts.CHAT_CHANNEL.GUILD_BEGIN) + guildId];
};

// pro.addUserControl = function (opRec) {
//     opRec = opRec || {};
//     opRec.endTime = opRec.endTime || 0;
//     // 已经失效
//     if (Date.now() > opRec.endTime) {
//         return false;
//     }
//     // 不在线
//     if (!this.uidMap[opRec.uid]) {
//         return false;
//     }
//     var op = this.controlByUid[opRec.uid];
//     if (!op) {
//         op = this.controlByUid[opRec.uid] = {uid: opRec.uid};
//     }
//     op.endTime = opRec.endTime;
//     return true;
// };
//
// pro.eraseUserControl = function (uid) {
//     delete this.controlByUid[uid];
// };
//

//判断是否禁言
pro.isForbiddenChatByPid = function (playerId) {
    return false;
};

/**
 * 存三条综合的聊天记录
 * @param rec
 */
pro.cacheChatRec = function (rec) {
    var TalkChannel = dataApi.TalkChannel.findById(rec.channel);
    if(!TalkChannel) return;
    if(!this.recs[rec.channel]){
        this.recs[rec.channel] = [];
    }
    if (this.recs[rec.channel].length > TalkChannel.talkRecord) {
        this.recs[rec.channel].shift();
    }
    this.recs[rec.channel].push(rec);
};

/**
 * 修改无尽匹配聊天记录状态
 * @param rec
 */
pro.changeEndlessChatRec = function (rec) {
    var TalkChannel = dataApi.TalkChannel.findById(rec.channel);
    if(!TalkChannel) return;
    if(!this.recs[rec.channel]){
        this.recs[rec.channel] = [];
    }

    this.recs[rec.channel].forEach(function (record) {
        if (!record.type){
            return;
        }
        if (record.type != 1){
            return;
        }
        if (record.endlessInfo&&record.endlessInfo.endlessPlayerId&&record.endlessInfo.endlessPlayerId==rec.playerId){
            record.endlessInfo.status = 1;
        }
    });

    // if (this.recs[rec.channel].length > TalkChannel.talkRecord) {
    //     this.recs.shift();
    // }
    // this.recs[rec.channel].push(rec);
};

/**
 * 推送保存的聊天记录
 * @param playerId
 */
pro.pushNewChatRecs = function (playerId) {
    var receivePlayer = this.getPlayer(playerId);
    if (receivePlayer) {
        var group = [];
        group.push({uid: receivePlayer.playerId, sid: receivePlayer.frontendId});
        var self = this;
        var msgList = [];
        _.each(self.recs,function(recOneChannel){
            msgList = _.union(msgList,recOneChannel);
        });
        self.app.get('channelService').pushMessageByUids('chat.msgList',{infoList : msgList }, group, null);
    }
};