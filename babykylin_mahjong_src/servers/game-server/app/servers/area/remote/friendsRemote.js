/**
 * Created by kilua on 2016/7/23 0023.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts'),
    dataApi = require('../../../util/dataApi'),
    dropUtils = require('../../../domain/area/dropUtils');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

pro.savePlayer = function(data,cb){
    this.app.get('sync').exec('friendsSync.save',  [data.playerId].join('_'), data);
    cb();
}

// pro.addEnergy = function(args, cb){
//     var playerId = args.playerId,
//         curPlayer = area.getPlayer(playerId);
//     logger.debug('addEnergy playerId = %s', args.playerId);
//     curPlayer.set("energy",curPlayer.energy +args.energy);
//     cb();
// }
//
// pro.getHighPower = function(args,cb){
//     var playerId = args.playerId,
//         curPlayer = area.getPlayer(playerId);
//     logger.debug('addEnergy playerId = %s', args.playerId);
//     cb(curPlayer.highPower);
// }
//
// pro.getFriendRemoveCnt = function(args,cb){
//     var playerId = args.playerId,
//         curPlayer = area.getPlayer(playerId);
//     logger.debug('addEnergy playerId = %s', args.playerId);
//     if(curPlayer.friendPersonMgr){
//         cb(curPlayer.friendPersonMgr.getFriendRemoveCnt());
//     }else{
//         cb(0);
//     }
// }
//
// pro.setFriendRemoveCnt = function(args,cb){
//     var playerId = args.playerId,
//         curPlayer = area.getPlayer(playerId);
//     logger.debug('addEnergy playerId = %s', args.playerId);
//     if(curPlayer.friendPersonMgr){
//         curPlayer.friendPersonMgr.setFriendRemoveCnt(args.cnt);
//     }
//     cb();
// }
//
// pro.getRecommendList = function(args,cb){
//     var playerId = args.playerId,
//         curPlayer = area.getPlayer(playerId);
//     logger.debug('addEnergy playerId = %s', args.playerId);
//     if(curPlayer.friendPersonMgr){
//         cb(curPlayer.friendPersonMgr.getRecommend());
//     }else{
//         cb([]);
//     }
// }
//
// pro.setRecommendList = function(args,cb){
//     var playerId = args.playerId,
//         curPlayer = area.getPlayer(playerId);
//     logger.debug('addEnergy playerId = %s', args.playerId);
//     if(curPlayer.friendPersonMgr){
//         curPlayer.friendPersonMgr.setRecommend(args.recommendList);
//     }
//     cb();
// }
//
// pro.removeRecommend = function(args,cb){
//     var playerId = args.playerId,
//         curPlayer = area.getPlayer(playerId);
//     if(curPlayer.friendPersonMgr){
//         curPlayer.friendPersonMgr.removeRecommend(args.friendId);
//     }
//     cb();
// }
//
// pro.addFriend = function(args,cb){
//     var playerId = args.playerId,
//         curPlayer = area.getPlayer(playerId);
//     curPlayer.emit("onActFriendChange",args.friendCnt);
//     cb();
// }
