/**
 * Created by Administrator on 2016/3/10 0010.
 */

var pomelo = require('pomelo'),
    _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename);

var consts = require('../../consts/consts'),
    flow = require('../../consts/flow');
    Code = require('../../../shared/code'),
    dataUtils = require('../../util/dataUtils'),
    dataApi = require('../../util/dataApi'),
    dropUtils = require('./dropUtils');

var Manager = function (player) {
    this.player = player;
    this.VO.playerId = this.player.id;
};

var pro = Manager.prototype;

module.exports = Manager;
pro.clearCatchTreasureManager = function(){
    delete this.player;

    delete this.VO;
}

var VO = function(data){
    this.playerId = data.playerId||0;
    this.inGame = data.inGame||0;
//pro.radomCode = 0;//抓取随机码
    this.buyCount = data.buyCount||0;//购买次数
    this.isFog = data.isFog||0;//是否迷雾模式
};

pro.VO = new VO({});


pro.load = function(dbData){
    this.VO = new VO({});
    this.VO.playerId = this.player.id;
    if(dbData && dbData.length>0){
        this.VO = new VO(dbData[0]);
        //logger.debug("加载抓宝数据 %j",this.VO);
    }
}

//进入游戏
pro.joinGame = function(){
    this.VO.inGame = 1;
    this.VO.buyCount = 0;
    //是否通关某关卡
    var miniGameData = dataApi.MiniGame.findById(consts.MINI_GAME_ID.CATCH_TREASURE);
    // 检查前置关卡是否通过
    var openCustomId = miniGameData.customId;
    var canEnter = 1;
    if (openCustomId && !this.player.passedBarrierMgr.isPassed(openCustomId)) {
        return {code:Code.AREA.INVALID_CATCH_TREATURE_CUSTOM};
    }
    //获取进入所需要的货币
    //判断货币是否足够
    var haveMoney = this.player.getMoneyByType(miniGameData.moneyType);
    if(miniGameData.moneyNum >  haveMoney){
        return {code:Code.AREA.LACK_MONEY};
    }
    //扣除货币
    this.player.setMoneyByType(miniGameData.moneyType, haveMoney - miniGameData.moneyNum, flow.MONEY_FLOW_COST.JOIN_CATCH_GAME);

    this.player.addMiniGameJoinCnt(consts.MINI_GAME_ID.CATCH_TREASURE);
    var beforeFogCnt = this.player.getMiniGameJoinFieldVal(consts.MINI_GAME_ID.CATCH_TREASURE, 'beforeFogCnt');
    this.player.setMiniGameJoinFieldVal(consts.MINI_GAME_ID.CATCH_TREASURE,'beforeFogCnt',beforeFogCnt+1);
    var catchMistTimes = dataUtils.getOptionList('Catch_MistTimes',"#");
    if(catchMistTimes){
        var index = beforeFogCnt % catchMistTimes.length;
        var times = catchMistTimes[index];
        var randValue = parseInt(Math.random()*10000);
        if(times*10000>randValue){
            this.VO.isFog = 1;
            this.player.setMiniGameJoinFieldVal(consts.MINI_GAME_ID.CATCH_TREASURE,'beforeFogCnt',0);
        }else{
            this.VO.isFog = 0;
        }
    }
    //this.VO.isFog = 1;//TODO:测试强制为迷雾模式
    this.player.emit('saveCatchTreasure',this.VO);
    return {code:Code.OK,isFog:this.VO.isFog};
}

//结束游戏
pro.overGame = function(treasureList,score,playCnt,md5){
    if(this.VO.inGame != 1)
        return {code:Code.AREA.CATCH_TREATURE_STATUS_ERR};
    if(playCnt > this.VO.buyCount + dataUtils.getOptionValue('Catch_InitialTime',5)){
        return {code:Code.AREA.CATCH_TREATURE_CHECK_ERR};
    }
    //作弊判断
    if(!this.checkResult(treasureList,score,md5))
        return {code:Code.AREA.CATCH_TREATURE_CHECK_ERR};
    //更新最高分
    this.player.updateCatchHighScore(score);
    //更新排行榜 放外面吧
    //结算奖励
    var scoreValue = dataUtils.getOptionValue('Catch_ScoreValue',0.2);
    var gain = Math.ceil(score*scoreValue);

    var catchMoneyType = dataUtils.getOptionValue('Catch_GetMoneyType',consts.MONEY_TYPE.DIAMOND);
    var haveMoney = this.player.getMoneyByType(catchMoneyType);
    this.player.setMoneyByType(catchMoneyType, haveMoney + gain, flow.MONEY_FLOW_GAIN.CATCH_GAIN);
    this.VO.inGame = 0;
    this.player.emit('saveCatchTreasure',this.VO);
    return {code:Code.OK,moneyType:catchMoneyType,moneyCnt:gain};
}

//购买次数
pro.buyOnePlayCount = function(){

    var catchPriceList = dataUtils.getOptionList('Catch_TimePrice',"#");
    var maxBuyCount = catchPriceList.length||0;
    //判断是否购买上限
    if(maxBuyCount - this.VO.buyCount <= 0 ){
        logger.debug("购买次数抓宝次数不够：-- catchPriceList：%j",catchPriceList);
        return {code:Code.AREA.CATCH_TREATURE_BUY_COUNT_NO};
    }
    //判断钻石是否足够
    var haveMoney = this.player.getMoneyByType(consts.MONEY_TYPE.DIAMOND);
    var cost = catchPriceList[this.VO.buyCount];
    if(cost >  haveMoney){
        return {code:Code.AREA.LACK_MONEY};
    }
    this.player.setMoneyByType(consts.MONEY_TYPE.DIAMOND,haveMoney-cost,flow.MONEY_FLOW_COST.CATCH_COUNT_BUY);
    this.VO.buyCount++;
    this.player.emit('saveCatchTreasure',this.VO);
    return {code:Code.OK};
}
//结果验证
pro.checkResult = function(treasureList,score,md5){
    var checkMaxCount = true;
    var scoreServer = 0;
    var tempHunterItemAttributeData;
    for(var i= 0;i<treasureList.length;i++){
        checkMaxCount &= (treasureList[i].num <= (dataApi.HunterItemRefresh.getMaxCntByTreasureId(treasureList[i].id)||0));
        if(!checkMaxCount){
            logger.error("checkMaxCount 验证失败 treasureList[i].num：%d ,getMaxCntByTreasureId:%d",treasureList[i].num,dataApi.HunterItemRefresh.getMaxCntByTreasureId(treasureList[i].id));
            break;
        }
        tempHunterItemAttributeData = dataApi.HunterItemAttribute.findById(treasureList[i].id);
        if(tempHunterItemAttributeData){
            if(this.VO.isFog == 1){
                scoreServer += Math.floor((tempHunterItemAttributeData.score||0) * dataUtils.getOptionValue('Catch_MistScoreRate',1.5)) * (treasureList[i].num || 0) ;
            }else{
                scoreServer += (tempHunterItemAttributeData.score||0) * (treasureList[i].num || 0);
            }

        }

    }
    if(checkMaxCount && (scoreServer == score)){
        return true;
    }
    logger.error("验证失败 checkMaxCount：%d ,scoreServer:%d , score:%d",checkMaxCount,scoreServer,score);
    return false;
}


pro.rankScoreReset = function(){
    this.player.set("catchHighScore",0);
    this.player.set('lastCleanCatchTreasure',Date.parse(new Date()));
}

pro.rankScoreResetOffLine = function(){
    var trigger = pomelo.app.get('cronManager').getTriggerById(consts.AREA_CRON.RESET_CATCHTREASURE),
        nextExecuteTime, now = Date.now();
    if (!this.player.lastCleanCatchTreasure) {
        // 第一次
        this.rankScoreReset();
        return;
    }
    if (!!trigger && !!this.player.lastCleanCatchTreasure) {
        nextExecuteTime = trigger.nextExcuteTime(this.player.lastCleanCatchTreasure);
        //logger.debug('processOfflineReset %s', new Date(this.player.lastCleanActivityEctype).toString());
        if (nextExecuteTime < now) {
            this.rankScoreReset();
        }
    }
}




