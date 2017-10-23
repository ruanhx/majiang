/**
 * Created by
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    dataApi = require('../../../util/dataApi'),
    dataUtils = require('../../../util/dataUtils'),
    dropUtils = require('../../../domain/area/dropUtils'),
    playerDao = require('../../../dao/playerDao'),
    friendPersonDao = require('../../../dao/friendPersonDao'),
    Consts = require('../../../consts/consts'),
    friendPersonMgr = require('../../../domain/area/friendPersonMgr');


var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

/**
 * 查找好友
 * @param msg
 * @param session
 * @param next
 */
pro.findFriend = function (msg, session ,next) {
    playerDao.getPlayerByName(msg.name,function(err,player){
        if(player){
            next(null,{code:Code.OK,playerId:player.id});
        }else{
            next(null,{code:Code.CONNECTOR.FA_PLAYER_NOT_EXIST});
        }
    });

}

/**
 * 角色是否在好友申请列表
 * @param msg
 * @param session
 * @param next
 */
pro.playerInFriendRequest = function (msg, session ,next) {
    var player =  area.getPlayer(session.get('playerId'));
    this.app.rpc.world.friendsRemote.playerInFriendRequest(session,player.id ,msg.playerId, function(err,rs){
        return next(null,{code:Code.OK,rs:rs});
    });
}

/**
 * 列表信息
 * @param msg
 * @param session
 * @param next
 */
pro.getInfoList = function (msg, session ,next){
    var player =  area.getPlayer(session.get('playerId'));
    if(msg.type === Consts.FRIEND_TYPE.RECOMMEND){
        var recommendList = player.friendPersonMgr.getRecommend();
        if (recommendList.length !== 0)
            return next(null,{code:Code.OK,infoList:recommendList});
    }
    //RPC获取列表
    this.app.rpc.world.friendsRemote.getInfoList(session,player.id,msg.type,player.highPower,function(err,list){
        if(msg.type === Consts.FRIEND_TYPE.RECOMMEND){
            player.friendPersonMgr.setRecommend(list);
        }else if(msg.type === Consts.FRIEND_TYPE.FRIEND){
            _.each(list,function(info){
                if( -1 !== _.indexOf(player.friendPersonMgr.getSendEnergy(),info.playerId )){
                    info.sendEnergy = 1;
                }else{
                    info.sendEnergy = 0;
                }
            });
        }
        return next(null,{code:Code.OK,infoList:list});
    });
}

/**
 * 发送体力
 * @param msg
 * @param session
 * @param next
 */
pro.sendEnergy = function (msg, session ,next){
    var self = this;
    var player =  area.getPlayer(session.get('playerId'));
    var rsList = [];
    self.app.rpc.world.friendsRemote.getFriendIdList(session,player.id,function(err,fidList){
        _.each(msg.playerIds||[],function(pid){
            if(_.indexOf(fidList,pid)!== -1){
                rsList.push(pid);
            }
        });
        rsList = player.friendPersonMgr.pushSendEnergy(rsList);
        self.app.rpc.world.friendsRemote.sendEnergy(session,player.id,rsList,function(err,code){
            next(null,{code:code,rsList:rsList});
        });
    });
}

/**
 * 接收体力
 * @param msg
 * @param session
 * @param next
 */
pro.acceptEnergy = function (msg, session ,next) {
    var self = this;
    var player =  area.getPlayer(session.get('playerId'));
    self.app.rpc.world.friendsRemote.acceptEnergy(session,player.id,msg.playerIds,function(err,code,rsList){
        var receiveEnergy = dataUtils.getOptionValue("ReceivingEnergy",5)*rsList.length;
        player.set("energy",player.energy +receiveEnergy);
        next(null,{code:code,rsList:rsList});
    });
}

/**
 * 发送好友请求
 * @param msg
 * @param session
 * @param next
 */
pro.sendRequest = function (msg, session , next){
    var self = this;
    var player =  area.getPlayer(session.get('playerId'));
    self.app.rpc.world.friendsRemote.sendRequest(session,player.id,msg.playerId,function(err,rs){

        next(null,{code:rs.code});
    });
}

/**
 * 同意好友请求
 * @param msg
 * @param session
 * @param next
 */
pro.agreeRequest = function (msg, session, next) {
    var self = this;
    var player = area.getPlayer(session.get('playerId'));
    self.app.rpc.world.friendsRemote.agreeRequest(session, player.id, msg.playerId, function (err, code,friendName) {
        var agreeCnt = player.friendPersonMgr.getAgreeCnt();
        var maxAssistDrewCnt = dataUtils.getOptionValue("AddHelpFriendRewardTimes", 30);
        var isSend = 0;
        if (code === Code.OK && agreeCnt < maxAssistDrewCnt) {
            var mailId = dataUtils.getOptionValue("AddHelpFriendMailId", 0);
            var sysMail = dataApi.SysEamil.findById(mailId);
            var mail = {
                title: sysMail.title,
                info: sysMail.text,
                sender: sysMail.name,
                drop: sysMail.dropId,
                infoParams: JSON.stringify([{
                    type: Consts.MAIL_PARAM_TYPE.TRUE_VALUE,
                    value: friendName
                }, {type: Consts.MAIL_PARAM_TYPE.TRUE_VALUE, value: agreeCnt+1}])
            };
            player.friendPersonMgr.setAgreeCnt(agreeCnt + 1);
            pomelo.app.rpc.world.mailRemote.CreateMailNew.toServer("*", session.get('playerId'), mail, function () {
            });
            isSend = 1;
        }
        var friend = area.getPlayer(msg.playerId);
        // 好友在线
        if (friend) {
            var friendAgreeCnt = friend.friendPersonMgr.getAgreeCnt();
            if (code === Code.OK && friendAgreeCnt < maxAssistDrewCnt) {
                var mailId = dataUtils.getOptionValue("AddHelpFriendMailId", 0);
                var sysMail = dataApi.SysEamil.findById(mailId);
                var mail = {
                    title: sysMail.title,
                    info: sysMail.text,
                    sender: sysMail.name,
                    drop: sysMail.dropId,
                    infoParams: JSON.stringify([{
                        type: Consts.MAIL_PARAM_TYPE.TRUE_VALUE,
                        value: player.playername
                    }, {type: Consts.MAIL_PARAM_TYPE.TRUE_VALUE, value: friendAgreeCnt+1}])
                };
                friend.friendPersonMgr.setAgreeCnt(friendAgreeCnt + 1);
                pomelo.app.rpc.world.mailRemote.CreateMailNew.toServer("*", msg.playerId, mail, function () {
                });
            }
        }
        // 好友不在线 更新数据库
        else {
            friendPersonDao.getByPlayerId(msg.playerId,function (err,res) {
                if (res[0].agreeCnt < maxAssistDrewCnt) {
                    var mailId = dataUtils.getOptionValue("AddHelpFriendMailId", 0);
                    var sysMail = dataApi.SysEamil.findById(mailId);
                    var mail = {
                        title: sysMail.title,
                        info: sysMail.text,
                        sender: sysMail.name,
                        drop: sysMail.dropId,
                        infoParams: JSON.stringify([{
                            type: Consts.MAIL_PARAM_TYPE.TRUE_VALUE,
                            value: player.playername
                        }, {type: Consts.MAIL_PARAM_TYPE.TRUE_VALUE, value: res[0].agreeCnt+1}])
                    };
                    friendPersonDao.updateAgreeCnt(msg.playerId,res[0].agreeCnt+1,function () {

                    });
                    pomelo.app.rpc.world.mailRemote.CreateMailNew.toServer("*", msg.playerId, mail, function () {
                    });
                }
            });
        }

        next(null, {code: code, isSendMail: isSend});
    });
}

/**
 * 拒绝好友请求
 * @param msg
 * @param session
 * @param next
 */
pro.refuseRequest = function (msg, session , next){
    var self = this;
    var player =  area.getPlayer(session.get('playerId'));
    self.app.rpc.world.friendsRemote.refuseRequest(session,player.id,msg.playerId,function(err,code){
        next(null,{code:code});
    });
}

/**
 * 添加黑名单
 * @param msg
 * @param session
 * @param next
 */
pro.addBadFriend = function (msg, session , next){
    var self = this;
    var player =  area.getPlayer(session.get('playerId'));
    self.app.rpc.world.friendsRemote.addBadFriend(session,player.id,msg.playerId,function(err,code){
        next(null,{code:code});
    });
}

/**
 * 解除黑名单
 * @param msg
 * @param session
 * @param next
 */
pro.removeBadFriend = function(msg, session , next){
    var self = this;
    var player =  area.getPlayer(session.get('playerId'));
    self.app.rpc.world.friendsRemote.removeBadFriend(session,player.id,msg.playerId,function(err,code){
        next(null,{code:code});
    });
}

/**
 * 删除好友请求
 * @param msg
 * @param session
 * @param next
 */
pro.removeFriend = function (msg, session , next){
    var self = this;
    var player =  area.getPlayer(session.get('playerId'));
    var cnt = player.friendPersonMgr.getFriendRemoveCnt();
    if(cnt>5)
        return next(null,{code:Code.WORLD.FRIEND_REMOVE_LACK_CNT});
    self.app.rpc.world.friendsRemote.removeFriend(session,player.id,msg.playerId,function(err,code){
        if(code === Code.OK){
            player.friendPersonMgr.setFriendRemoveCnt(cnt+1);
        }
        next(null,{code:code});
    });
}