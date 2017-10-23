/**
 * Created by tony on 2017/2/28.
 */

var pomelo = require('pomelo'),
    logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var dataApi = require('../../util/dataApi');
var dataUtils = require('../../util/dataUtils'),
    utils = require('../../util/utils'),
    consts = require('../../consts/consts'),
    flow = require('../../consts/flow');
var RandomShop = function (player) {
    this.player = player;
    this.refreshCnt = 0;
    this.progress = 0;
    this.createTime = 0;
    this.closeTime = 0;
    this.historyCnt = 0;
    this.isFrist = false;
};

var pro = RandomShop.prototype;
pro.clearRandomShop = function(){
    delete this.player;
    delete this.refreshCnt;
    delete this.progress;
    delete this.createTime;
    delete this.closeTime;
    delete this.historyCnt;
    delete this.isFrist;
}

pro.getData = function () {
    return {
        playerId: this.player.id,
        createTime: this.createTime,
        closeTime: this.closeTime,
        goodsDataList: JSON.stringify(this.goodsDataList),
        refreshCnt : this.refreshCnt,
        progress:this.progress,
        historyCnt:this.historyCnt,
        shopId:this.shopId
    };
};

pro.getClientInfo = function () {
    if(!this.isHave()){
        return {};
    }

    var shopData = dataApi.Shop.findById(this.shopId);
    if(shopData==null){
        this.moneyShow = [];
    }
    else{
        this.moneyShow = shopData.moneyShow;
    }
    return {
        createTime: this.createTime,
        closeTime: this.closeTime,
        goodsDataList: this.goodsDataList,
        refreshCnt : this.refreshCnt,
        progress:this.progress,
        moneyShow:this.moneyShow
    };
};

pro.load = function (dbShopInfo) {
    if( null == dbShopInfo ){
        this.isFrist = true;
        return;
    }
    this.isFrist = false;
    this.createTime = dbShopInfo.createTime;
    this.closeTime = dbShopInfo.closeTime;
    this.goodsDataList =JSON.parse(dbShopInfo.goodsDataList) ;
    this.refreshCnt = dbShopInfo.refreshCnt;
    this.progress = dbShopInfo.progress;
    this.historyCnt= dbShopInfo.historyCnt;
    this.shopId = dbShopInfo.shopId;
};

pro.save = function () {
    this.player.emit('saveRandomShop', this.getData());
};

/*
 * 通过无尽的进度获取物品索引id
 * */
pro.getGoodsIdByProgress = function () {
    var groupList = dataUtils.getOptionList('EndlessShopProgressShopId','#');
    var  i , l = groupList.length;
    var indexList = [];
    var valueList = [];
    for( i = 0 ; i < l ; ++i ){
        var indexAndValue = utils.parseParams( groupList[i], '&');
        indexList.push(indexAndValue[0]);
        valueList.push(indexAndValue[1]);
    }
    var endless_ProgressClips = dataUtils.getOptionValue('Endless_ProgressClips',3);//[138831]BUG：新号，无尽随机商店，执行刷新后，商品没有刷新（重启客户端也没有）！旧号刷新的时候，商品会刷新。
    var pos = _.sortedIndex(indexList,this.progress/endless_ProgressClips);
    pos = pos>=l ? (l-1) : pos;
    return valueList[pos];
};

/**
 * 获取要随机的商店索引ID
 * * progress：无尽进度
 * */
pro.getGoodsindexList = function () {
    var EndlessShopIdGroup = dataUtils.getOptionList('EndlessShopId','#');
    var list = [];
    var id = 0;
    //无尽随机商店--前面几次读取的商店id
    if( this.historyCnt < EndlessShopIdGroup.length ){
        var data =  utils.parseParams( EndlessShopIdGroup[this.historyCnt], '&');
        //shop.js的id
        id = data[1];
    }else{
        id = this.getGoodsIdByProgress(this.progress );
    }

    //shop.js
    var shopData = dataApi.Shop.findById(id);
    if(shopData==null){
        return null;
    }
    var goodsIndex =  utils.parseParams( shopData.goodsIndex, '#');
    this.shopId = id;
    return goodsIndex;
};

/**
 * 权重随机
 * */
pro.weightRand = function (goodsDataList) {
    if(null==goodsDataList){
        logger.warn("weightRand is error goodsDataList is null");
        return null;
    }

    if(_.size(goodsDataList) == 1 ){
        return goodsDataList[0];
    }
    var rateTatal = 0;
    _.each(goodsDataList,function (data) {
        data.rateBf = rateTatal;
        rateTatal += data.rate;
        data.rateAf = rateTatal;
    });

    var myRand = _.random(0,rateTatal*100000)*0.00001;
    var randomData  = _.filter( goodsDataList,function (data) {
        return data.rateBf<=myRand && data.rateAf>myRand;
    });
    if(_.size(randomData)>0){
        return randomData[0];
    }
    logger.warn('weightRand() is error');
    return null;
};

/**
 * 商品表数据列表
 * */
pro.getGoodsDataList = function () {
    var self = this;
    var goodsIndexList = this.getGoodsindexList( this.progress  );
    if(goodsIndexList == null){
        return null;
    }
    var resultList = [];
    _.each(goodsIndexList,function (index) {
        var goodsDataList = dataApi.Goods.findByIndex({index:index});
        if(!_.isArray(goodsDataList)){
            goodsDataList = [goodsDataList];
        }
        var tmp =  self.weightRand(goodsDataList);//_.sample(goodsDataList);
        tmp.buyCnt = 0;
        resultList.push(tmp);
    });
    return resultList;
};

/**
 * 随机商品
 * * progress：无尽进度
 * */
pro.randShopGoodsIdList = function ( progress, needUpdateTime) {
    needUpdateTime = needUpdateTime != null ? needUpdateTime : true;//默认需要更新时间 --[138832]BUG：随机商店，执行刷新的时候，不应该重置商店存在时间。
    this.isFrist = false;
    if(needUpdateTime){
        this.createTime = Date.now();
        this.closeTime = this.createTime + dataUtils.getOptionValue('EndlessShopTime',1) * 60 * 60 * 1000; //无尽随机商店--出现后可以存在的时长，单位小时。
    }
    var goodsDataList = this.getGoodsDataList(this.progress );
    if(goodsDataList!=null){
        this.goodsDataList = goodsDataList;
    }
};

/**
 * 获得全新随机商店数据（无尽退出时使用）
 * * progress：无尽进度
 * */
pro.doNewShop = function (progress , oldHighBarr) {
    //表示商店已经存在不与随机
    if( this.isHave() ){
        return {};
    }
    //无尽随机商店--每次无尽挑战结束触发无尽随机商店的几率80
    var EndlessShopRate = dataUtils.getOptionValue('EndlessShopRate',0.1);
    /*if(!this.isFrist){//随机商店，首次打无尽触发的随机商店的逻辑，不要了。
        var randNum = _.random(0,1000)*0.001;
        //未随机到
        if( EndlessShopRate <= randNum){
            return {};
        }
    }*/

    //[139007]改进：无尽随机商店，服务端相关逻辑修改。
    if(this.player.endlessSingleHighBarr >= dataUtils.getOptionValue('EndlessShopProgressCondition',6)) {//达到指定关数，才有几率触发随机商店
        if(oldHighBarr >= dataUtils.getOptionValue('EndlessShopProgressCondition',6)){//非首次   [139277]BUG：无尽随机商店，现在设置的是进度达到第九小关出现，，但实际测试过程中，并不会出现。
            var randNum = _.random(0,1000)*0.001;
            //未随机到
            if( EndlessShopRate <= randNum){
                return {};
            }
        }
        else{//首次达到指定关数，必出
            logger.info("randshop first get playerId=%d", this.player.id);
        }
    }
    else{
        return {};
    }


    this.historyCnt += 1;
    this.historyCnt = Math.min(this.historyCnt,99);
    this.refreshCnt = 0;
    if(this.progress < progress){
        this.progress = progress;
    }
    this.randShopGoodsIdList(progress);
    this.save();
    return this.getClientInfo();
};

/*刷新商店
* progress：无尽进度
* */
pro.refreshShop = function () {
    this.randShopGoodsIdList( this.progress ,false );
    this.historyCnt += 1;
    this.historyCnt = Math.min(this.historyCnt,99);
    this.refreshCnt += 1;
    this.save();
};

/*
 * 刷新需要的货币是否足够
 * */
pro.isMoneyRefersh = function () {
    var myMoney = this.player.getMoneyByType(consts.MONEY_TYPE.DIAMOND);
    return myMoney>=this.refreshNeedMoney();
};

/*
* 刷新需要的货币
* */
pro.refreshNeedMoney = function () {
    var groupList = dataUtils.getOptionList('EndlessShopResetMoney','#');
    var  i , l = groupList.length;
    var indexList = [];
    var valueList = [];
    for( i = 0 ; i < l ; ++i ){
        var indexAndValue = utils.parseParams( groupList[i], '&');
        indexList.push(indexAndValue[0]);
        valueList.push(indexAndValue[1]);
    }
    var pos = _.sortedIndex(indexList,this.refreshCnt+2);// +2是为了找到正确的索引
    //pos = pos>=l ? (l-1) : pos;
    pos = Math.max((pos - 1),0);
    return valueList[pos];
};

/*
* 是否存在随机商店
* */
pro.isHave = function () {
    if(   this.closeTime == null || (this.closeTime!=null && this.closeTime==0) ){
        return false;
    }
    if( this.closeTime <= 0 ){
        return false;
    }
    return this.closeTime > Date.now();
};

pro.isFrist = function () {
    return this.isFrist;
};

/*
* 随机商店的关闭时间 ：为0没有随机商店 、大于当前时间 表示商店已经关闭
* */
pro.getCloseTime = function () {
    if( this.isHave() ){
        return this.closeTime;
    }else{
        return 0;
    }
};

/**
 * 是否有在出售此商品
 * */
pro.isCanBuyGoodsId = function (goodsId) {
    if(!this.isHave()){
        return false;
    }
    var goodsList = _.find(this.goodsDataList,function (data) {
       return goodsId == data.id;
    });
    return _.size(goodsList)>0;
};

pro.addGoodBuyCount = function (goodsId) {
    var buyCnt = 0;
    _.each(this.goodsDataList,function (data) {
        if(goodsId == data.id ){
            data.buyCnt += 1;
            buyCnt =data.buyCnt;
        }
    });
    this.save();
    return buyCnt;
};

/*
 *   是否限制购买
 * */
pro.isLimited = function (goodsId) {
    var goodsData = dataApi.Goods.findById(goodsId);
    if (!!goodsData && !!goodsData.buyLimit) {
        return !this.player.passedBarrierMgr.isPassed(goodsData.buyLimitId);
    }
    return false;
};

/*
 * 购买需要的货币是否足够
 * */
pro.isEnoughMoneyBuy = function ( goodsId ) {
    var goodsData = dataApi.Goods.findById(goodsId);
    if(goodsData.priceType == 0 && goodsData.price == 0 ){
        return true;
    }
    return this.player.isEnoughSomeTypeMoney(goodsData.priceType,goodsData.price);
};


pro.isBagFull = function (goodsId) {
    var goodsData = dataApi.Goods.findById(goodsId);
    if (!goodsData) {
        return true;
    }
    return this.player.isBagFull(goodsData.type, goodsData.typeId, goodsData.unit);
};

/*
* 下发获得的商品
* */
pro.handover = function (goodsId) {
    var goodsData = dataApi.Goods.findById(goodsId);
    if (!goodsData) {
        return false;
    }

    this.player.setMoneyGroup(goodsData.priceType,goodsData.price,consts.USE_DIAMOND_STTE.SHOP_BUY,goodsId);
    this.player.applyDrops([{dropType: goodsData.type, itemId: goodsData.typeId, count: goodsData.unit}],flow.ITEM_FLOW.RANDOM_SHOP_BUG);
    return true;
};

module.exports.get = function (player) {
    if (!player.randomShop) {
        player.randomShop = new RandomShop(player);
    }
    return player.randomShop;
};