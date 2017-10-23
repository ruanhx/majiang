/**
 * Created by kilua on 2016/7/20 0020.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    dataApi = require('../../../util/dataApi'),
    Consts = require('../../../consts/consts'),
    flow = require('../../../consts/flow');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

/*
 *   获取可购买的加成项目列表
 * */
pro.getShopItems = function (msg, session, next) {
    logger.debug('getShopItems playerId = %s', session.get('playerId'));
    var player = area.getPlayer(session.get('playerId')),
        itemDatas = dataApi.EndlessBuff.all(),
        items = [];
    _.each(itemDatas, function (itemData) {
        items.push(player.buffManager.getShopItem(itemData));
    });
    // 按id升序排序
    items.sort(function (a, b) {
        return a.dataId - b.dataId;
    });
    return next(null, {code: Code.OK, items: items});
};

/*
 *   购买加成
 * */
pro.buy = function (msg, session, next) {
    logger.debug('buy playerId = %s, dataId = %s', session.get('playerId'), msg.dataId);
    var player = area.getPlayer(session.get('playerId')),
        itemData = dataApi.EndlessBuff.findById(msg.dataId);
    if (!player.funcOpen(Consts.FUNCTION.ENDLESS_MODE)) {
        return next(null, {code: Code.AREA.FUNC_DISABLED});
    }
    if (!itemData) {
        return next(null, {code: Code.AREA.NO_SUCH_BUFF});
    }
    var price = player.buffManager.getItemPrice(itemData);
    if (player.getMoneyByType(itemData.moneyType) < price) {
        return next(null, {code: Code.AREA.LACK_MONEY});
    }
    player.setMoneyByType(itemData.moneyType, player.getMoneyByType(itemData.moneyType) - price,flow.MONEY_FLOW_COST.ENDLESS_BUFF_BUY_COST);

    // 增加购买次数，增加拥有数量
    var buff = {};
    if( 5 == itemData.effectType  ){
        if(player.buffManager.getCntById(msg.dataId)>=1){
            buff = player.buffManager.getById(msg.dataId);
        }else{
            buff = player.buffManager.add(msg.dataId);
        }
        var addEffect = player.randEndlessAddEffect();
        return next(null, {code: Code.OK, dataId: buff.dataId, cnt: buff.cnt, buyCnt: buff.buyCnt ,endlessAddEffect:addEffect });
    }else{
        buff = player.buffManager.add(msg.dataId);
        return next(null, {code: Code.OK, dataId: buff.dataId, cnt: buff.cnt, buyCnt: buff.buyCnt});
    }

};