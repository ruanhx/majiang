/**
 * Created by Administrator on 2017/10/26 0026.
 */
var pomelo = require('pomelo'),
    async = require('async'),
    logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var area = require('../../../domain/area/area'),
    roomMgr = require('../../../domain/area/roomMgr'),
    Room = require('../../../domain/entity/room'),
    Code = require('../../../../shared/code'),
    dataApi = require('../../../util/dataApi'),
    roomDao = require('../../../dao/roomDao'),
    dataUtils = require('../../../util/dataUtils'),
    utils = require('../../../util/utils'),
    dropUtils = require('../../../domain/area/dropUtils'),
    consts = require('../../../consts/consts'),
    flow = require('../../../consts/flow'),
    publisher = require('../../../domain/activity/publisher'),
    Utils =  require('../../../util/utils'),
    common = require('../../../util/common');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

pro.createRoom = function (msg, session, next) {
    logger.debug("createRoom %j",msg);
    var player = area.getPlayer(session.get('playerId'));
    if(player.gem <=0){
        return next(null,{code:Code.FAIL});
    }
    // 是否已经创建过房间
    if(roomMgr.getInstance().getRoomByOwner(session.get('playerId'))){
        return next(null,{code:Code.ROOM.ROOM_IS_EXIST});
    }
    // 创建新房间
    var member = [];
    roomDao.roomInsert({ownerId:session.get('playerId'),  di:msg.di, gui:msg.gui, maxCnt:msg.maxCnt, member:JSON.stringify(member), createTime:Date.now()},function (err,roomId) {
        if(err||!roomId){
            return next(null,{code:300});
        }
        var room = new Room({id:roomId,ownerId:session.get('playerId'),  di:msg.di, gui:msg.gui, maxCnt:msg.maxCnt, member:[], createTime:Date.now()})
        roomMgr.getInstance().setRoomById(room);
        player.set('gem',player.gem -1);
        player.set('roomId',roomId);
        player.pushMsg('login_result',{});
        return next(null,{code:Code.OK,roomId:roomId});
    });
};

pro.enterRoom = function (msg, session, next) {
    var player = area.getPlayer(session.get('playerId'));
    var room = roomMgr.getInstance().getRoomById(msg.id);
    // 房间不存在
    if(!room){
        return next(null,{code:Code.ROOM.ROOM_IS_NOT_EXIST});
    }

    room.enter(session.get('playerId'),player.playername);
    return next(null,{code:Code.OK});
};

pro.getRoomInfo = function (msg, session, next) {
    var player = area.getPlayer(session.get('playerId'));
    var room = roomMgr.getInstance().getRoomById(msg.id);
    // 房间不存在
    if(!room){
        return next(null,{code:Code.ROOM.ROOM_IS_NOT_EXIST});
    }
    return next(null,{code:Code.OK,info:room.getRoomClientInfo()});
};

pro.setReady = function (msg, session, next) {
    var player = area.getPlayer(session.get('playerId'));
    var room = roomMgr.getInstance().getRoomById(msg.id);
    // 房间不存在
    if(!room){
        return next(null,{code:Code.ROOM.ROOM_IS_NOT_EXIST});
    }
    room.setReady(session.get('playerId'));
    return next(null,{code:Code.OK});
};