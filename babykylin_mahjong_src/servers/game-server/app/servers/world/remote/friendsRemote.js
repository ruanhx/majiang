/**
 * Created by cxy on 2015-05-26.
 */

var pomelo = require('pomelo'),
    logger = require('pomelo-logger').getLogger(__filename),
    dataUtils = require('../../../util/dataUtils'),
    Consts = require('../../../consts/consts'),
    Code = require('../../../../shared/code'),
    playerManager = require('../../../domain/world/playerManager'),
    playerMiniData = require('../../../domain/world/playerMiniData'),
    scoreRankingList = require('../../../domain/world/scoreRankingList'),
    mailRemote = require('./mailRemote'),
    dropUtils = require('../../../domain/area/dropUtils'),
    common = require('../../../util/utils'),
    _ = require('underscore'),
    friendsMgr = require('../../../domain/world/friendsMgr').get();

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;


pro.getFriendIdList = function (playerId, next) {
    next(null,friendsMgr.getFriendIds(playerId)) ;
};

pro.playerInFriendRequest = function(playerId,friendId,next){
    next(null,friendsMgr.playerInFriendRequest(playerId,friendId)) ;
}

pro.getInfoList = function (playerId, type,highPower, next) {
    friendsMgr.getInfoList(playerId,type,highPower,function(list){
        next(null,list);
    }) ;
};

pro.sendEnergy = function(playerId, friendIdList,next){
    friendsMgr.sendEnergy(playerId, friendIdList,function(code){
        _.each(friendIdList,function(fid){
            playerManager.get().pushMsgToPlayer(fid,"friends.new",{type:Consts.FRIEND_TYPE.FRIEND});
        })
        next(null,code);
    });
}

pro.acceptEnergy = function(playerId,friendIdList,next){
    friendsMgr.acceptEnergy(playerId, friendIdList,function(code,rsList){
        next(null,code,rsList);
    });
}

pro.sendRequest = function(playerId,friendId,next){
    friendsMgr.sendRequest(playerId, friendId,function(rs){
        //logger.debug("remote sendRequest %j",rs);
        if(Code.OK === rs.code){
            playerManager.get().pushMsgToPlayer(friendId,"friends.new",{type:Consts.FRIEND_TYPE.REQUEST});
            //logger.debug("通知好友%s,有申请消息！");
        }
        next(null,rs);
    });
}

pro.refuseRequest = function(playerId,friendId,next){
    friendsMgr.refuseRequest(playerId, friendId,function(code){
        next(null,code);
    });
}

pro.agreeRequest = function(playerId,friendId,next){
    friendsMgr.agreeRequest(playerId, friendId,function(code){
        var friendName = "";
        if(code === Code.OK){
            playerManager.get().pushMsgToPlayer(playerId,"friends.new",{type:Consts.FRIEND_TYPE.FRIEND});
            playerManager.get().pushMsgToPlayer(friendId,"friends.new",{type:Consts.FRIEND_TYPE.FRIEND});
            // 发送助战信息
            var me = playerMiniData.getInstance().getPlayerById(playerId);
            var meClintInfo = getAssistFightInfo(me);

            var friend = playerMiniData.getInstance().getPlayerById(friendId);
            var friendClintInfo = getAssistFightInfo(friend);
            friendName = friend.playername;
            playerManager.get().pushMsgToPlayer(playerId,"assistFight.push",{info:friendClintInfo});
            playerManager.get().pushMsgToPlayer(friendId,"assistFight.push",{info:meClintInfo});
        }
        next(null,code,friendName);
    });
}
function getAssistFightInfo(playerMiniData) {
    var clientInfo = {};
    clientInfo.playername = playerMiniData.playername;
    clientInfo.headPicId = playerMiniData.headPicId;
    clientInfo.heroId = playerMiniData.heroId;
    clientInfo.highPower = playerMiniData.highPower;
    clientInfo.price = 0;
    clientInfo.playerId = playerMiniData.playerId;
    return clientInfo;
};

pro.addBadFriend = function(playerId,friendId,next){
    friendsMgr.addBadFriend(playerId,friendId,function(code){
        next(null,code);
    })
}

pro.removeFriend = function(playerId,friendId,next){
    friendsMgr.removeFriend(playerId,friendId,function(code){
        next(null,code);
    })
}

pro.removeBadFriend = function(playerId,friendId,next){
    friendsMgr.removeBadFriend(playerId,friendId,function(code){
        next(null,code);
    })
}

pro.getBlackList = function(playerId,next){
    next(null,friendsMgr.getBlackList(playerId));
}
/*
 *   默认排序函数，按id升序排列
 * */
function sortBy(a, b) {
    if (a.lastWeekHighScore === b.lastWeekHighScore) {
        return a.playerId - b.playerId;
    }
    return b.lastWeekHighScore - a.lastWeekHighScore;
}
pro.sendFriendRankAward = function (playerId,lastWeekHighScore, next) {
    friendsMgr.getInfoList(playerId,1,0,function(list){
        list.push({playerId:playerId,lastWeekHighScore:lastWeekHighScore});
        list.sort(sortBy);
        var awardList = dataUtils.getOptionList("Endless_FriendsRankReward",'#');
        for(var i=0;i<awardList.length;i++){
            if(!list[i]||list[i].lastWeekHighScore==0){
                continue;
            }
            if(list[i].playerId == playerId){
                var mr = new mailRemote(pomelo.app);
                sysMail = dataApi.SysEamil.findById(awardList[i]);
                // logger.debug("@@@@@ sysMail：%j %s",sysMail,playerId);
                if (sysMail) {
                    //发送邮件
                    mail = {title: sysMail.title, info: sysMail.text, sender: sysMail.name, drop: sysMail.dropId};
                    mr.CreateMailNew(playerId, mail, function (err) {
                        next(null,Code.OK);
                    });
                }
            }

        }

    }) ;
};

