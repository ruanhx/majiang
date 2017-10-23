/**
 * Created by kilua on 2016/6/22 0022.
 * 折扣商店
 */

var util = require('util');

var _ = require('underscore');

var Activity = require('../playerActivity'),
    dataApi = require('../../../util/dataApi'),
    playerActionLog = require('../../../dao/playerActionLogDao');

var DiscountShop = function (manager, player, actData) {
    Activity.call(this, manager, player, actData);
    this.buyRecordDict = {};
};

util.inherits(DiscountShop, Activity);

var pro = DiscountShop.prototype;

pro.needInitialize = function () {
    return false;
};

pro.init = function () {
    return false;
};

pro.getDetailInfo = function () {
    return {items: this.getItemList()};
};

pro.getDetailData = function () {
    return {buyRecordDict: this.buyRecordDict};
};

pro.loadDetail = function (detail) {
    this.buyRecordDict = detail.buyRecordDict || {};
};

pro.haveAwardsToDraw = function () {
    return false;
};

/*
 *   获取物品的购买次数
 * */
pro.getBuyCount = function (goodsId) {
    return this.buyRecordDict[goodsId] || 0;
};

pro.addGoodBuyCount = function (goodsId, addCnt) {
    var goodData = dataApi.ActivityGoods.findById(goodsId);
    playerActionLog.logDiscountShopPurchase(this.player, this.id, goodsId);
    if (!goodData || goodData.max === -1) {
        // 优化:购买次数为-1，表示无购买限制，不保存购买次数
        return;
    }
    if (!this.buyRecordDict[goodsId]) {
        this.buyRecordDict[goodsId] = 0;
    }
    this.buyRecordDict[goodsId] += addCnt;
    this.save();
    this.refreshRedSpot();
};

pro.getItemList = function () {
    var self = this,
        typeId = this.getTypeId(),
        goodsList = dataApi.ActivityGoods.findByIndex({id: typeId}),
        goods = [];
    if (!_.isArray(goodsList)) {
        goodsList = [goodsList];
    }
    // 商品排序,从小到大
    _.sortBy(goodsList, function (goodData) {
        return goodData.sort;
    });
    goodsList.forEach(function (goodData) {
        var goodInfo = {};
        goods.push(goodInfo);
        // 商品信息
        goodInfo.priceOld = goodData.priceOld;
        goodInfo.id = goodData.goodsId;
        goodInfo.type = goodData.type;
        goodInfo.typeId = goodData.typeId;
        goodInfo.unit = goodData.unit;
        goodInfo.max = goodData.max;
        // 已购买次数
        goodInfo.buyCnt = self.getBuyCount(goodInfo.id);
        goodInfo.priceType = goodData.priceType;
        goodInfo.price = goodData.price;
        goodInfo.pic = goodData.pic;
        goodInfo.buyLimit = goodData.buyLimit;
        goodInfo.buyLimitId = goodData.buyLimitId;

    });
    return goods;
};

/*
 *   查找商品信息
 * */
pro.getGoodsById = function (goodsId) {
    var goodsList = this.getItemList(),
        goodsbyId = _.indexBy(goodsList, 'id');
    return goodsbyId[goodsId];
};

module.exports = DiscountShop;