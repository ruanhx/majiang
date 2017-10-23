/**
 * Created by employee11 on 2016/2/1.
 */
var pomelo = require('pomelo'),
    _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename);

var consts = require('../../consts/consts'),
    flow = require('../../consts/flow'),
    Code = require('../../../shared/code'),
    dataUtils = require('../../util/dataUtils'),
    dataApi = require('../../util/dataApi'),
    dropUtils = require('../area/dropUtils');


var Manager = function (player) {
    this.player = player;
};

var pro = Manager.prototype;

module.exports = Manager;
pro.clearRrainMgr = function(){
    delete this.player;

    //this.dataVO.clearDataVO();
    delete this.dataVO;
}

var VO = function(){
    this.playerId = 0;

//收益步长  每 X 秒的收益 100倍
    this.gainStep = 0;

//训练值 100倍
    this.trainValue=0;

//花费加速次数  --每日清零
    this.freeCnt=0;

//花费加速次数  --每日清零
    this.costCnt=0;

//每日的重置时间
    this.clearFreeCntTime=0;

//上次设置训练值时间
    this.lastSetValTime=0;

//下次可以使用免费加速的时间
    this.nextFreeTime=0;


//*******  客户端逻辑 参数
    this.clickRemainCnt = 0;
    this.clickCoolEndTime = 0;
    this.lastGainClickTime = 0;
//*******

    this.serAwardMaxVal = 0;//当前收益最大值 ，不入库
}

pro.dataVO = new VO();//



var loadOk = false;

pro.reset = function(){
    this.dataVO.gainStep = 0;
    this.dataVO.trainValue = 0;
    this.dataVO.freeCnt = 0;
    this.dataVO.costCnt = 0;
    this.dataVO.clearFreeCntTime = Date.now();
    this.dataVO.lastSetValTime = Date.now();
    this.dataVO.nextFreeTime = Date.now();

    this.dataVO.clickRemainCnt = 0;
    this.dataVO.clickCoolEndTime =0;
    this.lastGainClickTime = 0;

    this.dataVO.serAwardMaxVal = 0;
    this.player.emit("saveTrain",this.dataVO);
}

/**
 * 加载模块数据
 * @param dbData
 */
pro.load = function(dbData){
    this.dataVO = new VO();
    if(dbData && dbData.length>0){
        this.dataVO = dbData[0];
        //logger.debug("加载train数据VO1:%j",this.dataVO);
    }else{
        this.dataVO.playerId = this.player.id;
        //logger.debug("加载train数据VO2:%j",this.dataVO);
    }
    loadOk = true;
    if(!this.player.funcOpen(consts.FUNCTION.TRAIN)){
        this.reset();
    }else{
        var customId = this.player.passedBarrierMgr.getNewBarrierId(Consts.CHAPTER_TYPE.NORMAL);
        if(customId > dataApi.TrainAttribute.getMaxCustomId()){
            customId = dataApi.TrainAttribute.getMaxCustomId();
        }
        var trainAttribute = dataApi.TrainAttribute.findById(customId);
        if(!trainAttribute)
            return;
        this.dataVO.serAwardMaxVal = trainAttribute.serAwardMaxVal;//设置当前收益最大值，因为不入库所以这个在加载的时候做
    }
}

//计算收益
pro.calculateTrainValue = function(limit){

    var now = Date.parse(new Date());
    var passSecond = parseInt((now - this.dataVO.lastSetValTime)/1000);//过去了多少秒
    if(!this.dataVO.lastSetValTime || this.dataVO.lastSetValTime == 0){
        //第一次调用谈不上结算
        this.dataVO.trainValue = 0;
        this.dataVO.lastSetValTime = now ;
    }else{
        //结算之前的训练值
        this.dataVO.trainValue += parseInt(passSecond/dataUtils.getOptionValue('AttackTargetTime',1)) * this.dataVO.gainStep;//累加训练值
        if(limit){
            //上限检测
            if(this.dataVO.serAwardMaxVal<this.dataVO.trainValue){
                this.dataVO.trainValue = this.dataVO.serAwardMaxVal;
            }
        }
        this.dataVO.lastSetValTime = now-  parseInt(passSecond%dataUtils.getOptionValue('AttackTargetTime',1))*1000 ;//退回到节点时间
    }

}

/**
 * 最高关卡刷新的时候调用
 * @param customId
 */
pro.groupUp = function(customId){
    if(!loadOk){
        //logger.debug("train 还没加载成功");
        return;
    }
    if(!this.player.funcOpen(consts.FUNCTION.TRAIN)){
        return;
    }
    if(customId > dataApi.TrainAttribute.getMaxCustomId()){
        customId = dataApi.TrainAttribute.getMaxCustomId();
    }
    var trainAttribute = dataApi.TrainAttribute.findByIndex({customId:customId});
    if(!trainAttribute || trainAttribute.length===0){
        logger.error("trainAttribute 不存在记录 customId=%d",customId);
        return;
    }
    var newGainStep = Math.floor((trainAttribute.awardValueTime/36)*dataUtils.getOptionValue('AttackTargetTime',1));
    if(newGainStep <= this.dataVO.gainStep) return;//收益步长不足以更新  -- 说明关卡不是最新关卡
    this.calculateTrainValue(true);//检测上限的计算产值

    this.dataVO.gainStep = newGainStep;//更新收益步长
    //logger.error("trainAttribute 通关关卡更新训练值 this.dataVO.gainStep=%d",this.dataVO.gainStep);
    this.player.emit("saveTrain",this.dataVO);
    //推送给客户端
    //logger.debug("给客户端推送训练模块：trainVO：%j,读json的trainAttribute：%j",this.dataVO,trainAttribute);
    //this.player.pushMsg('train.trainVO', {trainVO:this.dataVO});
}

/**
 * 获取模块数据
 */
pro.getInfo = function(){
    //logger.error("trainAttribute 客户端获取关卡模块数据 this.dataVO=%j",this.dataVO);
    return this.dataVO;
}

/**
 * 点点点收益
 */
pro.clickGain = function(args){// startTime ,endTime ，clickCnt    ,clickRemainCnt ,clickCoolEndTime

    if(!this.player.funcOpen(consts.FUNCTION.TRAIN)){
        return Code.FAIL;
    }
    var customId = this.player.passedBarrierMgr.getNewBarrierId(Consts.CHAPTER_TYPE.NORMAL);
    if(customId > dataApi.TrainAttribute.getMaxCustomId()){
        customId = dataApi.TrainAttribute.getMaxCustomId();
    }
    var trainAttribute = dataApi.TrainAttribute.findByIndex({customId:customId});
    if(!trainAttribute || trainAttribute.length===0){
        logger.error("trainAttribute 不存在记录 customId=%d",customId);
        return Code.FAIL;
    }

    if(this.dataVO.lastGainClickTime > args.endTime){//防止重复发送，重复领取
        return Code.FAIL;
    }

    var serClickMax = (args.endTime - args.startTime)/dataUtils.getOptionValue('ClickCd',1);//理论最大值
    if(serClickMax+1<args.clickCnt){
        logger.error("点点点玩家作弊~~~");
        return Code.FAIL;
    }



    this.dataVO.trainValue += trainAttribute.touchAwardValue * args.clickCnt * 100;//因为记录的是100倍训练值所以要再*100
    //上限检测
    if(trainAttribute.serAwardMaxVal<this.dataVO.trainValue){
        this.dataVO.trainValue = trainAttribute.serAwardMaxVal;
    }
    //保存客户端逻辑数据
    this.dataVO.clickRemainCnt = args.clickRemainCnt;
    this.dataVO.clickCoolEndTime = args.clickCoolEndTime;
    this.dataVO.lastGainClickTime = Date.now();
    this.player.emit("saveTrain",this.dataVO);
    return Code.OK;
}

/**
 *加速
 */
pro.quicken = function(args){
    if(!this.player.funcOpen(consts.FUNCTION.TRAIN)){
        return Code.FAIL;
    }
    //背包检测放外面就好了，反正只是粗略检测
    var canFree = false;
    var now = Date.parse(new Date());
    if(this.dataVO.freeCnt<dataUtils.getOptionValue('FreeAward',1)){
        if(this.dataVO.nextFreeTime < now){
            //可以免费
            canFree = true;
        }
    }
    if(!canFree){
        if(args.type != 1){
            logger.debug("quicken 参数类型错误 type:%d",args.type);
            return Code.FAIL;
        }
        //花钱
        var costList = dataUtils.getOptionList('AwardCostSeries','#');
        var index = this.dataVO.costCnt;
        if(index>=costList.length)
            index= costList.length-1;
        if(this.player.diamondCnt < costList[index]){
            logger.debug("赶紧充钱 ，不充钱还想加速~  等到猴年马月吧");
            return Code.FAIL;
        }
        this.dataVO.costCnt++;
        this.player.set("diamondCnt",this.player.diamondCnt - costList[index]);
    }else{
        if(args.type != 0){
            logger.debug("quicken 参数类型错误 type:%d",args.type);
            return Code.FAIL;
        }else{
            this.dataVO.nextFreeTime = Date.now() + dataUtils.getOptionValue('FreeAwardTime',1)*1000;
            this.dataVO.freeCnt++;
        }
    }
    var tempValue = this.dataVO.trainValue;
    //添加训练值
    this.dataVO.trainValue += parseInt(dataUtils.getOptionValue('AccelerateTime',1)/dataUtils.getOptionValue('AttackTargetTime',1)) * this.dataVO.gainStep;//累加训练值
    //logger.debug("加速训练值计算 trainValue+(AccelerateTime/AttackTargetTime)*gainStep = @ %j+=(%j/%j)*%j  rs=%j ",tempValue ,dataUtils.getOptionValue('AccelerateTime',1),dataUtils.getOptionValue('AttackTargetTime',1),this.dataVO.gainStep,this.dataVO.trainValue);
    this.player.emit("saveTrain",this.dataVO);
    return Code.OK;
}

/**
 * 领取收益
 */
pro.gain = function(limit){
    if(!this.player.funcOpen(consts.FUNCTION.TRAIN)){
        return Code.FAIL;
    }
    //背包检测放外面就好了，反正只是粗略检测
    var awardModelList = dataApi.TrainAward.getDataList();
    var dropItems = [];
    this.calculateTrainValue(limit);//计算训练值
    var tempValue = Math.floor(this.dataVO.trainValue/100);//整数位
    var afterPoint = this.dataVO.trainValue % 100;//小数位
    var tempNum = 0;
    //计算掉落
    for(var i=awardModelList.length-1; i>=0; i--){
        tempNum = parseInt(tempValue/awardModelList[i].awardValue);
        if(tempNum==null){
            logger.error("drops num=null : tempValue=%j,awardModelList[i].awardValue=%j,i=%j",tempValue,awardModelList[i].awardValue,i);
        }
        if(tempNum == 0) continue;
        dropItems = _.union(dropItems,dropUtils.getDropItemsByCount(awardModelList[i].award,tempNum));
        //logger.debug("兑换训练值得到：掉落id：%j,数量：%j  此时i=%j,兑换面值=%j,剩余训练值=%j",awardModelList[i].award,tempNum,i,awardModelList[i].awardValue,tempValue);
        //dropItems.push(dropUtils.getDropItemsByCount(awardModelList[i].award,tempNum));
        tempValue = parseInt(tempValue % awardModelList[i].awardValue);
    }
    if(dropItems.length==0){
        logger.error("没有奖励 打印奖励表TrainAward：%j",awardModelList);
        //return {code:Code.FAIL};
    }
    //给予奖励
    var drops = this.player.applyDrops(dropItems,null,flow.ITEM_FLOW.TRAIN_GAIN);
    //清空训练值
    this.dataVO.trainValue = tempValue * 100 + afterPoint;//整数位加小数位
    //this.dataVO.lastSetValTime = parseInt(new Date());
    this.player.emit("saveTrain",this.dataVO);
    return {code:Code.OK,drops:drops};
}

pro.dailyClean = function(){
    this.dataVO.freeCnt=0;
    this.dataVO.costCnt=0;
    this.dataVO.clearFreeCntTime=Date.parse(new Date());
    this.player.emit("saveTrain",this.dataVO);
}

pro.dailyCleanOffline = function () {
    var trigger = pomelo.app.get('cronManager').getTriggerById(consts.AREA_CRON.RESET_TRAIN_FREE_CNT),
        nextExecuteTime, now = Date.now();
    if (!this.dataVO.clearFreeCntTime) {
        // 第一次
        this.dailyClean();
        return;
    }
    if (!!trigger && !!this.dataVO.clearFreeCntTime) {
        nextExecuteTime = trigger.nextExcuteTime(this.dataVO.clearFreeCntTime);
        if (nextExecuteTime < now) {
            this.dailyClean();
        }
    }
};