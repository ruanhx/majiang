/**
 * Created by Administrator on 2016/3/10 0010.
 */

var pomelo = require('pomelo'),
    _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename);

var consts = require('../../consts/consts'),
    flow = require('../../consts/flow'),
    dataUtils = require('../../util/dataUtils'),
    dataApi = require('../../util/dataApi'),
    area = require('../area/area'),
    dropUtils = require('../area/dropUtils'),
    randBossRecordDao = require('../../dao/randBossRecordDao'),
    friendsDao = require('../../dao/friendsDao');

/**
 * 关卡随机boss
 * */
var BarrierRandBoss = function ( randBossDB ,player , winCnt) {
    if( null != randBossDB ){
        this.randomBossId =  randBossDB.randomBossId;
        this.barrierId = randBossDB.barrierId;
        this.coolTime =  randBossDB.coolTime;
        this.createTime =  randBossDB.createTime;
        this.currHp =  randBossDB.currHp;
        this.atkCnt =  randBossDB.atkCnt;
        this.winCnt = winCnt || 0;
        this.friendList = randBossDB.friendList ? randBossDB.friendList.split(",") : [];
        this.friendAtkHp = randBossDB.friendAtkHp;
        this.hasShare = randBossDB.hasShare;
        this.playerId = randBossDB.playerId;
        this.playerName = randBossDB.playerName;
        this.bindData();
    }else{
        this.init();
        this.playerId = player.id;
        this.playerName = player.playername;
    }
    this.player = player;
};

BarrierRandBoss.prototype.clearBarrierRandBoss = function(){
    delete this.player;
}

BarrierRandBoss.prototype.init = function (player) {
    this.barrierId = 0;
    this.coolTime = 0;
    this.createTime = 0;
    this.currHp = -1;
    this.atkCnt = 0;
    this.randomBossId = 0;
    this.hasShare = 0;
};

BarrierRandBoss.prototype.setPlayer = function (player , winCnt) {
    this.player = player;
    this.winCnt = winCnt || 0;
};

BarrierRandBoss.prototype.getHp = function () {
   return this.currHp;
};

BarrierRandBoss.prototype.bindData = function () {
    this.data = dataApi.RandomBoss.findById(this.randomBossId);
};

BarrierRandBoss.prototype.newCreate = function (barrierData) {
    this.init();
    this.barrierId = barrierData.customId;
    this.coolTime = Date.now();
    this.createTime = Date.now();
    this.friendList = [];
    this.friendAtkHp = 0;
    var barrierRandBoss = dataUtils.randomBossDataByRand(barrierData.bossList);
    if(!!barrierRandBoss){
        this.randomBossId = barrierRandBoss.randomBossId;
        this.currHp = 100000;//1;//barrierRandBoss.initialPower;
        this.data = barrierRandBoss;
    }else{
        logger.error('barrierRandBoss is null  customId = %s ', this.barrierId);
    }
    return this;
};

BarrierRandBoss.prototype.updateFriendList = function (friendId) {
     if (this.friendList.indexOf(friendId)!= -1){
         return;
     }
     this.friendList.push(friendId);
};

BarrierRandBoss.prototype.share = function () {
    this.hasShare = 1;
    this.player.emit('saveBarrierRandBoss', this.getData());
    this.push();
};

BarrierRandBoss.prototype.refresh = function ( currHp ,cnt,atkHp,friendId) {
    // 玩家助战不改变冷却时间
    var playerId = this.player.id;
    if (!friendId){
        this.player.refreshMgr.refreshRandBossCoolTime(this.data.coolTime);
        playerId = friendId;
    }
    this.currHp = currHp;
    //boss死亡推送
    if (this.currHp == 0){
        this.addWin();
        // this.push(playerId);
    }
    this.atkCnt = cnt;
    //好友可以攻打boss推送
    if (this.atkCnt==1){

    }
    atkHp = atkHp ? atkHp : 0;
    this.friendAtkHp += atkHp;
    this.push(playerId);
    if (friendId){
        var friend = area.getPlayer(friendId);
        friend.emit('saveBarrierRandBoss', this.getData());
        return;
    }

    this.player.emit('saveBarrierRandBoss', this.getData());

};

BarrierRandBoss.prototype.push = function (playerId) {
    var self = this;
    if(this.hasShare==0){
        return;
    }
    pomelo.app.rpc.world.friendsRemote.getFriendIdList("*",self.player.id,function (err,result) {
        _.each(result,function (friendId) {
            var player = area.getPlayer(friendId);
            if (player){
                player.pushMsg("randBoss.push",{barrierRandBoss:self.getClientInfo()});
            }
        });
        var player = area.getPlayer(self.player.id);
        if(player){
            player.pushMsg("randBoss.push",{barrierRandBoss:self.getClientInfo()});
        }
    });
}

/*
* 成功击败boss
* */
BarrierRandBoss.prototype.addWin = function () {
    this.winCnt += 1;
};

BarrierRandBoss.prototype.setWin = function (n) {
    this.winCnt = n || 0;
};

BarrierRandBoss.prototype.getData = function () {
    return {
        playerId  : this.playerId,
        barrierId:this.barrierId,
        coolTime:this.coolTime,
        createTime:this.createTime,
        currHp:this.currHp,
        randomBossId:this.randomBossId,
        atkCnt:this.atkCnt,
        friendList:[this.friendList].join(";"),
        friendAtkHp:this.friendAtkHp,
        hasShare:this.hasShare,
        playerName:this.playerName
    };
};

BarrierRandBoss.prototype.getAtk = function () {
    return this.atkCnt;
};

BarrierRandBoss.prototype.isHaveBoss = function () {
    return this.barrierId > 0 && 0 !=this.currHp && !this.isDisappear();
};

/**
 * 是否冷却中
 * */
BarrierRandBoss.prototype.isCooling = function () {
    return  this.coolTime > 0 && this.coolTime > Date.now();
};

/**
 * 是否消失
 * true:表示已经消失
 * */
BarrierRandBoss.prototype.isDisappear = function () {
    return !!this.data && Date.now() >= (this.createTime + this.data.timeCount*1000);
};

/*
* 下发死亡奖励
* */
BarrierRandBoss.prototype.sendDieAward = function ( player ) {
    var drops = player.applyDrops(dropUtils.getDropItems( this.data.allDrop ,null,flow.ITEM_FLOW.KILL_RAND_BOSS));
    return drops;
};

/*
 *  助战- 下发参与奖励
 * */
BarrierRandBoss.prototype.sendShareParticipateAward = function ( player ) {
    var drops = player.applyDrops(dropUtils.getDropItems( this.data.participateAward ) ,null,flow.ITEM_FLOW.SHARE_PARTICIPATE);
    return {drops:drops,dropsCnt:1};
};

BarrierRandBoss.prototype.isChallengeTicketEnough = function () {
    return this.player.challengeTicket>=this.data.challengeTicket;
};

BarrierRandBoss.prototype.getNeedChallengeTicket = function () {
    return this.data.challengeTicket;
};

BarrierRandBoss.prototype.getAwardCount =function(killedHp) {
    var RandomBossMinReward = dataUtils.getOptionValue('RandomBossMinReward', 0.01);
    var curPer = killedHp * 1.0 / RandomBossMinReward;
    var dropsCnt = Math.floor(curPer);
    if (dropsCnt <= 0) {//加了保底奖励 1
        dropsCnt = 1;
    }
    return dropsCnt;
}
/*
* 普通奖励
* */
BarrierRandBoss.prototype.sendAward = function ( player ,killedHp ) {
    // 给与奖励
    var dropsCnt = this.getAwardCount(killedHp);
    var drops = player.applyDrops( dropUtils.getDropItems( this.data.singleDrop ) , dropsCnt,flow.ITEM_FLOW.PASS_BARRIER);
    return {drops:drops,dropsCnt:dropsCnt};
};


BarrierRandBoss.prototype.getClientInfo = function () {
    return {
        barrierId: this.barrierId,
        coolTime: this.coolTime,
        createTime: this.createTime,
        currHp: this.currHp,
        randomBossId: this.randomBossId,
        atkCnt: this.atkCnt,
        winCnt: this.winCnt,
        playerId: this.playerId,
        playerName: this.playerName,
        hasShare: this.hasShare
    };
};

var Manager = function (player) {
    this.player = player;
    this.player.on('updatePassedBarrier', this.onUpdate.bind(this));
    this.player.on('doBarrierSettlement', this.onSettlement.bind(this));
};

var pro = Manager.prototype;

pro.clearPassedBarrier = function(){
    delete this.player;
    delete this.randBoss.clearBarrierRandBoss();
    delete this.randBoss;


    for(var key in this.passedBarrierMap){
        delete this.passedBarrierMap[key];
    }
    delete this.passedBarrierMap;

    for(var key in this.newBarrierId){
        delete this.newBarrierId[key];
    }
    delete this.newBarrierId;
}

pro.onUpdate = function (rec) {
    this.player.pushMsg('passedBarrier.update', {
        barrierId: rec.barrierId, star: rec.star, dailyTimes: rec.dailyTimes,
        resetTimes: rec.resetTimes,passTime:rec.passTime
    });
};

pro.pushAllFriendsBoss = function () {
    pomelo.app.rpc.world.friendsRemote.getFriendIdList.toServer("*",playerId,function (err,result) {
        var friendsBoss = [];
        _.each(result,function (friendId) {
            var boss = pomelo.app.get('randomBossMgr').getFriendBoss(friendId);
            if (boss){
                friendsBoss.push(boss);
            }
        });
        var randBossList = [];
        friendsBoss.forEach(function (randBoss) {
            if (randBoss.atkCnt>=1){
                randBossList.push(randBoss.getClientInfo());
            }
        });

    });
};

pro.load = function (passedBarriers) {
    var self = this;
    self.passedBarrierMap = {};
    self.newBarrierId = {};

    self.newBarrierId[consts.CHAPTER_TYPE.NORMAL] = 0;
    self.newBarrierId[consts.CHAPTER_TYPE.DIFFL] = 0;

    for (var barrier in passedBarriers) {
        var barrierId = passedBarriers[barrier].barrierId;
        self.passedBarrierMap[barrierId] = passedBarriers[barrier];
        var diffType = dataUtils.getChapterDiffTypeByBarrierId( barrierId );
        if(self.newBarrierId[diffType]<barrierId)
        {
            self.newBarrierId[diffType]=barrierId;
        }
        //self.player.updateMaxBarrierId(barrierId);
    }
    logger.info('load cnt = %s', _.size(this.passedBarrierMap));
};

pro.loadRandBoss = function ( dbData,randBossRecordCnt ) {
    var self = this;
    var lastWeekCnt = Math.floor(randBossRecordCnt[1] * dataUtils.getOptionValue('RandomBossResetParameter ',0.5));
    var winCnt = randBossRecordCnt[0] + (lastWeekCnt > 0 ? lastWeekCnt : 1);
    var boss =pomelo.app.get('randomBossMgr').getFriendBoss(this.player.id);
    if (boss){
        boss.setPlayer(this.player ,winCnt);
        self.randBoss = boss;
    }else {
        self.randBoss = new BarrierRandBoss( dbData,this.player ,winCnt);
    }

    pomelo.app.get('randomBossMgr').setRandBoss(this.player.id,self.randBoss);
};

pro.newCreateRandBoss = function ( barrierData ) {
    var self = this;
    self.randBoss.newCreate(barrierData);
    pomelo.app.get('randomBossMgr').setRandBoss(self.player.id,self.randBoss);
    return self.randBoss;
};

pro.getRandBoss = function () {
    return this.randBoss;
};

/*刷新最新关卡进度
*  type : 关卡类型
*  barrierId : 关卡id
* */
pro.updateNewBarrierId = function ( type ,barrierId  ) {
    if( !!this.newBarrierId && this.newBarrierId[type] != null )// [138970]【服-夺宝】通过GM系统获取钻石后，点击10连，日志显示服务器返回code钻石不足，内附日志
    {
        var currBarrierId = this.newBarrierId[type];
        this.newBarrierId[type] = barrierId >currBarrierId ? barrierId : currBarrierId;
    }
};

pro.getNewBarrierId = function (type) {
    if( !!this.newBarrierId && !!this.newBarrierId[type] )
    {
        return this.newBarrierId[type];
    }
    return 0;
}
/*
*  关卡结算(普通或者精英 包括扫荡)
*  */
pro.onSettlement = function( barrierId )
{
    var diffType = dataUtils.getChapterDiffTypeByBarrierId( barrierId );
    var custom = dataApi.Custom.findById(barrierId);
    var canEmitPassChapter = false;
    if(custom){
        var lastBarrier = dataApi.Chapter.getLastBarrier(custom.chapterId);
        if(lastBarrier === barrierId){
            canEmitPassChapter = true; //通关章节最后一关
        }
    }

    if( diffType == consts.CHAPTER_TYPE.NORMAL )
    {
        this.player.emit('FightOrdinarfyBarrier', barrierId);
        if(canEmitPassChapter){
            this.player.emit('onActPassedOrdinaryChapter', custom.chapterId);
        }
    }
    else if( diffType == consts.CHAPTER_TYPE.DIFFL )
    {
        this.player.emit('FightDiffBarrier', barrierId);
        if(canEmitPassChapter){
            this.player.emit('onActPassedDiffChapter', custom.chapterId);
        }
    }
}

/*
 *   手动重置关卡
 * */
pro.resetBarrier = function (barrierId) {
    var rec = this.passedBarrierMap[barrierId],
        player = this.player;
    if (rec) {
        rec.dailyTimes = 0;
        rec.resetTimes += 1;

        player.emit('updatePassedBarrier', rec);
    }
};

/*
 *   退出关卡结算
 * */
pro.resetBarrierAfterExit = function (barrierId, newStar, costTick, reviveCnt, power, superSkillCnt, jumpCnt, jumpSkillCnt,promoteCnt,passTime) {
    var rec = this.passedBarrierMap[barrierId],
        player = this.player,
        isStarUpdate = false,
        dbData = {
            playerId: player.id,
            barrierId: barrierId
        };
    if (rec) {
        // 非首次攻打
        if(newStar>0)
        {
            rec.dailyTimes += 1;
        }
        if (rec.star === 0) {
            if (newStar > 0) {
                // 首次胜利
                rec.costTick = costTick;
                rec.power = power;
                rec.reviveCnt = reviveCnt;
                rec.superSkillCnt = superSkillCnt;
                rec.jumpCnt = jumpCnt;
                rec.jumpSkillCnt = jumpSkillCnt;
            } else {
                rec.loseCnt = rec.loseCnt + 1;
                rec.losePower = power;
            }
        }
        if (rec.star < newStar) {
            rec.star = newStar;
            isStarUpdate = true;
        }
        if (rec.passTime>passTime||!rec.passTime){
            rec.passTime = passTime;
        }
        dbData.costTick = rec.costTick;
        dbData.power = rec.power;
        dbData.reviveCnt = rec.reviveCnt;
        dbData.superSkillCnt = rec.superSkillCnt;
        dbData.jumpCnt = rec.jumpCnt;
        dbData.jumpSkillCnt = rec.jumpSkillCnt;
        dbData.loseCnt = rec.loseCnt;
        dbData.losePower = rec.losePower;
        dbData.star = rec.star;
        dbData.dailyTimes = rec.dailyTimes;
        dbData.resetTimes = rec.resetTimes;
        dbData.passTime = rec.passTime;
        dbData.promoteCnt = promoteCnt;
    }
    else
    {
        // 首次攻打
        dbData.star = newStar;
        dbData.resetTimes = 0;
        if (newStar > 0) {
            // 首次攻打，并且胜利
            dbData.costTick = costTick;
            dbData.power = power;
            dbData.reviveCnt = reviveCnt;
            dbData.superSkillCnt = superSkillCnt;
            dbData.jumpCnt = jumpCnt;
            dbData.jumpSkillCnt = jumpSkillCnt;
            dbData.loseCnt = 0;
            dbData.losePower = 0;
            dbData.passTime = passTime;
            dbData.dailyTimes = 1;
            isStarUpdate = true;
        } else {
            // 首次攻打并且失败
            dbData.costTick = 0;
            dbData.power = 0;
            dbData.reviveCnt = 0;
            dbData.superSkillCnt = 0;
            dbData.jumpCnt = 0;
            dbData.jumpSkillCnt = 0;
            dbData.loseCnt = 1;
            dbData.losePower = power;
            dbData.passTime = 0;
            dbData.dailyTimes = 0;
        }
        dbData.promoteCnt = promoteCnt;
        dbData.type = dataUtils.getChapterDiffTypeByBarrierId(barrierId);

    }
    this.passedBarrierMap[barrierId] = dbData;
    if(isStarUpdate){
        pomelo.app.rpc.world.rankListRemote.updateStarRankingList("*", {
            type : Consts.RANKING_TYPE.STAR,
            playerId: player.id,
            score: player.passedBarrierMgr.getTotalStarCnt()
        }, function (res) {});
    }
    //player.updateMaxBarrierId(barrierId);
    player.emit('updatePassedBarrier', dbData);
};

pro.forcePassed = function (barrierId, star) {
    var rec = this.passedBarrierMap[barrierId],
        player = this.player;
    if (rec) {
        if (rec.star < star) {
            rec.star = star;
            player.emit('updatePassedBarrier', rec);
            pomelo.app.rpc.world.rankListRemote.updateStarRankingList("*", {
                type : Consts.RANKING_TYPE.STAR,
                playerId: player.id,
                score: player.passedBarrierMgr.getTotalStarCnt()
            }, function (res) {});
        }
    } else {
        rec = this.passedBarrierMap[barrierId] = {
            playerId: player.id,
            barrierId: barrierId,
            star: star,
            dailyTimes: 0,
            resetTimes: 0
        };
        player.emit('updatePassedBarrier', rec);
        pomelo.app.rpc.world.rankListRemote.updateStarRankingList("*", {
            type : Consts.RANKING_TYPE.STAR,
            playerId: player.id,
            score: player.passedBarrierMgr.getTotalStarCnt()
        }, function (res) {});
    }
    //player.updateMaxBarrierId(barrierId);
};

/*
 *   系统定时重置关卡
 * */
pro.sysResetBarrier = function (rec) {
    rec.dailyTimes = 0;
    rec.resetTimes = 0;

    //var player = this.player;
    ////player.pushMsg('barrier.passed', {
    //    barrierId: rec.barrierId, dailyTimes: rec.dailyTimes,
    //    resetTimes: rec.resetTimes
    //});
    this.player.emit('updatePassedBarrier', rec);
};

/*
 *   系统定时重置所有关卡
 * */
pro.resetBarriers = function () {
    var self = this;
    for (var barrierId in self.passedBarrierMap) {
        self.sysResetBarrier(self.passedBarrierMap[barrierId]);
    }
};

/*
 *   上限时，检查并重置关卡
 * */
pro.processBarrierAtkCntReset = function () {
    var player = this.player,
        trigger = pomelo.app.get('cronManager').getTriggerById(consts.AREA_CRON.BARRIER_ATK_CNT_CRON_ID);
    if (!trigger) {
        return;
    }
    for (var barrierId in this.passedBarrierMap) {
        var lastResetTime = player.logoffTime || 0;
        if (!lastResetTime) {
            // 首次
            this.sysResetBarrier(this.passedBarrierMap[barrierId]);
        } else {
            if (Date.now() >= trigger.nextExcuteTime(lastResetTime)) {
                this.sysResetBarrier(this.passedBarrierMap[barrierId]);
            }
        }
    }
};

/*
 *   是否通关增加判定星级
 * */
pro.isPassed = function (barrierId) {
    var rec = this.getPassedBarrier(barrierId);
    return (!!rec && rec.star > 0);
};

pro.getPassedBarrier = function (barrierId) {
    return this.passedBarrierMap[barrierId];
};

pro.getClientInfo = function () {
    var recs = [];
    _.each(this.passedBarrierMap, function (rec) {
        recs.push({
            barrierId: rec.barrierId,
            star: rec.star,
            dailyTimes: rec.dailyTimes,
            resetTimes: rec.resetTimes
        });
    });
    return recs;
};

/*
* 通关星星总数
* */
pro.getTotalStarCnt=function()
{
    var startCnt = 0;
    _.each(this.passedBarrierMap, function (rec) {
        startCnt+= rec.star;
    });
    return startCnt;
};


/*
 *   计算章节是否通过
 * */
pro.isChapterPassed = function (chapterId) {
    var lastBarrier = dataApi.Chapter.getLastBarrier(chapterId);
    if (lastBarrier) {
        return this.isPassed(lastBarrier);
    }
    return false;
};

/*
 *   计算章节是否可以解锁
 * */
pro.canUnlockChapter = function (chapterId) {
    var chapterData = dataApi.Chapter.findById(chapterId);
    if (chapterData) {
        if (chapterData.preChapter) {
            return this.isChapterPassed(chapterData.preChapter);
        }
        return true;
    }
    return false;
};

/*
* 刷新或者创建boss
* */
pro.refreshOrCreateRandBoss = function ( barrierId ) {
    var bossInfo = {};
    return bossInfo;
};

/*
* 刷新boss数据
* */
pro.refreshBossInfo = function () {
    
};

module.exports = Manager;
module.exports.BarrierRandBoss = BarrierRandBoss;