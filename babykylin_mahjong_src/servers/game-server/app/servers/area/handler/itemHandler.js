/**
 * Created by kilua on 2016/5/9 0009.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    dataApi = require('../../../util/dataApi'),
    dropUtils = require('../../../domain/area/dropUtils'),
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
 *   出售物品
 * */
pro.sell = function (msg, session, next) {
    logger.debug('sell playerId = %s, slot = %s', session.get('playerId'), msg.slot , msg.type );
    var player = area.getPlayer(session.get('playerId')),
        item,totalMoney=0;

    //觉醒材料
    if( msg.type==Consts.ITEM_TYPE.WAKE_UP_ITEM )
    {
        item = player.wakeUpBag.getItem(msg.slot);
    }
    else
    {
        item = player.bag.getItem(msg.slot);
    }
    if (!item)
    {
        logger.debug('sell empty slot specified!');
        return next(null, {code: Code.FAIL});
    }

    totalMoney = (item.getSellPrice() * item.itemCount) || 0;
    //觉醒材料
    if( msg.type==Consts.ITEM_TYPE.WAKE_UP_ITEM )
    {
        player.wakeUpBag.setItemCount(msg.slot, 0);
    }
    else
    {
        player.bag.setItemCount(msg.slot, 0);
    }
    player.setMoneyByType(Consts.MONEY_TYPE.GOLD, player.goldCnt + totalMoney,flow.MONEY_FLOW_GAIN.ITEM_SELL_GAIN);
    next(null, {code: Code.OK, money: totalMoney});
};

/*
 *   开宝箱
 * */
pro.openBox = function (msg,session,next) {
    logger.debug('openBox playerId = %s, slot = %s', session.get('playerId'), msg.slot , msg.type );
    var player = area.getPlayer(session.get('playerId'))
    if( msg.type == Consts.ITEM_TYPE.BOX )
    {
        var item = player.bag.getItem(msg.slot);
        if(item)
        {
            var currCnt =   item.itemCount;
            if( currCnt>0 )
            {
                player.bag.emit("save",item)
                player.bag.setItemCount(msg.slot,currCnt-1);
                var awards=[];
                var dropId =item.getValue();
                var drops = dropUtils.getDropItems(dropId);
                //// 给与奖励
                //awards.push({awards:  player.applyDrops(drops)});

                awards.push({awards:  player.applyDrops(drops,null,flow.ITEM_FLOW.OPEN_BOX_GAIN)});
                return next(null, {code: Code.OK,awards:awards});
            }
        }
        return next(null,{code:Code.AREA.ITEM_NOT_EXIST});
    }
    return next(null,{code:Code.FAIL});
};