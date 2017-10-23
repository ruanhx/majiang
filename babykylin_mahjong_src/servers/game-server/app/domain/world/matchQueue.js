/**
 * Created by kilua on 2016/7/25 0025.
 */

var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo');

var playerManager = require('./playerManager'),
    matchTarget = require('./matchTarget'),
    scoreRankingList = require('../world/scoreRankingList'),
    endlessMgr = require('../world/endlessMgr'),
    dataUtils = require('../../util/dataUtils'),
    dataApi = require('../../util/dataApi'),
    Code = require('../../../shared/code'),
    ai = require('./ai');

var WaitPlayer = function (player, opts, queue) {
    EventEmitter.call(this);

    this.id = player.id;
    this.frontendId = player.frontendId;
    this.player = player;
    opts = opts || {};
    this.name = opts.name;
    this.fightHeroId = opts.fightHeroId;
    this.fightPetId = opts.fightPetId;
    this.power = opts.power;
    this.scorePer = opts.scorePer;
    this.maxWin = opts.maxWin;
    this.maxLose = opts.maxLose;
    this.curMatchPercent = queue.sectionPercents[0];
    this.boxDouble = opts.boxDouble;

    var self = this, i = 0;

    function changePercent() {
        clearTimeout(self.changePercentTimer);
        self.changePercentTimer = null;

        i += 1;
        if (queue.sectionPercents[i]) {
            // 扩大匹配范围
            self.setMatchPercent(queue.sectionPercents[i]);
        }
        if (queue.sectionTimeouts[i] && queue.sectionPercents[i + 1]) {
            // 设置下次扩大范围的定时器
            self.changePercentTimer = setTimeout(changePercent, queue.sectionTimeouts[i]);
        }
    }

    if (queue.sectionTimeouts.length > 0) {
        // 设置首次扩大范围的定时器
        this.changePercentTimer = setTimeout(changePercent, queue.sectionTimeouts[0]);
    }
    // 无尽超时
    this.timeoutTimer = setTimeout(function () {
        clearTimeout(self.timeoutTimer);
        clearTimeout(self.matchRobotTimer);
        self.timeoutTimer = null;
        self.emit('timeout', self);
    }, queue.timeout);
    // 无尽匹配推送系统聊天
    var endless_MatchSendTime = dataUtils.getOptionValue("Endless_MatchSendTime", 10);
    this.matchSendTime = setTimeout(function () {
        clearTimeout(self.matchSendTime);
        self.matchSendTime = null;
        self.emit('sendMsg', self);
    }, endless_MatchSendTime * 1000);
    // 无尽匹配机器人
    var endless_MatchRobotTime = dataUtils.getRandomValue("Endless_MatchAITime01", "#");
    this.matchRobotTimer = setTimeout(function () {
        clearTimeout(self.matchRobotTimer);
        clearTimeout(self.timeoutTimer);
        self.matchRobotTimer = null;
        self.emit('matchRobot', self);
    }, endless_MatchRobotTime * 1000);
};

util.inherits(WaitPlayer, EventEmitter);

WaitPlayer.prototype.clean = function () {
    if (this.changePercentTimer) {
        clearTimeout(this.changePercentTimer);
    }
    if (this.timeoutTimer) {
        clearTimeout(this.timeoutTimer);
    }
    if(this.matchRobotTimer){
        clearTimeout(this.matchRobotTimer);
    }
};

WaitPlayer.prototype.setMatchPercent = function (newPercent) {
    if (newPercent !== this.curMatchPercent) {
        this.curMatchPercent = newPercent;
        this.emit('onPercentChanged', this);
    }
};

WaitPlayer.prototype.getMatchPercent = function () {
    return this.curMatchPercent;
};

WaitPlayer.prototype.getPower = function () {
    return this.power;
};

WaitPlayer.prototype.getInfo = function () {
    return {
        playerId: this.id,
        name: this.name,
        fightHeroId: this.fightHeroId,
        fightPetId: this.fightPetId,
        power: Math.ceil(this.power),
        scorePer: this.scorePer,
        boxDouble: this.boxDouble
    };
};

WaitPlayer.prototype.pushMsg = function (route, msg) {
    // 玩家下线时，不会推送
    //this.player.pushMsgToClient(route, msg);
    playerManager.get().pushMsgToPlayer(this.id, route, msg);
};

var MatchQueue = function (opts) {
    EventEmitter.call(this);
    opts = opts || {};
    this.id = opts.occasionId;
    this.timeout = opts.timeout || 10 * 1000;
    this.sectionTimeouts = opts.sectionTimeouts || [5];
    this.sectionPercents = opts.sectionPercents;
    this.waitQueue = [];
    this.waitPlayersById = {};
    this.on('matchSuccess', this.onMatchSuccess.bind(this));
};

util.inherits(MatchQueue, EventEmitter);

var pro = MatchQueue.prototype;

pro.findMatchPlayer = function (power, matchPercent, playerId) {
    var matchPlayers = _.filter(this.waitQueue, function (waitPlayer) {
        if (playerId && playerId === waitPlayer.id) {
            // 排除自己
            return false;
        }
        return waitPlayer.getMatchPercent().equal(matchPercent) && waitPlayer.getPower() >= power * matchPercent.low &&
            waitPlayer.getPower() <= power * matchPercent.high;
    });
    if (matchPlayers.length === 0) {
        return null;
    } else if (matchPlayers.length === 1) {
        return matchPlayers[0];
    } else {
        // 需求已变更为找差距最小的那个
        return _.min(matchPlayers, function (matchPlayer) {
            return Math.abs(matchPlayer.getPower() - power);
        });
    }
};

pro.remove = function (playerId) {
    if (!this.waitPlayersById[playerId]) {
        return false;
    }
    var player = this.waitPlayersById[playerId];
    player.clean();
    delete this.waitPlayersById[playerId];

    var idx = _.findIndex(this.waitQueue, function (waitPlayer) {
        return waitPlayer.id === playerId;
    });
    logger.debug('remove idx = %s', idx);
    if (idx !== -1) {
        logger.debug('remove player = %j, left = %s', this.waitQueue[idx].getInfo(), this.waitQueue.length - 1);
        this.waitQueue.splice(idx, 1);
        return true;
    }
    return false;
};
/**
 *  应战
 * @param fightPlayerId 应战玩家id
 * @returns {number}
 */
pro.acceptFight = function (opts) {
    var waitPlayer = this.waitPlayersById[opts.fightPlayerId];
    // 是否已经匹配到对手
    if (!waitPlayer) {
        return Code.WORLD.ENDLESS_ALREADY_MATCH;
    }
    // 战斗力不匹配
    var powerLow = Math.ceil(opts.power * this.sectionPercents[1].low);
    var powerHigh = Math.ceil(opts.power * this.sectionPercents[1].high);
    if (waitPlayer.getPower() < powerLow || waitPlayer.getPower() > powerHigh) {
        return Code.WORLD.ENDLESS_POWER_NOT_MATCH;
    }
    // 与对方进行匹配
    this.emit('matchSuccess', {
        playerId: opts.playerId,
        name: opts.name,
        fightHeroId: opts.fightHeroId,
        fightPetId: opts.fightPetId,
        power: opts.power,
        scorePer: opts.scorePer,
        boxDouble: opts.boxDouble,
        isRobotFight: 1
    }, waitPlayer.getInfo());


    return Code.WORLD.ENDLESS_MATCH_START;
};

/*
 * curPlayerInfo:我的信息
 * matchPlayerInfo:匹配到的玩家数据
 * **/
pro.onMatchSuccess = function (curPlayerInfo, matchPlayerInfo) {
    // 初次匹配的玩家，不在等待队列
    var curPlayer = playerManager.get().getPlayer(curPlayerInfo.playerId),
        // 被匹配到的有可能是机器人，机器人没有playerId
        matchPlayer = playerManager.get().getPlayer(matchPlayerInfo.playerId);
    logger.debug('onMatchSuccess curPlayerInfo = %j, matchPlayerInfo = %j', curPlayerInfo, matchPlayerInfo);

    if (curPlayer) {
        logger.debug('onMatchSuccess curPlayer.id = %s', curPlayer.id);
        var myRank = scoreRankingList.getScoreRankingList().findById(curPlayer.id) || {rank: 0};
        var myWeekRank = scoreRankingList.getWeekScoreRankingList().findById(curPlayer.id) || {rank: 0};
        curPlayerInfo.fightBfRank = myRank.rank;
        curPlayerInfo.fightBfWeekRank = myWeekRank.rank;
    }


    var pair = matchTarget.createMatchPair(curPlayerInfo, matchPlayerInfo, this.id);
    if (curPlayer) {
        logger.debug('onMatchSuccess curPlayer.id = %s', curPlayer.id);
        // var myRank     = scoreRankingList.getScoreRankingList().findById( curPlayer.id ) || {rank:0};
        // var myWeekRank = scoreRankingList.getWeekScoreRankingList().findById( curPlayer.id) || {rank:0};
        curPlayer.setMatchPair(pair);

    }
    if (matchPlayer) {
        logger.debug('onMatchSuccess matchPlayer.id = %s', matchPlayer.id);
        matchPlayer.setMatchPair(pair);

    }
    if (!curPlayer && !matchPlayer) {
        // 如果玩家都不在线(两个玩家都不在线，或一个玩家不在线另一个是机器人)，直接结算
        pair.forceEnd();
    }

    // 匹配成功，从队列中删除
    this.remove(curPlayerInfo.playerId);
    this.remove(matchPlayerInfo.playerId);

    pomelo.app.rpc.chat.chatRemote.setEndlessMatchInfo("*", {playerId: curPlayerInfo.playerId}, function () {

    });
    pomelo.app.rpc.chat.chatRemote.setEndlessMatchInfo("*", {playerId: matchPlayerInfo.playerId}, function () {

    });
    endlessMgr.getInstance().addMatchCount(this.id);
};

pro.add = function (player, opts) {
    if (this.waitPlayersById[player.id]) {
        return false;
    }
    var waitPlayer = new WaitPlayer(player, opts, this);
    this.waitQueue.push(waitPlayer);
    this.waitPlayersById[player.id] = waitPlayer;
    logger.debug('add player id = %s, opts = %j, cnt = %s', player.id, opts, this.waitQueue.length);
    var self = this;
    waitPlayer.on('onPercentChanged', function (curPlayer) {
        logger.debug('add onPercentChanged current = %j', curPlayer.getMatchPercent().getInfo());
        var matchPlayer = self.findMatchPlayer(curPlayer.getPower(), curPlayer.getMatchPercent(), curPlayer.id);
        if (matchPlayer) {
            // 匹配成功
            logger.debug('add second match success!curPlayer.id = %s, matchPlayer = %j', curPlayer.id, matchPlayer.getInfo());
            self.emit('matchSuccess', curPlayer.getInfo(), matchPlayer.getInfo());

        }
    });
    waitPlayer.on('matchRobot', function (curPlayer) {
        // 匹配机器人
        var matchRobot = ai.makeRobot(self.id, curPlayer.getPower(), curPlayer.scorePer, curPlayer.maxWin, curPlayer.maxLose);
        logger.debug('add timeout match robot = %j!', matchRobot);
        self.emit('matchSuccess', curPlayer.getInfo(), matchRobot);
    });

    waitPlayer.on('timeout', function (curPlayer) {
        self.remove(player.id);
        player.pushMsgToClient('endless.matchSuccess', {code: Code.WORLD.ENDLESS_CANT_MATCH});
        pomelo.app.rpc.chat.chatRemote.setEndlessMatchInfo("*", {playerId: player.id}, function () {

        });
        pomelo.app.rpc.area.endlessRemote.giveBackCost("*", player.id, function (err, res) {

        });
        // return;
        // }

    });

    waitPlayer.on('sendMsg', function (curPlayer) {
        var msg = {};
        var endlessChatInfo = {};

        endlessChatInfo.power = Math.ceil(curPlayer.getPower());
        endlessChatInfo.occasionId = self.id;
        endlessChatInfo.endlessPlayerId = curPlayer.id;
        endlessChatInfo.status = 0;
        msg.endlessInfo = endlessChatInfo;
        msg.type = 1;
        pomelo.app.rpc.chat.chatRemote.sendSysMsg("*", msg, function () {

        });
    });
    return true;
};

pro.match = function (player, opts) {
    logger.debug('match player.id = %s, opts = %j', player.id, opts);
    if (this.waitPlayersById[player.id]) {
        // 已在待匹配队列中
        return false;
    }
    // 策划要求 新号根据配置匹配到电脑
    var robotMatchCount = dataApi.EndlessType.getAiMatchCnt(opts.occasionId);
    var self = this;
    if (robotMatchCount && opts.totalCnt < robotMatchCount) {
        var robotWinRate = dataApi.EndlessType.getAiWinRate(opts.occasionId, opts.totalCnt);
        var matchRobot = ai.makeRobot(opts.playerId, opts.power, opts.scorePer, opts.maxWin, opts.maxLose, robotWinRate);
        self.emit('matchSuccess', {
            playerId: player.id,
            name: opts.name,
            fightHeroId: opts.fightHeroId,
            fightPetId: opts.fightPetId,
            power: opts.power,
            scorePer: opts.scorePer,
            boxDouble: opts.boxDouble,
            isRobotFight: 1
        }, matchRobot);
        return true;
    }

    // 筛选玩家战力可以加入的队伍，有多个则随机一个
    var matchPlayer = this.findMatchPlayer(opts.power, this.sectionPercents[0], player.id);
    if (matchPlayer) {
        logger.debug('match first match ok!curPlayer.id = %s, matchPlayer = %j', player.id, matchPlayer.getInfo());
        this.emit('matchSuccess', {
            playerId: player.id, name: opts.name, fightHeroId: opts.fightHeroId,
            fightPetId: opts.fightPetId, power: opts.power, scorePer: opts.scorePer, boxDouble: opts.boxDouble
        }, matchPlayer.getInfo());
        clearTimeout(matchPlayer.matchSendTime);
        return true;
    }
    logger.debug('match first match failed!curPlayer.id = %s, enter wait queue!', player.id);
    // 没有则进入匹配队列待匹配
    this.add(player, opts);
    return true;
};

module.exports = MatchQueue;
