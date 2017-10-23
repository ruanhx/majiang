/////////////////////////////////////////////////////////////
/*
*   连接部分(即pomelo对象)按照当前的实现不能独立成一个模块，因为按照当前实现，独立成一个模块必然导出一个对象，这样会导致多个虚拟机
*   中的机器人使用了相同的连接对象(pomelo对象)。
* */
try{
/*
*   program entry point.
* */

var cwd = process.cwd(),
    util = require('util'),
    crypto = require('crypto');

var _ = require('underscore'),
    logger = require('log4js').getLogger('lord');

var dataUtils = require(cwd + '/app/data/dataUtils'),
    pomelo = require(cwd + '/app/script/pomelo').createInstance(),
    netHandler = require(cwd + '/app/script/netHandler'),
    Player = require(cwd + '/app/script/entity/player'),
    Barrier = require(cwd + '/app/script/battle/barrier'),
    Consts = require(cwd + '/app/script/consts');

var envConfig = require(cwd + '/app/config/env.json'),
    config = require(cwd + '/app/config/' + envConfig.env + '/config');

pomelo.player = null;
pomelo.uid = null;

var START = 'start';
var END = 'end';

var ActFlagType = {
  ENTRY: 0,
  ENTER_SCENE: 1,
  CREATE_PLAYER: 2,
  MOVE: 3,
  PICK_ITEM: 4
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

/*
*   生成机器人MAC
* */
var serialRandomMAC = function(id){
    return util.format('pomelo%s', id);
};
/*
*   接收封包处理
* */
pomelo.on('onKick', function() {
    logger.info('You have been kicked offline.');
});

pomelo.on('disconnect', function(reason) {
    logger.info('disconnect invoke!' + reason);
});

pomelo.on('player.updateProp', function(msg){
    logger.info('player.updateProp %s = %s', msg.prop, msg.value);
    //pomelo.player.set(msg.prop, msg.value);
});

pomelo.on('player.addCard', function(data){
    logger.info('addCard ok!card = %j', data.card);
});

pomelo.on('barrier.nextAct', function(data){
    logger.debug('barrier.nextAct: %j', data.act);
    if(pomelo.barrier){
        pomelo.barrier.nextAct(data.act);
    }else{
        logger.error('no barrier found!act = %j', data.act);
    }
});

var onAIRound = function(data){
    var bufEffects = data.bufEffects,
        round = data.round;
    if(pomelo.barrier){
        logger.info('# on act.AIRound data = %j', data);
        if(data.tick){
            pomelo.barrier.act.roundManager.getCurrentRound().end(data.tick);
            pomelo.barrier.act.roundManager.onTick(data.tick);
        }
        pomelo.barrier.act.processBufEffects(bufEffects);
        pomelo.barrier.act.processAIRound(round);
    }
};

var onPlayerRound = function(data){
    if(pomelo.barrier){
        pomelo.player.cardManager.updateCD();
        logger.info('# on act.playerRound data = %j', data);
        pomelo.barrier.act.processBufEffects(data.bufEffects);
    }
};

pomelo.on('act.rounds', function(data){
//    logger.info('act.rounds aiRound = %j, playerRound = %j', data.aiRound, data.playerRound);
    logger.info('data = %j', data);
    if(!!data.aiRound){
        onAIRound(data.aiRound);
    }
    if(!!data.playerRound){
        onPlayerRound(data.playerRound);
    }
});

pomelo.on('player.createBarrier', function(data){
    logger.debug('player.createBarrier barrier = %j', data.barrier);
    loadBarrier(data.barrier);
});

pomelo.on('player.updateCard', function(data){
    logger.debug('player.updateCard card.id = %s, prop = %s, value = %s', data.id, data.prop, data.value);
    if(!pomelo.player){
        return;
    }
    var cardObj = pomelo.player.cardManager.getCard(data.id);
    if(cardObj){
        cardObj[data.prop] = data.value;
    }
});

pomelo.on('buildingManager.newBuildings', function(data){
    logger.info('#buildings.newBuildings = %j', data.buildings);
});

pomelo.on('buildingManager.refresh', function(data){
    logger.info('#buildingManager.refresh building = %j', data.building);
});

pomelo.on('player.removeCard', function(data){
    logger.info('removeCard %d', data.cardId);
});

pomelo.on('PVP.stat', function(data){
    logger.info('PVP.stat totalGold = %s, totalCredit = %s', data.totalGold, data.totalCredit);
});

pomelo.on('barrier.evaluate', function(data){
    logger.info('barrier.evaluate %j', data.result);
    // 目前此客户端没做卡包掉落，暂时关闭掉落匹配
    //dropMatch(data.result);
    //autoOpenCardPkg(data.result.prizes);
    //pomelo.barrier.act.stop();
    //netHandler.exitBarrier(pomelo, exitBarrierRes);
});

pomelo.on('runningLord.update', function(data){
    logger.info('runningLord.update gameCnt = %s', data.gameCnt);
});

pomelo.on('diamondHunter.update', function(data){
    logger.info('diamondHunter.update gameCnt = %s, hunterLV = %s, hunterExp = %s, highDiamond = %s, cdStartTime = %s',
        data.gameCnt, data.hunterLV, data.hunterExp, data.highDiamond, data.cdStartTime);
});

pomelo.on('magician.update', function(data){
    logger.info('magician.update gameCnt = %s, level = %s, exp = %s, highScore = %s, cdStartTime = %s', data.gameCnt,
        data.level, data.exp, data.highScore, data.cdStartTime);
});

pomelo.on('makeFriendsReq.remove', function(data){
    logger.info('makeFriendsReq.remove playerId = %s', data.playerId);
});

pomelo.on('makeFriendsReq.add', function(data){
    logger.info('makeFriendsReq.add requests = %j', data.requests);
});

pomelo.on('friends.remove', function(data){
    logger.info('friends.remove playerId = %s', data.playerId);
});

pomelo.on('friends.add', function(data){
    logger.info('friends.add friends = %j', data.friends);
});

pomelo.on('friends.refresh', function(data){
    logger.info('friends.refresh friendId = %s, sendCount = %s, recvTotal = %s', data.friendId, data.sendCount, data.recvTotal);
});

pomelo.on('chat.push', function(data){
    logger.info('chat.push senderId = %s, senderName = %s, channel = %s, content = %s, time = %s, receiverId = %s, receiverName = %s',
        data.senderId, data.senderName, data.channel, data.content, data.time, data.receiverId, data.receiverName);
});

pomelo.on('sysMsg.push', function(data){
    logger.info('sysMsg.push channel = %s, content = %j, time = %s', data.channel, data.content, data.time);
});

pomelo.on('activity.new', function(data){
    logger.info('activity.new id = %s, detail = %j, pubTime = %s', data.id, data.detail, data.pubTime);
    //netHandler.viewAllActivities(pomelo, function(data){
    //    logger.info('viewAllActivities code = %s, activities = %j', data.code, data.activities);
    //});
});

pomelo.on('player.updateTitle', function(data){
    logger.info('player.updateTitle titleId = %s', data.titleId);
});

pomelo.on('activity.remove', function(data){
    logger.info('activity.remove id = %s', data.id);
});

pomelo.on('athletics.refreshTargets', function(data){
    logger.info('athletics.refreshTargets rank = %s, maxRank = %s, targets = %j', data.rank, data.maxRank, data.targets);
});

pomelo.on('testTower.refresh', function(data){
    logger.info('testTower.refresh process = %s', data.process);
});

pomelo.on('barrierRank.update', function(data){
    logger.info('barrierRank.update rankInfo = %j', data.rankInfo);
});

//netHandler.setNetHandler(pomelo);

var MAX_FPS = 60;
var tick = function(){
    if(!!pomelo.barrier){
        pomelo.barrier.onTick(Date.now());
    }
};

setInterval(tick, 1000 / MAX_FPS);

var queryEntry = function(MAC, callback) {
    pomelo.init(config.gameServer, function() {
        netHandler.queryEntry(pomelo, MAC, function(host, port){
            pomelo.disconnect();
            callback(host, port);
        });
    });
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

/*
*   配置卡牌
* */
var configureCards = function(player, cb){
    if(player.cardManager.getSelectCardCnt() < 1){
        logger.info('configureCards no config cards!auto config start...');
        // 未配置卡牌
        netHandler.selectCards(pomelo, player.cardManager.getRandomCards(), function(data){
            logger.info('selectCard code = %s', data.code);
            cb();
        });
    }else{
        // 已配置卡牌
        cb();
    }
};

var sample = function(list){
    var rnd = _.random(list.length - 1);
    return list[rnd];
};

var autoFight = function(){
    var player = pomelo.player;
    if(!player){
        console.log('no player.');
        return;
    }
    // 配置卡牌
    configureCards(player, function(){
        if(player.cardManager.getSelectCardCnt() < 1){
            logger.info('no card selected!');
            return;
        }
        // 从可以进入的关卡中，随机选择一个关卡攻打
        var passedBarrierIds = _.pluck(player.passedBarriers, 'barrierId');
        var enableBarrierIds = dataUtils.getEnableBarrierIds(player.level, passedBarrierIds, player.energy);
        if(enableBarrierIds.length <= 0){
            console.log('no enabled barrier found for player id = %s, level = %s, passedBarrierIds = %j, energy = %s',
                player.id, player.level, passedBarrierIds, player.energy);
            return;
        }
        //var destBarrierId = sample(enableBarrierIds);
        var destBarrierId = 13;
        console.log('autoFight start, destBarrierId = %s', destBarrierId);
        setTimeout(function(){
            //destBarrierId = 10013;
            netHandler.createBarrier(pomelo, destBarrierId, createBarrierRes);
        }, 3000);
    });
};

var enterSceneRes = function(data){
    monitor(END, 'enterScene', ActFlagType.ENTER_SCENE);
    if(data.code !== 200){
        logger.info('enterSceneRes err offset = %s, code = %s', offset, data.code);
    }else{
        logger.info('enterSceneRes ok!offset = %s, curPlayer = %j', offset, data.curPlayer);
        pomelo.player = new Player(data.curPlayer || {});
        netHandler.listEquip(pomelo, function(data){
            logger.info('listEquip code = %s', data.code);
            if(data.code === 200){
                pomelo.player.loadEquipBag(data.items);
            }

            //netHandler.getProductList(pomelo, function(data){
            //    logger.info('getProductList code = %s, productList = %j', data.code, data.productList);
            //});

            //netHandler.viewAthleticsOtherPlayer(pomelo, 1, 10000, function(data){
            //    logger.info('viewAthleticsOtherPlayer code = %s, player = %j, cards = %j', data.code, data.player, data.cards);
            //});

            //netHandler.getAthleticsRankPrize(pomelo, function(data){
            //    logger.info('getAthleticsRankPrize code = %s, diamond = %s, gold = %s, stone = %s', data.code,
            //        data.diamond, data.gold, data.stone);
            //});
            //netHandler.previewAthleticsRankPrizes(pomelo, [1, 2, 3], 12, function(data){
            //    logger.info('previewAthleticsRankPrizes code = %s, prizes = %j, dispatchTime = %s', data.code, data.prizes, data.dispatchTime);
            //});

            //netHandler.getAthleticsRankingList(pomelo, function(data){
            //    logger.info('getAthleticsRankingList code = %s, ranks = %j', data.code, data.ranks);
            //});

            //netHandler.buyAthleticsCnt(pomelo, function(data){
            //    logger.info('buyAthleticsCnt code = %s, athleticsCnt = %s, buyAthleticsCnt = %s', data.code,
            //        data.athleticsCnt, data.buyAthleticsCnt);
            //});

            //netHandler.athleticsEntry(pomelo, function(data){
            //    logger.info('athleticsEntry code = %s, rank = %s, maxRank = %s, athleticsCnt = %s, targets = %j',
            //        data.code, data.rank, data.maxRank, data.athleticsCnt, data.targets);
            //});

            //netHandler.matchAthleticsTargets(pomelo, function(data){
            //    logger.info('matchAthleticsTargets code = %s, rank = %s, maxRank = %s, targets = %j', data.code, data.rank, data.maxRank, data.targets);
            //});

            //netHandler.rmFromBlackList(pomelo, 10001, function(data){
            //    logger.info('rmFromBlackList code = %s', data.code);
            //});
            //netHandler.eraseActionLog(pomelo, 23, function(data){
            //    logger.info('eraseActionLog code = %s', data.code);
            //});
            //netHandler.saveActionLog(pomelo, {type: 1, detail: 'detail', userData1: 1, userData2: 2, userData3: 3,
            //    userData4: 4}, function(data){
            //    logger.info('saveActionLog code = %s', data.code);
            //});
            //netHandler.exchangeCardPropAndEquips(pomelo, [10000, 10002], function(data){
            //    logger.info('exchangeCardPropAndEquips code = %s, equipRefresh = %j', data.code, data.equipRefresh);
            //});

            //netHandler.addPlayerExp(pomelo, '7758520', 10000, 1000, function(data){
            //    logger.info('addPlayerExp code = %s', data.code);
            //});

            //netHandler.isActivityOpen(pomelo, 5, function(data){
            //    logger.info('isActivityOpen 5 code = %s', data.code);
            //});

            //netHandler.getServerStartTime(pomelo, function(data){
            //    var startTime = new Date();
            //    startTime.setTime(data.startTime);
            //    logger.info('getServerStartTime code = %s, startTime = %s[%s]', data.code, data.startTime, startTime);
            //});

            //netHandler.drawActivityAwards(pomelo, 5, 10, function(data){
            //    logger.info('drawActivityAwards code = %s, id = %s, condParam = %s, drops = %j', data.code, data.id, data.condParam,
            //    data.drops);
            //});

            //netHandler.viewActivityDetail(pomelo, 1, function(data){
            //    logger.info('viewActivityDetail code = %s, id = %s, detail = %j', data.code, data.id, data.detail);
            //});

            //netHandler.viewAllActivities(pomelo, function(data){
            //    logger.info('viewAllActivities code = %s, activities = %j', data.code, data.activities);
            //});

            //netHandler.isActivityOpen(pomelo, 7, function(data){
            //    logger.info('isActivityOpen code = %s', data.code);
            //});

            //netHandler.snExchange(pomelo, '', "6", function(data){
            //    logger.info('snExchange code = %s, drops = %j', data.code, data.drops);
            //});

            //setTimeout(function(){
            //    netHandler.upgradeCard(pomelo, 1, function(data){
            //        logger.info('upgradeCard code = %s', data.code);
            //    });
            //}, 5000);
            //netHandler.getCardPropsById(pomelo, [10000], function(data){
            //    logger.info('getCardPropsById code = %s, cardProps = %j', data.code, data.cardProps);
            //});

            //netHandler.blockPlayer(pomelo, 10000, function(data){
            //    logger.info('blockPlayer code = %s', data.code);
            //});
            //netHandler.sendChat(pomelo, 1, '', '123', function(data){
            //    logger.info('sendChat code = %s', data.code);
            //});
            //netHandler.suggestFriends(pomelo, function(data){
            //    logger.info('suggestFriends code = %s, players = %j', data.code, data.players);
            //    setTimeout(function(){
            //        netHandler.suggestFriends(pomelo, function(data){
            //            logger.info('suggestFriends code = %s, players = %j', data.code, data.players);
            //        });
            //
            //        setTimeout(function(){
            //            netHandler.suggestFriends(pomelo, function(data){
            //                logger.info('suggestFriends code = %s, players = %j', data.code, data.players);
            //            });
            //        }, 6 * 1000);
            //    }, 5 * 1000);
            //});
            //netHandler.removeFriend(pomelo, 10000, function(data){
            //   logger.info('removeFriend code = %s', data.code);
            //});
            //netHandler.drawEnergy(pomelo, 10000, function(data){
            //    logger.info('drawEnergy code = %s, drawCnt = %s', data.code, data.drawCnt);
            //});
            //netHandler.sendEnergy(pomelo, 10000, function(data){
            //    logger.info('sendEnergy code = %s', data.code);
            //});
            //netHandler.confirmFriendReq(pomelo, 2, 10001, function(data){
            //    logger.info('code = %s', data.code);
            //});
            //netHandler.getBlackList(pomelo, function(data){
            //    logger.info('getBlackList code = %s, blackList = %j', data.code, data.blackList);
            //});

            //netHandler.findFriendTarget(pomelo, '10001', function(data){
            //    logger.info('findFriendTarget code = %s, players = %j', data.code, data.players);
            //});

            //netHandler.makeFriendsReq(pomelo, 10000, function(data){
            //    logger.info('makeFriendsReq code = %s', data.code);
            //});
            //netHandler.getFriendRequests(pomelo, function(data){
            //    logger.info('getFriendRequests code = %s, requests = %j', data.code, data.requests);
            //});
            //netHandler.getFriends(pomelo, function(data){
            //    logger.info('getFriends code = %s, friends = %j', data.code, data.friends);
            //});
            //netHandler.drawFriendship(pomelo, function(data){
            //    logger.info('drawFriendship code = %s, totalFriendship = %s', data.code, data.totalFriendship);
            //});
            //netHandler.testWorld(pomelo, function(data){
            //    logger.info('testWorld code = %s', data.code);
            //});
            //netHandler.feedCard(pomelo, 10000, function(data){
            //    logger.debug('feedCard code = %s, cardId = %s, level = %s, exp = %s', data.code, data.cardId, data.level, data.exp);
            //});

            //netHandler.wipeOut(pomelo, 1, function(data){
            //    logger.info('wipeOut code = %s, prizes = %j, sweepItemCount = %s', data.code, data.prizes, data.sweepItemCount);
            //});

            //setTimeout(function(){
            //    netHandler.test(pomelo, 10000, function(data){
            //        logger.info('test code = %s', data.code);
            //    });
            //}, 3 * 1000);

            //netHandler.drawOnlineBox(pomelo, function(data){
            //    logger.info('drawOnlineBox code = %s, drops = %j', data.code, data.drops);
            //});
            //netHandler.enterRunningLord(pomelo, function(data){
            //    logger.info('enterRunningLord code = %s, ranks = %j, runningLord = %j', data.code, data.ranks, data.runningLord);
            //});

            netHandler.getBuildings(pomelo, function(data){
                logger.info('getBuildings code = %s, crazyMiner = %j, diamondHunter = %j, runningLord = %j, magician = %j',
                    data.code, data.crazyMiner, data.diamondHunter, data.runningLord, data.magician);

                //netHandler.getBarrierRankList(pomelo, 2, 1, function(data){
                //    logger.info('getBarrierRankList code = %s, rankList = %j', data.code, data.rankList);
                //});

                //netHandler.getBarrierRankZone(pomelo, function(data){
                //    logger.info('getBarrierRankZone code = %s, first = %j, last = %j', data.code, data.first, data.last);
                //});
                //netHandler.enterTestTower(pomelo, function(data){
                //    logger.info('enterExplore code = %s, testTower = %j', data.code, data.testTower);
                //
                //    //netHandler.reviveTestTowerCard(pomelo, 10001, 20101, function(data){
                //    //    logger.info('reviveTestTowerCard code = %s, friendId = %s, groupId = %s, used = %s', data.code,
                //    //        data.friendId, data.groupId, data.used);
                //    //});
                //    //netHandler.buyBread(pomelo, function(data){
                //    //    logger.info('buyBread code = %s, bread = %s, buyBreadCnt = %s', data.code, data.bread, data.buyBreadCnt);
                //    //});
                //    //netHandler.resetTestTower(pomelo, function(data){
                //    //    logger.info('resetTestTower code = %s', data.code);
                //    //
                //    //    netHandler.enterTestTower(pomelo, function(data){
                //    //        logger.info('$2 enterExplore code = %s, testTower = %j', data.code, data.testTower);
                //    //    });
                //    //});
                //    //netHandler.getFriendCards(pomelo, function(data){
                //    //    logger.info('getFriendCards code = %s, cardList = %j', data.code, data.cardList);
                //    //});
                //    netHandler.configureTestTower(pomelo, [{playerId: 10000, cardId: 92010101, pos: 1}, {playerId: 10000,
                //    cardId: 93010101, pos: 2}], function(data){
                //        logger.info('configureTestTower code = %s', data.code);
                //
                //        netHandler.exploreFight(pomelo, function(data){
                //            logger.info('exploreFight code = %s, barrier = %j', data.code, data.barrier);
                //
                //            netHandler.verifyBattle(pomelo, [], 1, 0, [], function(data){
                //                logger.info('verifyBattle code = %s', data.code);
                //
                //                netHandler.exitBarrier(pomelo, function(data){
                //
                //                    //netHandler.selectDrops(pomelo, 0, function(data){
                //                    //    logger.info('selectDrops code = %s, drops = %j, removeBuffs = %j', data.code, data.drops,
                //                    //        data.removeBuffs);
                //                    //});
                //                });
                //            });
                //        });
                //    });
                //    //netHandler.exploreTurn(pomelo, 2, function(data){
                //    //    logger.info('exploreTurn code = %s, testTower = %j', data.code, data.testTower);
                //    //});
                //    //netHandler.exploreForward(pomelo, function(data){
                //    //    logger.info('exploreForward code = %s, bread = %s, eventInfos = %j, leftTransmitCost = %s, rightTransmitCost = %s',
                //    //        data.code, data.bread, data.eventInfos, data.leftTransmitCost, data.rightTransmitCost);
                //    ////    //netHandler.triggerCurrentEvent(pomelo, function(data){
                //    ////    //    logger.info('triggerCurrentEvent code %s, result = %j',
                //    ////    //        data.code, data.result);
                //    ////    //});
                //    //});
                //    //netHandler.triggerCurrentEvent(pomelo, function(data){
                //    //    logger.info('triggerCurrentEvent code %s, result = %j', data.code, data.result);
                //    //});
                //});
                //netHandler.buildingCollect(pomelo, 10000, function(data){
                //    logger.info('buildingCollect code = %s, count = %s', data.code, data.count);
                //});
            //
            //    //netHandler.commitMagician(pomelo, 7, 2, 29, function(data){
            //    //    logger.info('commitMagician code = %s, ranks = %j, magician = %j', data.code, data.ranks, data.magician);
            //    //});
            //
            //    //netHandler.levelUpMagician(pomelo, function(data){
            //    //    logger.info('levelUpMagician code = %s, level = %s, exp = %s', data.code, data.level, data.exp);
            //    //});
            //
            //    //netHandler.enterMagician(pomelo, function(data){
            //    //    logger.info('enterMagician code = %s, ranks = %j', data.code, data.ranks);
            //    //});
            //
            //    //netHandler.enterDiamondHunter(pomelo, function(data){
            //    //    logger.info('enterDiamondHunter code = %s, ranks = %j', data.code, data.ranks);
            //    //});
            //
            //    //netHandler.commitDiamondHunter(pomelo, 100, 1000, 2, function(data){
            //    //    logger.debug('commitDiamondHunter code = %s, ranks = %j, diamondHunter = %j', data.code, data.ranks,
            //    //        data.diamondHunter);
            //    //});
            //
            //    //netHandler.levelUpHunter(pomelo, function(data){
            //    //    logger.info('levelUpHunter code = %s, level = %s, exp = %s', data.code, data.level, data.exp);
            //    //});
            //
            //    //netHandler.commitRunningLord(pomelo, 1, function(data){
            //    //    logger.info('commitRunningLord code = %s, runningLord = %j', data.code, data.runningLord);
            //    //});
            ////
            ////    //netHandler.levelUpMiner(pomelo, function(data){
            ////    //    logger.info('levelUpMiner code = %s, minerLV = %s, minerExp = %s', data.code, data.minerLV, data.minerExp);
            ////    //});
            ////    //
            ////    //netHandler.enterCrazyMiner(pomelo, function(data){
            ////    //    console.info('enterCrazyMiner code = %s, ranks = %j', data.code, data.ranks);
            ////    netHandler.commitCrazyMiner(pomelo, 9999999, 305, 99, 13, function(data){
            ////        console.info('commitCrazyMiner code = %s, ranks = %j, crazyMiner = %j', data.code, data.ranks, data.crazyMiner);
            ////    });
            //    //});
            ////
            //    netHandler.levelUpBuilding(pomelo, 10000, function(data){
            //        logger.info('levelUpBuilding code = %s, levelUpPrize = %s', data.code, data.levelUpPrize);
            //    });
            });

            //netHandler.loadClientSaveDatas(pomelo, [1, 2], function(data){
            //    logger.info('loadClientSaveDatas code = %s, saveDatas = %j', data.code, data.saveDatas);
            //});

            //netHandler.getSpecialCard(pomelo, function(data){
            //    if(data.code === 200){
            //        logger.info('getSpecialCard ok!');
            //    }else{
            //        logger.error('getSpecialCard fail!code = %s', data.code);
            //    }
            //});
            //netHandler.changeHeadPic(pomelo, 0, function(data){
            //    if(data.code === 200) {
            //        logger.info('changeHeadPic ok!');
            //    }else{
            //        logger.info('changeHeadPic err!code = %s', data.code);
            //    }
            //});
            //autoFight();

            //netHandler.selectCards(pomelo, [{id: 10002, pos: 1}], function(data){
            //    logger.info('selectCard code = %s', data.code);
            //});

            //netHandler.resetBarrierAtkCnt(pomelo, 1, function(data){
            //    logger.info('resetBarrierAtkCnt code = %s', data.code);
            //});

            //netHandler.getTargetInfo(pomelo, 1, function(data){
            //    logger.info('getTargetInfo code = %s, target = %j', data.code, data.target);
            //    netHandler.challenge(pomelo, function(data){
            //        logger.info('challenge code = %s, barrier = %j', data.code, data.barrier);
            //    });
            //});

            //netHandler.challenge(pomelo, function(data){
            //    logger.info('challenge code = %s', data.code);
            //});

            //netHandler.match(pomelo, function(data){
            //    logger.info('match code = %s, targets = %j', data.code, data.targets);
            //});

            //netHandler.enterPVP(pomelo, function (data) {
            //    logger.info('entry code = %s, targets = %j, prize = %j, PVPEnableTime = %s, PVPCnt = %s', data.code,
            //        data.targets, data.prize, data.PVPEnableTime, data.PVPCnt);
            //    netHandler.PVPChallenge(pomelo, 1, function(data){
            //        console.log('PVPChallenge code = %s, barrier = %j, targets = %j', data.code, data.barrier, data.targets);
            //    });
            //});

            //netHandler.athleticsRevanche(pomelo, 10004, function(data){
            //    logger.info('athleticsRevanche code = %s', data.code);
            //
            //    netHandler.test(pomelo, {victory: true}, function(data){
            //        logger.info('test code = %s', data.code);
            //    });
            //});

            //netHandler.enterAthletics(pomelo, function(data){
            //    logger.info('enterAthletics code = %s, targets = %j, rank = %s, maxRank = %s, athleticsCnt = %s, hasNewDefRec = %s',
            //        data.code, data.targets, data.rank, data.maxRank, data.athleticsCnt, data.hasNewDefRec);
            //    //netHandler.viewAthleticsDefenceHistory(pomelo, function(data){
            //    //    logger.info('viewAthleticsDefenceHistory code = %s, histories = %j', data.code, data.histories);
            //    //});
            //    //netHandler.athleticsChallenge(pomelo, 3, function(data){
            //    //    console.log('athleticsChallenge code = %s, barrier = %j', data.code, data.barrier);
            //    //    netHandler.test(pomelo, {victory: true}, function(data){
            //    //        logger.info('test code = %s', data.code);
            //    //    });
            //    //});
            //});

            //netHandler.getAthleticsRankInfo(pomelo, function(data){
            //    logger.info('getAthleticsRankInfo code = %s, rank = %s, maxRank = %s', data.code, data.rank, data.maxRank);
            //});

            //netHandler.altarSummon(pomelo, 1, 1, function(data){
            //    console.info('altarSummon code = %s', data.code);
            //});
        });
    }
};

//var MAC = serialRandomMAC(offset);
var MAC = '123465', pwd = '123456';
// 查询入口服务器
queryEntry(MAC, function(host, port){
    logger.info('queryEntry ok!offset = %s, %s:%s', offset, host, port);
    var md5Encoder = crypto.createHash('md5');
    md5Encoder.update(pwd);
    pwd = md5Encoder.digest('hex');
    // 连接入口服务器
    monitor(START, 'entry', ActFlagType.ENTRY);
    entry(host, port, MAC, pwd, '', 'android_id', function(data){
        monitor(END, 'entry', ActFlagType.ENTRY);
        if(data.code === 1003){
            // need create role.
            var gender = _.random(1, 2);
            logger.info('createPlayer offset = %s, gender = %s...', offset, gender);
            monitor(START, 'createPlayer', ActFlagType.CREATE_PLAYER);
            netHandler.createPlayer(pomelo, gender, function(data){
                monitor(END, 'createPlayer', ActFlagType.CREATE_PLAYER);
                if(data.code !== 200){
                    logger.info('createPlayer err offset = %s, code = %s', offset, data.code);
                }else{
                    logger.info('createPlayer ok!offset = %s, player = %j', offset, data.player);
                    // 进入地图
                    netHandler.enterScene(pomelo, enterSceneRes);
                }
            });
        }else{
            if(data.code !== 200){
                logger.info('entry err offset = %s, code = %s', offset, data.code);
            }else{
                logger.info('entry ok!offset = %s', offset);
                // 进入地图
                monitor(START, 'enterScene', ActFlagType.ENTER_SCENE);
                //netHandler.isActivityOpen(pomelo, 7, function(data){
                //    logger.info('isActivityOpen code = %s', data.code);
                //});
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

