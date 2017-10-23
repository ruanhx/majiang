/**
 * Created by kilua on 2016/6/30 0030.
 */

var pomelo = require('pomelo'),
    logger = require('pomelo-logger').getLogger(__filename),
    consts = require('../../consts/consts'),
    flow = require('../../consts/flow'),
    _ = require('underscore');

var dataApi = require('../../util/dataApi');

var PlayerShop = function (player) {
    this.player = player;
};

var pro = PlayerShop.prototype;
pro.clearShop = function(){
    delete this.player;
    delete this.resetTick;

    for(var key in this.buyRecordDict){
        var buyRecord = this.buyRecordDict[key];
        delete this.buyRecordDict[key];
    }
    delete this.buyRecordDict;
}

pro.getData = function () {
    return {
        playerId: this.player.id,
        resetTick: this.resetTick,
        buyRecordDict: this.buyRecordDict
    };
};

pro.load = function (dbShopInfo) {
    this.resetTick = dbShopInfo.resetTick;
    this.buyRecordDict = dbShopInfo.buyRecordDict;
};

pro.save = function () {
    this.player.emit('playerShop.save', this.getData());
};

pro.reset = function (curTick) {
    this.resetTick = curTick || Date.now();
    this.buyRecordDict = {};
    this.player.pushMsg('playerShop.refreshBuyCount', {records: []});
    this.save();
};

pro.processOfflineReset = function () {
    var trigger = pomelo.app.get('cronManager').getTriggerById(consts.AREA_CRON.RESET_REVIVE_CNT),
        nextExecuteTime, now = Date.now();
    if (!this.resetTick) {
        // 第一次
        this.reset();
        return;
    }
    if (!!trigger && !!this.resetTick) {
        nextExecuteTime = trigger.nextExcuteTime(this.resetTick);
        logger.debug('processOfflineReset %s', new Date(this.resetTick).toString());
        if (nextExecuteTime < now) {
            this.reset();
        }
    }
};

pro.addGoodBuyCount = function (goodsId, addCnt) {
    var goodData = dataApi.Goods.findById(goodsId);
    if (!goodData || goodData.dailyMax === -1) {
        // 优化:每日购买次数为-1，表示无每日购买限制，不保存购买次数
        return;
    }
    if (!this.buyRecordDict[goodsId]) {
        this.buyRecordDict[goodsId] = 0;
    }
    this.buyRecordDict[goodsId] += addCnt;
    this.player.pushMsg('playerShop.refreshBuyCount', {
        records: [{
            goodsId: goodsId,
            dailyCnt: this.buyRecordDict[goodsId]
        }]
    });
    this.save();
};

pro.getBuyCount = function (goodsId) {
    return this.buyRecordDict[goodsId] || 0;
};

pro.reachDailyMax = function (goodsId) {
    var goodsData = dataApi.Goods.findById(goodsId);
    if (goodsData.dailyMax !== -1) {
        return this.getBuyCount(goodsId) >= goodsData.dailyMax;
    }
    return false;
};

/*
 *   是否限制购买
 * */
pro.isLimited = function (goodsId) {
    var goodsData = dataApi.Goods.findById(goodsId);
    if (!!goodsData && !!goodsData.buyLimit) {
        if(goodsData.buyLimit == consts.SHOP_LIMIT_TYPE.BARRIER_PASSED){
            return !this.player.passedBarrierMgr.isPassed(goodsData.buyLimitId);
        }
        else if(goodsData.buyLimit == consts.SHOP_LIMIT_TYPE.ENDLESS_REACH){//[139009]改进：普通商店的商品，也需要增加支持一个商品同时需要消耗多种货币来购买的逻辑。同时增加一种购买限制类型“无尽历史最高关数”。
            return this.player.endlessSingleHighBarr < goodsData.buyLimitId;
        }
    }
    return false;
};

/*
 *   商店信息是否需要刷新
 * */
pro.shouldRefresh = function (goodsId, type, typeId, unit, priceType, price) {
    var goodsData = dataApi.Goods.findById(goodsId);
    return (!goodsData || goodsData.type !== type || goodsData.typeId !== typeId
    || goodsData.unit !== unit || goodsData.priceType+"" !== priceType || goodsData.price+"" !== price);
};

pro.getClientInfo = function () {
    var pages = [], self = this;
    _.each(dataApi.Shop.all(), function (pageData) {
        if( consts.SHOP_TYPE.GENERAL == pageData.shopType){
            var page = {};
            pages.push(page);
            // 页面基本信息
            page.shopId = pageData.shopId;
            page.id = pageData.id;
            page.name = pageData.name;
            page.moneyShow = pageData.moneyShow;
            page.goodsIndex = pageData.goodsIndex;
            page.type = pageData.type;
            page.shopType = pageData.shopType;

            // 页面商品列表
            page.goods = [];
            var goodDatas = dataApi.Goods.findByIndex({"index": pageData.goodsIndex}) || [];

            if(!_.isArray(goodDatas)){
                goodDatas=[goodDatas];
            }
            // 商品排序,从小到大
            _.sortBy(goodDatas, function (goodData) {
                return goodData.sort;
            });
            _.each(goodDatas, function (goodData) {
                var goodInfo = {};
                page.goods.push(goodInfo);
                goodInfo.id = goodData.id;
                goodInfo.index = goodData.index;
                goodInfo.type = goodData.type;
                goodInfo.typeId = goodData.typeId;
                goodInfo.unit = goodData.unit;
                goodInfo.dailyMax = goodData.dailyMax;
                // 已购买次数
                goodInfo.dailyCnt = self.getBuyCount(goodInfo.id);
                goodInfo.priceType = goodData.priceType;
                goodInfo.price = goodData.price;
                goodInfo.rate = goodData.rate;
                goodInfo.sort = goodData.sort;
                goodInfo.pic = goodData.pic;
                goodInfo.buyLimit = goodData.buyLimit;
                goodInfo.buyLimitId = goodData.buyLimitId;
            });
        }
    });
    pages.sort(function (pageA, pageB) {
        return pageA.id - pageB.id;
    });
    return pages;
};

pro.isBagFull = function (goodsId) {
    var goodsData = dataApi.Goods.findById(goodsId);
    if (!goodsData) {
        return true;
    }
    return this.player.isBagFull(goodsData.type, goodsData.typeId, goodsData.unit);
};

pro.handover = function (goodsId) {
    var goodsData = dataApi.Goods.findById(goodsId);
    if (!goodsData) {
        return false;
    }
    this.player.applyDrops([{dropType: goodsData.type, itemId: goodsData.typeId, count: goodsData.unit}],null,flow.ITEM_FLOW.PLAYER_SHOP_BUG);
    return true;
};

module.exports.get = function (player) {
    if (!player.shop) {
        player.shop = new PlayerShop(player);
    }
    return player.shop;
};