/**
 * Created by kilua on 2016/7/5 0005.
 */
var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');
var pomelo = require('pomelo');
var Activity = require('./playerActivity'),
    dataApi = require('../../util/dataApi'),
    Consts = require('../../consts/consts'),
    DiscountShop = require('./detailTypes/discountShop'),
    FristRecharge = require('./detailTypes/fristRecharge'),
    ConditionAward = require('./detailTypes/conditionAward'),
    InvitCfg = require('./detailTypes/invitCfg'),
    Notice = require('./detailTypes/notice'),
    DropDouble = require('./detailTypes/dropDouble'),
    DiscountEnergy = require('./detailTypes/discountEnergy'),
    GetEnergy   = require('./detailTypes/getEnergy'),
    Power = require('./detailTypes/power'),
    SingleCharge = require('./detailTypes/singleCharge'),
    TotalCharge = require('./detailTypes/totalCharge'),
    TotalMoneyCharge = require('./detailTypes/totalMoneyCharge'),
    TotalConsume = require('./detailTypes/totalConsume'),
    TotalOrdinaryBarrierCnt = require('./detailTypes/totalOrdinaryBarrierCnt'),
    TotalDiffBarrierCnt = require('./detailTypes/totalDiffBarrierCnt'),
    TotalEndlessScore = require('./detailTypes/totalEndlessScore'),
    TotalLogin = require('./detailTypes/totalLogin'),
    PassedOrdinaryChapter = require('./detailTypes/passedOrdinaryChapter'),
    PassedDiffChapter = require('./detailTypes/passedDiffChapter'),
    HeroLv = require('./detailTypes/heroLv'),
    HeroGrade = require('./detailTypes/heroGrade'),
    HeroSkillUp = require('./detailTypes/heroSkillUp'),
    EquipLv = require('./detailTypes/equipLv'),
    EquipStrengthenLv = require('./detailTypes/equipStrengthenLv'),
    EquipQuality = require('./detailTypes/equipQuality'),
    EndlessHighScore = require('./detailTypes/endlessHighScore'),
    DivisionUp = require('./detailTypes/divisionUp'),
    KillRandomBoss = require('./detailTypes/killRandomBoss'),
    HeroBreak = require('./detailTypes/heroBreak'),
    FriendCnt = require('./detailTypes/friendCnt'),
    CatchTreasureRank = require('./detailTypes/catchTreasureRank'),
    EndlessRank = require('./detailTypes/endlessRank'),
    ActEctypePass = require('./detailTypes/actEctypePass'),
    TotalUseDiamond = require('./detailTypes/totalUseDiamond'),
    TotalUseGold = require('./detailTypes/totalUseGold'),
    TotalSnatch = require('./detailTypes/totalSnatch'),
    myUtils = require('../../../mylib/utils/lib/utils'),
    UnionPrivilege = require('./detailTypes/unionPrivilege'),
    HeroCollect = require('./detailTypes/heroCollect'),
    starRank = require('./globalActivity/starRank'),
    async = require('async'),
    mUtils = require('../../util/utils'),
    cronTrigger = require('../area/cronTrigger');

function createCondAward(manager, player, actData) {
    var condData = dataApi.ActivityCond.findById(actData.actTypeId);
    if (!condData) {
        return new ConditionAward(manager, player, actData);
    }
    switch (condData.condType) {
        case Consts.ACTIVITY_CONDITION_TYPE.HIGH_POWER:
            return new Power(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.SINGLE_CHARGE:
            return new SingleCharge(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.TOTAL_CHARGE:
            return new TotalCharge(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.TOTAL_MONEY_CHARGE:
            return new TotalMoneyCharge(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.TOTAL_CONSUME:
            return new TotalConsume(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.TOTAL_LOGIN:
            return new TotalLogin(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.TOTAL_ORDINARY_BARRIER_CNT:
            return new TotalOrdinaryBarrierCnt(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.TOTAL_DIFF_BARRIER_CNT:
            return new TotalDiffBarrierCnt(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.TOTAL_ENDLESS_SCORE:
            return new TotalEndlessScore(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.PASSED_ORDINARY_CHAPTER:
            return new PassedOrdinaryChapter(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.PASSED_DIFF_CHAPTER:
            return new PassedDiffChapter(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.HERO_LV:
            return new HeroLv(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.HERO_GRADE:
            return new HeroGrade(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.EQUIP_LV:
            return new EquipLv(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.EQUIP_STRENGTHEN_LV:
            return new EquipStrengthenLv(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.EQUIP_QUALITY:
            return new EquipQuality(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.ENDLESS_HIGH_SCORE:
            return new EndlessHighScore(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.DIVISION_UP:
            return new DivisionUp(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.KILL_RANDOM_BOSS:
            return new KillRandomBoss(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.HERO_BREAK:
            return new HeroBreak(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.HERO_SKILL_UP:
            return new HeroSkillUp(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.FRIEND_CNT:
            return new FriendCnt(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.CATCH_TREASURE_RANK:
            return new CatchTreasureRank(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.ENDLESS_RANK:
            return new EndlessRank(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.ACT_ECTYPE_PASS:
            return new ActEctypePass(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.TOTAL_USE_DIAMOND:
            return new TotalUseDiamond(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.TOTAL_USE_GOLD:
            return new TotalUseGold(manager, player, actData);
        case Consts.ACTIVITY_CONDITION_TYPE.TOTAL_SNATCH:
            return new TotalSnatch(manager, player, actData);
        default:
            return new ConditionAward(manager, player, actData);
    }
}

function createActivity(manager, player, actData) {
    switch (actData.actType) {
        case Consts.ACTIVITY_TYPE.DISCOUNT_SHOP:
            return new DiscountShop(manager, player, actData);
        case Consts.ACTIVITY_TYPE.CONDITION_AWARD:
            return createCondAward(manager, player, actData);
        case Consts.ACTIVITY_TYPE.NOTICE:
            return new Notice(manager, player, actData);
        case Consts.ACTIVITY_TYPE.GET_ENERGY:
            return new GetEnergy(manager, player, actData);
        case Consts.ACTIVITY_TYPE.BARRIER_DROP_DOUBLE:
        case Consts.ACTIVITY_TYPE.ENDLESS_DROP_DOUBLE:
            return new DropDouble(manager, player, actData);
        case Consts.ACTIVITY_TYPE.ENERGY_DISCOUNT:
            return new DiscountEnergy(manager, player, actData);
        case Consts.ACTIVITY_TYPE.FRIST_RECHARGE:
            return new FristRecharge(manager, player, actData);
        case Consts.ACTIVITY_TYPE.PLZ_CODE:
            return new InvitCfg(manager, player, actData);
        case Consts.ACTIVITY_TYPE.UNION_PRIVILEGE:
            return new UnionPrivilege(manager, player, actData);
        case Consts.ACTIVITY_TYPE.HERO_COLLECT:
            return new HeroCollect(manager, player, actData);
        default:
            return new Activity(manager, player, actData);
    }
}

var Manager = function (player) {
    this.player = player;
    this.activityById = {};
};

var pro = Manager.prototype;

pro.clearActivityMgr = function(){
    delete this.player;
    for(var key in this.activityById){
        this.activityById[key].clearActivity();
        delete this.activityById[key];
    }
    delete this.activityById;

    delete this.resetTick;
}

pro.getById = function (actId) {
    return this.activityById[actId];
};

/*
* 通过类型获得活动
* */
pro.getByType = function (actType) {
    var act = _.filter(this.activityById , function (_act) {
        return _act.getType() == actType;
    });
    if(_.size(act) >=1){
        return act[0];
    }
    return act;
};

/*
 *   添加活动
 * */
pro.checkAdd = function (actData,isLoginCheck) {
    if (this.activityById[actData.id]) {
        //如果登录天数超过要删除
        if(this.player.logonDayCnt > parseInt(actData.loginDay[1])){
            this.remove(this.activityById[actData.id]);
            return {};
        }
        return this.activityById[actData.id];
    } else {
        //判断登录天数和通关条件
        if(actData.loginDay != -1 && actData.loginDay.length == 2){//说明有登录天数限制拦截
            //logger.warn('测试：存在登录次数限制关卡：', actData);
            if(this.player.logonDayCnt >= parseInt(actData.loginDay[0]) && this.player.logonDayCnt<= parseInt(actData.loginDay[1])){
                //满足条件--不处理
            }else{
                //logger.warn('测试：活动被登录天数拦截：', actData);
                return {};//不能往下执行
            }
        }
        if(this.player.passedBarrierMgr.getNewBarrierId(Consts.CHAPTER_TYPE.NORMAL) < actData.customId){//说明有关卡限制拦截
            //logger.warn('测试：活动被通关关卡拦截：', actData);
            return {};//不能往下执行
        }

        //logger.debug('checkAdd add activity id = %s', actData.id);
        actData.isNewAdd = true;
        var activity = (this.activityById[actData.id] = createActivity(this, this.player, actData));
        activity.onPublish(isLoginCheck);
        // activity.save();
        return activity;
    }
};

/*
 *   发布活动
 * */
pro.publish = function (actIds,isLoginCheck) {
    var self = this;
    actIds = actIds || [];
    //logger.debug('publish actIds = %j', actIds);
    var now = Date.now();
    //检测登录天数累加
    if(now>this.player.logonDayCntTime && !mUtils.isSameDay(this.player.logonDayCntTime,now)){
        this.player.set('logonDayCntTime',now);
        this.player.set('logonDayCnt',(this.player.logonDayCnt||0)+1);
    }
    actIds.forEach(function (actId) {
        var actData = dataApi.Activity.findById(actId);
        self.checkAdd(actData,isLoginCheck);
    });
    self.checkOpen();
};

pro.remove = function (activity) {
    if (activity && this.activityById[activity.id]) {
        activity.save(true);
        delete this.activityById[activity.id];
        activity.pushRemove();
    }
};

/*
 *   类型为7每日重置
 * */
pro.reset = function()
{
    var self = this;
    self.player.resetDailyActivityEnergyTik();
    _.each(self.activityById, function (activity) {
        if( !!activity.actData && !!activity.actData.openingTimeType &&  activity.actData.openingTimeType === Consts.ACTIVITY_OPEN_TYPE.PERMANENT )
        {
            // console.log('---/n/n/n/n %s',JSON.stringify(activity.actData));
            activity.reset();
        }
    } )
};

//检查领取体力的活动
pro.checkEnergy = function(){
    var self = this;
    _.each(self.activityById, function (activity) {
        if(activity.isOpen() && activity.getType() == Consts.ACTIVITY_TYPE.GET_ENERGY )
        {
            activity.refreshRedSpot();
        }
    } )
}

/*
 *   检查并删除已关闭的活动,不推送活动删除
 * */
pro.batchCheckRemove = function (opFlags, serverDay) {
    var self = this;
    _.each(this.activityById, function (activity) {
        if (activity.isOpenByOpFlags(opFlags)) {
            if (activity.isClosed(serverDay)) {
                if (activity.haveAwardsToDraw()) {
                    activity.applyAwards();
                    // 活动在列表中消失
                    logger.info('batchCheckRemove remove activity.id %s after apply awards', activity.id);
                    self.remove(activity);
                } else {
                    // 若无奖励可领取，则活动在列表中消失
                    logger.info('batchCheckRemove directly remove activity.id %s', activity.id);
                    self.remove(activity);
                }
            } else {
                // 活动尚未结束，忽略
            }
        } else {
            // 活动时间过程中，活动运营标识关闭时
            // 活动直接关闭，剩余奖励不发放
            // 如关闭时处于对应活动，则在点击参与按钮（充值、领取等）时，上飘提示“该活动已关闭”
            // 要保留进度数据，所以不删除活动
            //logger.debug('batchCheckRemove do nothing for activity.id %s!', activity.id);
        }
    });
};
/*
 *   检查并开放活动
 * */
pro.checkOpen = function () {
    _.each(this.activityById, function (activity) {
        activity.checkOpen();
    });
};

pro.load = function (dbActList  ,resetTick) {
    this.resetTick = resetTick;
    var self = this,
        player = self.player;
    dbActList = dbActList || [];
    //logger.debug('load total = %s', dbActList.length);
    dbActList.forEach(function (dbAct) {
        var actData = dataApi.Activity.findById(dbAct.id);
        if (!actData) {
            logger.warn('load activity data not found!id = %s', dbAct.id);
        } else {
            var activity = createActivity(self, player, actData);
            //logger.debug('load loading activity %s', dbAct.id);
            activity.load(dbAct);
            self.activityById[activity.id] = activity;
        }
    });
};

pro.getClientInfo = function () {
    var infoList = [],
        activityList = _.values(this.activityById);
    // 排序
    activityList.sort(function (a, b) {
        return a.getPriority() - b.getPriority();
    });
    _.each(activityList, function (activity) {
        if (activity.isOpenByOpFlags() && !activity.isAutoClosed()) {
            // 只有没有运营标志或虽有运营标志且对应运营标志开启的已发布活动，客户端才可以看到
            infoList.push(activity.getClientInfo());
        }
    });
    return infoList;
};

pro.clear = function () {
    _.each(this.activityById, function (activity) {
        activity.clear();
    });
};

//体力折扣数
pro.energyDiscount =function(){
    var discount = 1;
    var tempList = this.getClientInfo();
    if( tempList )
    {
        tempList.forEach(function(activity)
        {
            if( activity.type === Consts.ACTIVITY_TYPE.ENERGY_DISCOUNT )
            {
                var actTypeValue = activity.actTypeValue;
                if( actTypeValue < discount )
                {
                    discount = actTypeValue;
                }
            }
        });
    }
    return discount;
};

//战斗奖励翻倍活动
pro.getFightDropdDouble= function( fightType ){
    var double = 1;
    var tempList = this.getClientInfo();
    if( tempList )
    {
        tempList.forEach(function(activity)
        {
            if( fightType === Consts.FIGHT_TYPE.BARRIER && activity.type === Consts.ACTIVITY_TYPE.BARRIER_DROP_DOUBLE  ||
                fightType === Consts.FIGHT_TYPE.ENDLESS && activity.type === Consts.ACTIVITY_TYPE.ENDLESS_DROP_DOUBLE )
            {
                var actTypeValue = activity.actTypeValue;
                if( double < actTypeValue )
                {
                    double = actTypeValue;
                }
            }
        });
    }
    return double;
};

/*
 *   查找兑换码活动
 * */
pro.getActivationCodeExchange = function () {
    var activityId, activity;
    for (activityId in this.activityById) {
        activity = this.activityById[activityId];
        if (activity.isActivationCodeExchange()) {
            return activity;
        }
    }
};


pro.processOfflineReset = function () {
    var trigger = pomelo.app.get('cronManager').getTriggerById(Consts.AREA_CRON.RESET_ACTIVITY),
        nextExecuteTime, now = Date.now();
    if (!this.resetTick) {
        // 第一次
        this.reset();
        return;
    }
    if (!!trigger && !!this.resetTick) {
        nextExecuteTime = trigger.nextExcuteTime(this.resetTick);
        //logger.debug('processOfflineReset %s', new Date(this.resetTick).toString());
        if (nextExecuteTime < now) {
            this.reset();
        }
    }
};


/*
 *   检查并删除已关闭的活动,不推送活动删除
 * */
pro.checkRemoveActivities = function (app, opFlags, serverDay, cb) {
    var self = this;
    async.each(_.values(self.activityById), function (activity, callback) {
        if (activity.isOpenByOpFlags(opFlags)) {
            if (activity.isClosed(serverDay)) {
                // 活动正常结束
                //if (activity.haveAwardsToDraw()) {
                    /* // 有奖励可领取
                    logger.info('checkRemoveActivities sending award mail for activity.id %s', activity.id);
                    // 将奖励以系统邮件的形式发送给玩家
                    area.sendMails(app, self.player.id, activity.makeAwardMails(), function (err) {
                        if (err) {
                            logger.error('checkRemoveActivities sendMails error %s', err.stack);
                            // 出错，不删除
                        } else {
                            // 活动在列表中消失
                            logger.info('checkRemoveActivities send award mail ok!remove activity.id %s', activity.id);
                            self.remove(activity);
                        }
                        callback();
                    });*/
                //} else {
                    // 若无奖励可领取，则活动在列表中消失
                    logger.info('checkRemoveActivities directly remove activity.id %s', activity.id);
                    self.remove(activity);
                    callback();
               //}
            } else {
                // 活动尚未结束，忽略
                callback();
            }
        } else {
            //活动时间过程中，活动运营标识关闭时
            //活动直接关闭，剩余奖励不发放
            //如关闭时处于对应活动，则在点击参与按钮（充值、领取等）时，上飘提示“该活动已关闭”
            // 要保留进度数据，所以不删除活动
            //logger.debug('checkRemoveActivities do nothing for activity %s!', activity.id);
            callback();
        }
    }, cb);
};


/*module.exports.get = function (player) {
    if (!player.activityMgr) {
        player.activityMgr = new Manager(player);
    }
    return player.activityMgr;
};*/



var exp = module.exports = {};
exp.get = function (player) {
    if (!player.activityMgr) {
        player.activityMgr = new Manager(player);
    }
    return player.activityMgr;
};

/*
 *   查询当前服务器活动列表
 * */
exp.getCurServerActivities = function (opFlags, serverDay) {
    var result = [];
    if (dataApi.Activity) {
        for(var key in dataApi.Activity.data) {
            var row = myUtils.clone(dataApi.Activity.data[key]);
            //syncGroupActivityConfig(row);
            if (isVisibleByServer(row, opFlags, serverDay)) {
                // 计算开始日期和结束日期
                var activity = {};
                activity.id = row.id;
                activity.name = row.name_txt_cht;
                activity.openDate = new Date(row.openTick).setHours(0, 0, 0, 0);
                if (row.lastTime !== -1) {
                    activity.closeDate = new Date(row.openTick + getLastTime(row.lastTime)).setHours(0, 0, 0, 0);
                } else {
                    activity.closeDate = -1;
                }
                activity.operationFlag = row.operationFlag;
                activity.isOpen = (Date.now() > row.openTick);
                result.push(activity);
            }
        }
    }
    return result;
};


/*
 *   查询全服当前活动时调用，不考虑玩家等级
 * */
function isVisibleByServer(actData, opFlags, serverDay) {
    var now = Date.now(),
        lastTime = getLastTime(actData.lastTime);
    // 检查运营标志
    if (actData.operationFlag) {
        opFlags = opFlags || [];
        if (!_.contains(opFlags, actData.operationFlag)) {
            //logger.debug('isVisible id = %s, opFlags %s not in %j', actData.id, actData.operationFlag, opFlags);
            return false;
        }
    }
    // 检查可见时间
    switch (actData.openingTimeType) {
        case Consts.ACTIVITY_OPEN_TYPE.PERIOD_DAY:
        case Consts.ACTIVITY_OPEN_TYPE.PERIOD_DATE:
            return inVisiblePeriod(now, actData);
        case Consts.ACTIVITY_OPEN_TYPE.SERVER_DAY:
            actData.openTick = getExpectServerDayOpenTick(actData.openingTime.day, actData.openingTime.hour, serverDay);
            return (now >= actData.openTick && now <= actData.openTick + lastTime);
        case Consts.ACTIVITY_OPEN_TYPE.DATE:
            actData.openTick = actData.openingTime.getTime();
            return (now >= actData.openTick && now <= actData.openTick + lastTime);
        case Consts.ACTIVITY_OPEN_TYPE.PERMANENT:
            return true;
    }
    return false;
}

function getLastTime(lastHour) {
    if (lastHour === -1) {
        return Number.POSITIVE_INFINITY;
    }
    return (lastHour * 60 * 60 * 1000);
}

/*
 *   根据指定时间，计算下一个周期的开放时间
 *   @param {Number}    refTick 参考时间点
 *   @param {String}    cron time string like '0 0 0 * * *'
 * */
function getNextOpenTick(refTick, openingTime) {
    var trigger = cronTrigger.createTrigger(openingTime);
    return trigger.nextExcuteTime(refTick);
}

/*
 *   计算指定时间是否在某一可见周期中
 *   @param {Number}    now
 *   @param {Number}    openingTimeType
 *   @param {String}    openingTime cron time string like '0 0 0 * * *'
 *   @param {Number}    lastHour
 *   @param {Number}    showHour
 * */
function inVisiblePeriod(now, actData) {
    var lastTime = getLastTime(actData.lastTime),
        lastPeriodTime;
    if (inPeriod(now, now, actData.openingTime, lastTime)) {
        actData.openTick = getNextOpenTick(now, actData.openingTime);
        return true;
    }
    logger.info('inVisiblePeriod now %s not in current period openingTime = %s, lastTime = %s, ', now,
        actData.openingTime, lastTime);
    lastPeriodTime = getLastPeriodTime(now, actData.openingTimeType);
    if (inPeriod(now, lastPeriodTime, actData.openingTime, lastTime)) {
        actData.openTick = getNextOpenTick(lastPeriodTime, actData.openingTime);
        return true;
    }
    return false;
}


function getExpectServerDayOpenTick(expectServerDay, expectHour, curServerDay) {
    var curTime = new Date(),
        diffDay = expectServerDay - curServerDay,
        mSecsPerDay = 24 * 60 * 60 * 1000;
    curTime.setTime(Date.now() + diffDay * mSecsPerDay);
    curTime.setHours(expectHour, 0, 0, 0);
    return curTime.getTime();
}

/*
 *   计算指定时间是否在某一周期中
 *   @param {Number}    now
 *   @param {Number}    refTick
 *   @param {String}    openingTime cron time string like '0 0 0 * * *'
 *   @param {Number}    lastTime
 * */
function inPeriod(now, refTick, openingTime, lastTime) {
    var nextOpenTick = getNextOpenTick(refTick, openingTime);
    return (now >= nextOpenTick && now <= nextOpenTick + lastTime);
}

/*
 *   计算周期性活动的周期
 *   @param {Number} refTime
 *   @return {Number}
 * */
function getLastPeriodTime(refTime, openingTimeType) {
    var curTime = new Date();
    curTime.setTime(refTime);
    switch (openingTimeType) {
        case Consts.ACTIVITY_OPEN_TYPE.PERIOD_DAY:
            return myUtils.getWeeksFrom(curTime, -1).getTime();
        case Consts.ACTIVITY_OPEN_TYPE.PERIOD_DATE:
            return myUtils.getMonthsFrom(curTime, -1).getTime();
        default :
            return refTime;
    }
}
