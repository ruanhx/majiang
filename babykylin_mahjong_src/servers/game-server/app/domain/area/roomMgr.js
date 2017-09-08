var logger = require('pomelo-logger').getLogger('bearcat-treasures', 'Player');
var bearcat = require('bearcat');
var util = require('util');

/**
 * Initialize a new 'Player' with the given 'opts'.
 * Player inherits Character
 *
 * @param {Object} opts
 * @api public
 */

function RoomMgr(opts) {
    this.rooms = {};
    this.creatingRooms = {};

    this.userLocation = {};
    var totalRooms = 0;

    var DI_FEN = [1,2,5];
    var MAX_FAN = [3,4,5];
    var JU_SHU = [4,8];
    var JU_SHU_COST = [2,3];
}
var pro = RoomMgr.prototype;

pro.init = function() {
  this.type = this.consts.EntityType.PLAYER;
  var Entity = bearcat.getFunction('entity');
  Entity.call(this, this.opts);
  this._init();
};
pro.constructRoomFromDb = function (dbdata){
    var roomInfo = {
        uuid:dbdata.uuid,
        id:dbdata.id,
        numOfGames:dbdata.num_of_turns,
        createTime:dbdata.create_time,
        nextButton:dbdata.next_button,
        seats:new Array(4),
        conf:JSON.parse(dbdata.base_info)
    };


    if(roomInfo.conf.type == "xlch"){
        roomInfo.gameMgr = require("./gamemgr_xlch");
    }
    else{
        roomInfo.gameMgr = require("./gamemgr_xzdd");
    }
    var roomId = roomInfo.id;

    for(var i = 0; i < 4; ++i){
        var s = roomInfo.seats[i] = {};
        s.userId = dbdata["user_id" + i];
        s.score = dbdata["user_score" + i];
        s.name = dbdata["user_name" + i];
        s.ready = false;
        s.seatIndex = i;
        s.numZiMo = 0;
        s.numJiePao = 0;
        s.numDianPao = 0;
        s.numAnGang = 0;
        s.numMingGang = 0;
        s.numChaJiao = 0;

        if(s.userId > 0){
            this.userLocation[s.userId] = {
                roomId:roomId,
                seatIndex:i
            };
        }
    }
    this.rooms[roomId] = roomInfo;
    totalRooms++;
    return roomInfo;
};

pro.generateRoomId =function (){
    var roomId = "";
    for(var i = 0; i < 6; ++i){
        roomId += Math.floor(Math.random()*10);
    }
    return roomId;
}

/**
 * Parse String to json.
 * It covers object' method
 *
 * @param {String} data
 * @return {Object}
 * @api public
 */
pro.toJSON = function() {
  var r = this._toJSON();

  r['id'] = this.id;
  r['type'] = this.type;
  r['name'] = this.name;
  r['walkSpeed'] = this.walkSpeed;
  r['score'] = this.score;

  return r;
};

pro.createRoom = function(creator,roomConf,gems,ip,port,callback){
    if(
        roomConf.type == null
        || roomConf.difen == null
        || roomConf.zimo == null
        || roomConf.jiangdui == null
        || roomConf.huansanzhang == null
        || roomConf.zuidafanshu == null
        || roomConf.jushuxuanze == null
        || roomConf.dianganghua == null
        || roomConf.menqing == null
        || roomConf.tiandihu == null){
        callback(1,null);
        return;
    }

    if(roomConf.difen < 0 || roomConf.difen > DI_FEN.length){
        callback(1,null);
        return;
    }

    if(roomConf.zimo < 0 || roomConf.zimo > 2){
        callback(1,null);
        return;
    }

    if(roomConf.zuidafanshu < 0 || roomConf.zuidafanshu > MAX_FAN.length){
        callback(1,null);
        return;
    }

    if(roomConf.jushuxuanze < 0 || roomConf.jushuxuanze > JU_SHU.length){
        callback(1,null);
        return;
    }

    var cost = JU_SHU_COST[roomConf.jushuxuanze];
    if(cost > gems){
        callback(2222,null);
        return;
    }

    var fnCreate = function(){
        var roomId = generateRoomId();
        if(this.rooms[roomId] != null || this.creatingRooms[roomId] != null){
            fnCreate();
        }
        else{
            this.creatingRooms[roomId] = true;
            db.is_room_exist(roomId, function(ret) {

                if(ret){
                    delete this.creatingRooms[roomId];
                    fnCreate();
                }
                else{
                    var createTime = Math.ceil(Date.now()/1000);
                    var roomInfo = {
                        uuid:"",
                        id:roomId,
                        numOfGames:0,
                        createTime:createTime,
                        nextButton:0,
                        seats:[],
                        conf:{
                            type:roomConf.type,
                            baseScore:DI_FEN[roomConf.difen],
                            zimo:roomConf.zimo,
                            jiangdui:roomConf.jiangdui,
                            hsz:roomConf.huansanzhang,
                            dianganghua:parseInt(roomConf.dianganghua),
                            menqing:roomConf.menqing,
                            tiandihu:roomConf.tiandihu,
                            maxFan:MAX_FAN[roomConf.zuidafanshu],
                            maxGames:JU_SHU[roomConf.jushuxuanze],
                            creator:creator,
                        }
                    };

                    if(roomConf.type == "xlch"){
                        roomInfo.gameMgr = require("./gamemgr_xlch");
                    }
                    else{
                        roomInfo.gameMgr = require("./gamemgr_xzdd");
                    }
                    console.log(roomInfo.conf);

                    for(var i = 0; i < 4; ++i){
                        roomInfo.seats.push({
                            userId:0,
                            score:0,
                            name:"",
                            ready:false,
                            seatIndex:i,
                            numZiMo:0,
                            numJiePao:0,
                            numDianPao:0,
                            numAnGang:0,
                            numMingGang:0,
                            numChaJiao:0,
                        });
                    }


                    //写入数据库
                    var conf = roomInfo.conf;
                    db.create_room(roomInfo.id,roomInfo.conf,ip,port,createTime,function(uuid){
                        delete this.creatingRooms[roomId];
                        if(uuid != null){
                            roomInfo.uuid = uuid;
                            console.log(uuid);
                            this.rooms[roomId] = roomInfo;
                            totalRooms++;
                            callback(0,roomId);
                        }
                        else{
                            callback(3,null);
                        }
                    });
                }
            });
        }
    }

    fnCreate();
};



module.exports = {
  id: "roomMgr",
  func: RoomMgr,
  scope: "prototype",
  init: "init",
  args: [{
    name: "opts",
    type: "Object"
  }],
  props: [{
    name: "consts",
    ref: "consts"
  }]
}