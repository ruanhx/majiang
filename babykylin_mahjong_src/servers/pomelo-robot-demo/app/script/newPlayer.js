/////////////////////////////////////////////////////////////
/*
* */
try{
/*
*   program entry point.
* */

var cwd = process.cwd(),
    util = require('util'),
    crypto = require('crypto'),
    crc = require('crc');

var _ = require('underscore'),
    logger = require('log4js').getLogger('lord');

var dataUtils = require(cwd + '/app/data/dataUtils'),
    pomelo = require(cwd + '/app/script/pomelo').createInstance(),
    netHandler = require(cwd + '/app/script/netHandler'),
    Player = require(cwd + '/app/script/entity/player'),
    Barrier = require(cwd + '/app/script/battle/barrier'),
    Consts = require(cwd + '/app/script/consts'),
    dataApi = require(cwd +'/app/data/dataApi');

var envConfig = require(cwd + '/app/config/env.json'),
    config = require(cwd + '/app/config/' + envConfig.env + '/config');

pomelo.player = null;
pomelo.uid = null;
pomelo.curBarrier = null;

var START = 'start';
var END = 'end';

var ActFlagType = {
  ENTRY: 0,
  ENTER_SCENE: 1,
  CREATE_PLAYER: 2,
  MOVE: 3,
  PICK_ITEM: 4,

    endlessHandlerViewReports:5,
    endlessHandlerOpenBox:6,
    rechargeHandlerList:7,
    clientSaveHandlerLoad:8,
    activityHandlerList:9,
    statisticHandlerPlayerBehavior:10,
    clientSaveHandlerSave:11,
    guideHandlerFinish:12,
    playerHandlerCreateBarrier:13,
    playerHandlerExitBarrier:14,
    heroHandlerLevelUp:15,
    playerHandlerSetCurFightHero:16,
    playerHandlerDrawChapterStarAwards:17,
    endlessHandlerFight:18,
    endlessHandlerCommit:19,
    shopHandlerGetPageList:20,
    shopHandlerBuy:21,
    equipHandlerArm:22,
    equipHandlerRefine:23,
    playerHandlerAtkRandBoss:24,
    playerHandlerExitRandBoss:25,
    playerHandlerBuyBarrierPromote:26,
    playerHandlerUnlockChapter:27,
    heroHandlerBreakThrough:28,
    itemHandlerOpenBox:29,
    missionHandlerDrawAwards:30,
    playerHandlerWipe:31,
    snatchTreasuresHandlerSnatch:32,
    gmHandlerClearCustom:33,
    gmHandlerAddHero:34,
    gmHandlerAddItem:35,
    gmHandlerAddEquip:36,

};

/*jshint -W117*/
var monitor = function(type, name, reqId) {
    // actor 是虚拟机外传入的全局变量
    if (typeof actor !== 'undefined'){
        actor.emit(type, name, reqId);
    } else {
        console.error(Array.prototype.slice.call(arguments, 0));
    }
};

var connected = false;

var offset = (typeof actor !== 'undefined') ? actor.id : 1;

if (typeof actor !== 'undefined'){
  console.log(offset + ' ' + actor.id);
}

var curHeroId;

/*
*   接收封包处理
* */
pomelo.on('onKick', function() {
    logger.info('You have been kicked offline.');
});

pomelo.on('disconnect', function(reason) {
    logger.info('disconnect invoke!' + reason);
});

pomelo.on('barrier.evaluate', function(data){
    logger.info('barrier.evaluate %j', data.result);

    /*for(var i = 0 ; i < data.result.prizes.length ; i ++){
        if(data.result.prizes[i].itemType == 2){//如果是卡牌碎片
            var param = {};
            param.fragId = data.result.prizes[i].itemId;
            monitor(START, 'area.cardFragHandler.summon', ActFlagType.cardFragHandlerSummon);
            netHandler.summon(pomelo, param,function(retData){
                logger.info("....end %s,return data=%j", 'area.cardFragHandler.summon',retData);
                monitor(END, 'area.cardFragHandler.summon', ActFlagType.cardFragHandlerSummon);


            });
        }
    }*/
});

    var boxSlotId=0;
    var equipPosId = 0;
    pomelo.on('itemBag.update', function(data) {
        boxSlotId = data.pos;
        logger.info('itemBag.update parama = %j' ,data);
    });

    pomelo.on('equipBag.update', function(data) {
        equipPosId = data.bagData.pos;
        logger.info('equipBag.update parama = %j' ,data);
    });



var queryEntry = function(MAC, callback) {
    setTimeout(function(){
        logger.info("queryEntry begin ......offset="+offset);
        pomelo.init(config.gameServer, function() {
            netHandler.queryEntry(pomelo, MAC, function(host, port){
                pomelo.disconnect();
                callback(host, port);
            });
        });
    },offset*1000);

};

// 签名方法
function sign(user_id, android_id, secret, algorithm){
    var hash = crypto.createHash(algorithm);
    hash.update(user_id);
    hash.update(android_id);
    hash.update(secret);
    return hash.digest('hex');
}

var entry = function(host, port, MAC, pwd, interface, userData, callback) {
    _host = host;
    _port = port;
    //  _token = token;
    _MAC = MAC;
    //if (!!socket) {
    //    return;
    //}
    var state = '';
    if(interface === 'gameBoss'){
        state = sign(MAC, userData, 'Gam1b0ss.cOm', 'md5');
    }
    // 初始化socketClient
    pomelo.init({host: host, port: port, log: true}, function() {
        netHandler.entry(pomelo, MAC, pwd, state, interface, userData, callback);
    });
};

var delayExe = function(ms,cb){
    setTimeout(function(){
       cb();
    },ms);
}

var randomBossBarrierId = 0;

var enterSceneRes = function(data){
    monitor(END, 'enterScene', ActFlagType.ENTER_SCENE);
    if(data.code !== 200){
        logger.info('enterSceneRes err offset = %s, code = %s', offset, data.code);
    }else{
        logger.info('enterSceneRes ok!offset = %s, curPlayer = %j', offset, data.curPlayer);
        pomelo.player = new Player(data.curPlayer || {});
        var tempStrs = [];
        var tempEnumName = "";
        var sendIndex = 0;
        dataApi.aRobotAct.data.forEach(function(data){
            //logger.info(data.delayMS + "  "+data.protocol +"  "+data.param);
            if(data.protocol === "area.playerHandler.enterScene"){

            }else{
                tempStrs = data.protocol.split(".");
                tempEnumName = tempStrs[1]+tempStrs[2][0].toUpperCase()+tempStrs[2].slice(1);
                // if(!ActFlagType[tempEnumName]){
                //     logger.error("\n************枚举%s不存在请及时补充************\n", tempEnumName);
                // }
                //logger.error("data.delayMS = "+data.delayMS);
                delayExe(data.delayMS, function(){
                        monitor(START, data.protocol, tempEnumName);
                        netHandler.sendRequest(pomelo,data.protocol ,JSON.parse(data.param),function(retData){
                            sendIndex++;
                            logger.info("....end(%s) %s,return data=%j",sendIndex, data.protocol,retData);
                            monitor(END, data.protocol, tempEnumName);
                        });
                    }
                );
            }
        });

    }
};

//var MAC = serialRandomMAC(offset);
function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};
var MAC = config.macPrefix+(actor.id + 1), pwd = '123456';
// 查询入口服务器
queryEntry(MAC, function(host, port){
    logger.info('queryEntry ok!offset = %s, %s:%s', offset, host, port);
    var md5Encoder = crypto.createHash('md5');
    md5Encoder.update("123456");
    pwd = md5Encoder.digest('hex');
    // 连接入口服务器
    monitor(START, 'entry', ActFlagType.ENTRY);
    entry(host, port, MAC, pwd, '', '1', function(data){
        monitor(END, 'entry', ActFlagType.ENTRY);
        if(data.code === 1003){
            // need create role.
            var gender = _.random(1, 2);
            logger.info('createPlayer offset = %s, gender = %s...', offset, gender);
            var msg = {};
            msg.name=MAC;
            msg.pwd=pwd;
            msg.picId=0;
            monitor(START, 'createPlayer', ActFlagType.CREATE_PLAYER);
            netHandler.createPlayer(pomelo, msg, function(data){
                monitor(END, 'createPlayer', ActFlagType.CREATE_PLAYER);
                if(data.code !== 200){
                    console.info('createPlayer err offset = %s, code = %s', offset, data.code);
                }else{
                    console.info('createPlayer ok!offset = %s, player = %j', offset, data.player);
                    // 进入地图
                    monitor(START, 'enterScene', ActFlagType.ENTER_SCENE);
                    netHandler.enterScene(pomelo, enterSceneRes);
                }
            });
        }else{
            if(data.code !== 200){
                logger.info('entry err offset = %s, code = %s', offset, data.code);
            }else{
                logger.info('entry ok!offset = %s', offset);

                monitor(START, 'enterScene', ActFlagType.ENTER_SCENE);
                netHandler.enterScene(pomelo, enterSceneRes);
            }
        }
    });
});

var createBarrierRes = function(data){
    if(data.code === 200){
        console.log('createBarrier ok!barrier = %j', data.barrier);
        loadBarrier(data.barrier);
    }else{
        console.log('createBarrier err code = %s', data.code);
    }
};

var nextActRes = function(data){
    if(data.code !== 200){
        console.info('nextAct error code = %s', data.code);
        return;
    }
    console.info('nextAct act = %j', data.act);
    pomelo.barrier.nextAct(data.act);
};

var onActEnd = function(act){
    var barrier = this;
    if(Consts.BATCH_REPORT){
        // 临时接口调用
        //var heroStatus = barrier.appendClientCardStatus();
        //cmds.report(act.report, heroStatus, function(data){
        //    if(data.code !== 200){
        //        logger.error('report error code = %s', data.code);
        //    }else{
        //        logger.info('report ok!');
        //    }
        //});
        var actors = [];
        netHandler.verifyBattle(pomelo, actors, 1, 3, [], function(data){
            logger.info('verifyBattle code = %s!', data.code);
        });
    }
    if(act.isVictory() && barrier.hasNextAct()){
        netHandler.nextAct(pomelo, nextActRes);
    }else{
        logger.info('barrier %s maxAct = %s end', barrier.id, barrier.maxAct);
    }
};

var loadBarrier = function(barrier){
    barrier.player = pomelo.player;
    pomelo.barrier = new Barrier(barrier, pomelo);
    pomelo.barrier.on('act.end', onActEnd.bind(pomelo.barrier));
};

var exitBarrierRes = function(data){
    monitor(END, 'exitBarrier', 4);
    //pomelo.player.cardManager.clearCD();
    if(data.code !== 200){
        logger.info('exit barrier failed!');
//        return;
    }
    pomelo.barrier = null;
    logger.info('exit barrier ok!');
    //autoFight();
};

}catch(ex){
    console.log('err = %s', ex.stack);
}

