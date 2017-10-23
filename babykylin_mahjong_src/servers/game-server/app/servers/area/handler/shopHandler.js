/**
 * Created by kilua on 2016/7/2 0002.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts'),
    flow = require('../../../consts/flow'),
    dataApi = require('../../../util/dataApi'),
    dropUtils = require('../../../domain/area/dropUtils'),
    innerOrderDao = require('../../../dao/innerOrderDao');
var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

/*
 *   刷新出售商品信息
 * */
pro.getPageList = function (msg, session, next) {
    logger.debug('getPageList playerId = %s, pages = %j', session.get('playerId'), msg.pages);
    var player = area.getPlayer(session.get('playerId'));
    return next(null, {code: Code.OK, pages: player.shop.getClientInfo()});
};

/*
 *   购买
 * */
pro.buy = function (msg, session, next) {
    logger.debug('buy playerId = %s, goodsId = %s, type = %s, typeId = %s, unit = %s, priceType = %s, price = %s',
        session.get('playerId'), msg.goodsId, msg.type, msg.typeId, msg.unit, msg.priceType, msg.price);

    // 判断商品的ID，类型，单次购买数量，售价是否与服务器端一致
    var player = area.getPlayer(session.get('playerId'));
    if (player.shop.shouldRefresh(msg.goodsId, msg.type, msg.typeId, msg.unit, msg.priceType, msg.price)) {
        return next(null, {code: Code.AREA.SHOP_SHOULD_REFRESH});
    }
    //判断该商品的今日购买次数是否已达上限
    if (player.shop.reachDailyMax(msg.goodsId)) {
        return next(null, {code: Code.AREA.SHOP_REACH_DAILY_MAX});
    }

    // 判断货币不足

    if (!player.isEnoughSomeTypeMoney(msg.priceType , msg.price) ) {// [138844]BUG：普通资源商店和竞技兑换，两个商店购买的时候，无法正常购买（可能是这次改商店和商品的表结构改到了）
        return next(null, {code: Code.AREA.LACK_MONEY});
    }
    // 判断购买限制
    if (player.shop.isLimited(msg.goodsId)) {
        return next(null, {code: Code.AREA.BARRIER_NOT_PASSED});
    }
    //判断背包是否已满
    if (player.shop.isBagFull(msg.goodsId)) {
        return next(null, {code: Code.AREA.BAG_IS_FULL});
    }


    //player.setMoneyGroup(msg.priceType,msg.price,Consts.USE_DIAMOND_STTE.SHOP_BUY)// [138844]BUG：普通资源商店和竞技兑换，两个商店购买的时候，无法正常购买（可能是这次改商店和商品的表结构改到了）
    player.setMoneyByType(msg.priceType, player.getMoneyByType(msg.priceType) - parseInt(msg.price),flow.MONEY_FLOW_COST.SHOP_BUY,msg.goodsId);
    player.shop.addGoodBuyCount(msg.goodsId, 1);
    var awards=[];
    ////表示购买的是宝箱
    //if( msg.type ==Consts.GOODS_TYPE.ITEM )
    //{
    //    var data = dataApi.Items.findById(  msg.typeId );
    //    if( data.type == Consts.ITEM_TYPE.BOX)
    //    {
    //        var dropId =data.value;
    //        var drops = dropUtils.getDropItems(dropId);
    //        awards.push({awards: drops});
    //        // 给与奖励
    //        player.applyDrops(drops)
    //        return next(null, {code: Code.OK,awards:awards});
    //    }
    //}
    player.shop.handover(msg.goodsId);

   // return next(null, {code: Code.OK,awards:awards});

    return next(null, {code: Code.OK});
};


pro.makeOrderId = function(msg, session, next){
    logger.debug('makeOrderId playerId = %s, productId = %s', session.get('playerId'), msg.productId);
    var productData = dataApi.Recharge.findById(msg.productId);
    if(!productData){
        logger.debug('makeOrderId invalid productId = %s', msg.productId);
        return next(null, {code: Code.FAIL, productId: msg.productId});
    }
    innerOrderDao.createOrderId(this.app.get('dbclient'), msg.productId, function(err, order){
        if(order){
            return next(null, {code: Code.OK, orderId: order.id, productId: order.productId, timestamp: order.timestamp});
        }else{
            return next(null, {code: Code.DB_ERR, productId: msg.productId});
        }
    });
};