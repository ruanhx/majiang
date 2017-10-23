/**
 * Created by tony on 2017/2/28.
 */
var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts'),
    flow = require('../../../consts/flow'),
    dataApi = require('../../../util/dataApi'),
    dropUtils = require('../../../domain/area/dropUtils');
var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

pro.getRandomShopInfo = function (msg, session, next) {
    var playerId = session.get('playerId');
    var player = area.getPlayer(playerId);
    var randomShop = player.randomShop;
    return next(null,{code:Code.OK,randomInfo :randomShop.getClientInfo() });
};

pro.buy = function (msg, session, next) {
    var playerId = session.get('playerId');
    var player = area.getPlayer(playerId);
    var randomShop = player.randomShop;
    var goodsId = msg.goodsId;
    if( !randomShop.isHave() ){
        return next(null, {code: Code.RANDOMSHOP.NOT_FOUND_SHOP});
    }
    logger.debug('--买----买----买----买----买----买--');
    if( !randomShop.isCanBuyGoodsId(goodsId)){
        return next(null, {code: Code.RANDOMSHOP.NOT_GOODSID});
    }
    // 判断货币不足
    if( !randomShop.isEnoughMoneyBuy(goodsId) ){
        return next(null, {code: Code.AREA.LACK_MONEY});
    }
    //判断背包是否已满
    if( randomShop.isBagFull(goodsId) ){
        return next(null,{code:Code.AREA.BAG_IS_FULL});
    }
    // 判断购买限制
    if( randomShop.isLimited(goodsId) ){
        return next(null, {code: Code.AREA.BARRIER_NOT_PASSED});
    }
    var goodsData = dataApi.Goods.findById(goodsId);
    var buyCnt = randomShop.addGoodBuyCount( goodsId );
    randomShop.handover(goodsId);
    return next(null,{code:Code.OK,goodsId:goodsId,buyCnt:buyCnt});
};

pro.refresh = function (msg, session, next) {
    var playerId = session.get('playerId');
    var player = area.getPlayer(playerId);

    var randomShop = player.randomShop;
    if( !randomShop.isHave() ){
        return next(null, {code: Code.RANDOMSHOP.NOT_FOUND_SHOP});
    }



    var myRandRefreshCoin = player.getMoneyByType(Consts.MONEY_TYPE.RAND_REFRESH_COIN);
    if(myRandRefreshCoin>0){
        player.setMoneyByType( Consts.MONEY_TYPE.RAND_REFRESH_COIN , myRandRefreshCoin-1 , flow.MONEY_FLOW_COST.REFRESH_RAND_SHOP);
    }else{

        // 判断货币不足
        if( !randomShop.isMoneyRefersh() ){
            return next(null, {code: Code.AREA.LACK_MONEY});
        }
        
        var needMoney = randomShop.refreshNeedMoney();
        var myDiamond = player.getMoneyByType(Consts.MONEY_TYPE.DIAMOND);
        player.setMoneyByType( Consts.MONEY_TYPE.DIAMOND , myDiamond-needMoney  , flow.MONEY_FLOW_COST.REFRESH_RAND_SHOP);
    }

    randomShop.refreshShop();
    return next(null,{code:Code.OK,randomInfo :randomShop.getClientInfo()});
};