/**
 * Created by kilua on 2015-06-26.
 */

var orderLogger = require('pomelo-logger').getLogger('order-log', __filename),
    _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    orderListDao = require('../../../dao/orderListDao'),
    playerActionLogDao = require('../../../dao/playerActionLogDao'),
    logRechargePlayerDataDao = require('../../../dao/logRechargePlayerDataDao'),
    SHARE = require('../../../../../serverManager/share'),
    dataApi = require('../../../util/dataApi'),
    Consts = require('../../../consts/consts'),
    myUtils = require('../../../../mylib/utils/lib/utils');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

// 查找产品数据
function getProductData(productId){
   return dataApi.Recharge.findById(productId);
}

function verfiyPrice(order){
    var platform = order.platform;
    console.log("verfiyPrice() : platform  = %s ",platform );
    var   platformData = dataApi.PlatformConfig.findBy('platform', platform);

    var     itemData = dataApi.Recharge.findById(order.productId);

    logger.debug('verfiyPrice platform = %s, platformData = %j, itemData = %j ,productId= %s', platform, platformData, itemData,order.productId);

    if(!!platformData && platformData.length === 1){
        return true;
        platformData = platformData[0];
        //if(itemData && myUtils.almostEqualRelativeOrAbsolute(itemData[platformData.priceType], order.money)){
        if(itemData && myUtils.almostEqualRelativeOrAbsolute(100, order.money)){
            return true;
        }
    }
    return false;
}

function getPriceType(platform) {
    var platformData = dataApi.PlatformConfig.findBy('platform', platform);
    if (platformData && platformData.length === 1) {
        return platformData[0].priceType;
    }
    return '';
}

function getProductName(productId) {
    var productData = getProductData(productId);
    return productData ? productData.referemceName : '';
};

//业务逻辑
pro.order = function(order, uid, playerId, cb){
    var player = area.getPlayer(playerId),
        activityMgr = player.activityMgr,
        productId = order.productId,
        channel = order.channel || '',
        app = this.app,
        playerId = player.id;

    orderLogger.info('area.remote.orderRemote : order orderId = %s, playerId = %s, recharge before diamond = %s, productId = %s',
                             order.orderId, playerId, player.diamond, productId);
    // 验证商品价格是否正确
    if(!verfiyPrice(order)){
        orderLogger.info('order price exception found!order = %j', order);
        return cb(null, SHARE.STATUS.FAILURE, SHARE.CODE.MONEY_ERROR);
    }
    // 订单是否已处理过
    orderListDao.getByOrderId( order.orderId, function(err, orderInfo){
        if(orderInfo){
            orderLogger.info('order has accepted!!!');
            return cb(null, SHARE.STATUS.FAILURE, SHARE.CODE.ORDERID_EXIST);
        }
        // 检查是否有此商品
        var productData = getProductData(productId);
        if(!productData){
            orderLogger.info('not found productId : %s',productId);
            return cb(null, SHARE.STATUS.FAILURE, SHARE.CODE.NO_SUCH_PRODUCT);
        }
        // 由于部分平台可能未传递 productId，这里再设置一次
        productId = productData.productId;

        var money = productData.price;

        //是否为首次充值id=？的产品
        var isFristBuy = player.getBuyCntByProductId(productId) == 0;

        orderLogger.info('isFristBuy %s',isFristBuy);
        //1、兑换的钻石数
        var diamond = productData.diamond;

        //2、赠送的
        //首次赠送、非首次赠送
        var firstGift = productData.firstGift,
            gift = productData.gift;

        var giftDiamond = isFristBuy?firstGift:gift;
        //如果是周卡年卡月卡，就不赠送钻石 因为firstGift字段需求无效，gift成了活动中每日领取的赠送dropId
        if(productData.type == Consts.ORDER_PRODUCT_TYPE.WEEK_CARD || productData.type == Consts.ORDER_PRODUCT_TYPE.MONTH_CARD || productData.type == Consts.ORDER_PRODUCT_TYPE.FOREVER_CARD ){
            giftDiamond = 0;
        }
        var diamondTotal = diamond +  giftDiamond;

        orderLogger.info('recharge success : money = %s ,diamond= %s , giftDiamond= %s',money , diamond , giftDiamond);
        var createTime = Date.now();
        var newOrder = {
            orderId:order.orderId,
            uid:order.uid,
            money:money,
            getMoney:diamond,
            getAwardMoney: giftDiamond,
            playerId:playerId,
            playerName:player.playername,
            productId:productId,
            createTime:createTime,
            operationFlag:channel
        }

        player.addOrder( newOrder );
        // 记录此订单
        orderListDao.recordOrder( newOrder, function(err, success){
            if(success){
                var buyCnt = player.getBuyCntByProductId(productId);
                player.pushMsg('order.tips',{ productId:productId, buyCnt:buyCnt , getMoney:diamond ,getAwardMoney:giftDiamond } );
                player.onCharge(money , diamond , giftDiamond);
                var rechargePlayerInfo = {playerId:playerId,
                    productId:productId,
                    playerName : player.playername,
                    fightValue:player.getPower(),
                    normalLastBarrierId:player.passedBarrierMgr.getNewBarrierId(Consts.CHAPTER_TYPE.NORMAL),
                    gameMoney:player.diamondCnt,
                    rechargeTime:newOrder.createTime
                };
                logRechargePlayerDataDao.insertRechargePlayerInfo( rechargePlayerInfo , function (err,success) {
                    if(err)
                    {
                        logger.debug("save insertRechargePlayerInfo success");
                    }
                    else
                    {
                        logger.error("logRechargePlayerDataDao.insertRechargePlayerInfo err : %s",err);
                    }
                });

                //联盟特权（周卡，月卡，年卡）
                var oneDayMs = 86400000;//一天的毫秒数
                if(productData.type == Consts.ORDER_PRODUCT_TYPE.WEEK_CARD){
                    var now = new Date();
                    if(now.getTime() < player.weekCardEndTick){//上期时间还没到,直接加上7天的毫秒数作为新的结束时间
                        player.set('weekCardEndTick', player.weekCardEndTick + oneDayMs * productData.para1 );
                    }
                    else{
                        player.set('weekCardEndTick', new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime() + oneDayMs * productData.para1);
                    }
                }
                else if(productData.type == Consts.ORDER_PRODUCT_TYPE.MONTH_CARD){
                    var now = new Date();
                    if(now.getTime() < player.monthCardEndTick){//上期时间还没到,直接加上7天的毫秒数作为新的结束时间
                        player.set('monthCardEndTick', player.monthCardEndTick + oneDayMs * productData.para1 );
                    }
                    else{
                        player.set('monthCardEndTick', new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime() + oneDayMs * productData.para1);
                    }
                }
                else if(productData.type == Consts.ORDER_PRODUCT_TYPE.FOREVER_CARD ){
                    player.set('foreverCardEndTick', new Date().getTime());
                }

                var activityMgr = player.activityMgr;
                if (activityMgr) {
                    var actId = 0;
                    var activityDataList = dataApi.Activity.findByIndex({actType : Consts.ACTIVITY_TYPE.UNION_PRIVILEGE});
                    if (!_.isArray(activityDataList)) {
                        activityDataList = [activityDataList];
                    }
                    activityDataList.forEach(function (activityData) {
                        actId = activityData.id;
                        var activity = activityMgr.getById(actId);
                        if (activity) {
                            activity.pushNew();
                        }
                    });
                }

                return   cb(null, SHARE.STATUS.SUCCESS);
            }else{
                return cb(null, SHARE.STATUS.FAILURE, SHARE.CODE.OTHER_ERROR);
            }
        });
    });
};