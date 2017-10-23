/**
 * Created by tony on 2016/8/31.
 * 充值模块相关数据
 */

var logger = require('pomelo-logger').getLogger(__filename);
var uuid = require('node-uuid');
var request = require('request');

var stateReport = require('../../../../config/stateReport');
var area = require('../../../domain/area/area'),
    crypto = require('crypto'),
    Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts'),
    dataApi = require('../../../util/dataApi'),
    config = require('../../../../config/stateReport.json'),
    dropUtils = require('../../../domain/area/dropUtils'),
    orderListDao = require('../../../dao/orderListDao');
    var _ = require('underscore');
var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype

/*
 *   获取充值策划表数据列表
 * */
pro.list = function (msg, session, next) {
    logger.debug('get recharge data: playerId = %s', session.get('playerId'));
    var player = area.getPlayer(session.get('playerId'));
    return next(null, {code: Code.OK, list: player.recharge.getClientInfo()});
};

pro.buy =function (msg,session,next) {
    var self = this;
    function sign(algorithm, msg, secret) {
        var hash = crypto.createHash(algorithm);
        hash.update(msg.orderId);
        hash.update(msg.uid);
        hash.update(util.format('%s', msg.money));
        hash.update(util.format('%s', msg.productId));
        hash.update(util.format('%s', msg.gameMoney));
        hash.update(util.format('%s', msg.serverId));
        hash.update(secret);
        hash.update(util.format('%s', msg.time));
        hash.update(msg.channel);
        return hash.digest('hex');
    }
    var id = msg.id;
    var data = dataApi.Recharge.findByIndex( {id:id} );
    var algorithm = 'md5',
        secret = '8dd015062bd98a66b9d66c4bafd44737',
        host = config.host,
        port = config.port,
        url = util.format('http://%s:%s/order_default', host, port),
        qs = {
            serverId: 10000,
            uid: session.get('rawUid'),
            productId:  data.productId,
            orderId: util.format('%s', Date.now()),
            money: data.price,
            gameMoney: data.diamond,
            time: Date.now(),
            channel: 'app store'
        };

    qs.sign = sign(algorithm, qs, secret);
    console.log('url = %s', url);
    console.log('qs = %j', qs);
    console.log('2212 = %j', self.app.getCurServer());
    request({url: url, qs: qs}, function (err, response, body) {
        if (err) {
            console.error('err = %s', err.stack);
        }
        console.log('statusCode = %s', response.statusCode);
        console.log('body = %j', body);
        return next(null , { code:Code.OK });
        // console.log('response = %j', response);
    });
}


/*
*    购买 （内部充值接口）
* */
pro.buyOld = function( msg ,session , next )
{

    var playerId =  session.get('playerId');
    logger.debug('recharge buy : playerId = %s', session.get('playerId'));
    var player = area.getPlayer(playerId);


    //策划表id
    var id = msg.id;

    console.log('id = %s ',id);
    var data = dataApi.Recharge.findByIndex( {id:id} );
    var productId = data.productId;
    console.log('productId = %s ',productId);
    if( !data )
    {
        //未找到相关产品
        return next( null , {code:Code.AREA.RECHAARGE_ID_NOT_EXIST});
    }

    //是否为首次充值id=？的产品
    var currNum = player.getBuyCntByProductId(productId);
    var isFristBuy = currNum == 0;
    //1、兑换的钻石数
    var diamond = data.diamond;

    //2、赠送的
    //首次赠送、非首次赠送
    var firstGift = data.firstGift,
        gift = data.gift;

    var giftDiamond = isFristBuy?firstGift:gift;
    var diamondTotal = diamond +  giftDiamond;
    player.onCharge( data.price , diamond , giftDiamond);
    var orderId = _.random(100000000,9999999999);
    var newOrder = {
        orderId:orderId,
        uid:playerId,
        money:data.price,
        getMoney:diamond,
        getAwardMoney:giftDiamond,
        playerId:playerId,
        playerName:player.playername,
        productId:productId,
        createTime:Date.now(),
        operationFlag:'myself'
    }
    orderListDao.recordOrder( newOrder, function (err,res) {
        if(err){
            logger.error('recordOrder err = %s, orderId = %s', err.stack, playerId);
            return next( null , {code:Code.FAIL});
        }else{
            player.addOrder( newOrder );
            var cnt = (currNum+1)
            player.pushMsg('order.tips',{ productId:productId, buyCnt:cnt , getMoney:diamond ,getAwardMoney:giftDiamond } );

            //联盟特权（周卡，月卡，年卡）
            var oneDayMs = 86400000;//一天的毫秒数
            if(data.type == Consts.ORDER_PRODUCT_TYPE.WEEK_CARD){
                var now = new Date();
                if(now.getTime() < player.weekCardEndTick){//上期时间还没到,直接加上7天的毫秒数作为新的结束时间
                    player.set('weekCardEndTick', player.weekCardEndTick + oneDayMs * data.para1 );
                }
                else{
                    player.set('weekCardEndTick', new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime() + oneDayMs * data.para1);
                }
            }
            else if(data.type == Consts.ORDER_PRODUCT_TYPE.MONTH_CARD){
                var now = new Date();
                if(now.getTime() < player.monthCardEndTick){//上期时间还没到,直接加上7天的毫秒数作为新的结束时间
                    player.set('monthCardEndTick', player.monthCardEndTick + oneDayMs * data.para1 );
                }
                else{
                    player.set('monthCardEndTick', new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime() + oneDayMs * data.para1);
                }
            }
            else if(data.type == Consts.ORDER_PRODUCT_TYPE.FOREVER_CARD ){
                player.set('foreverCardEndTick', new Date().getTime());
            }

            var activityMgr = player.activityMgr;
            if (activityMgr) {
                var actId = 0;
                var activityDataList = dataApi.Activity.findByIndex({actType : Consts.ACTIVITY_TYPE.UNION_PRIVILEGE});
                if (!_.isArray(activityDataList)) {
                    activityDataList = [activityDataList];
                }
                // activityDataList.forEach(function (activityData) {
                //     actId = activityData.id;
                //     var activity = activityMgr.getById(actId);
                //     if (activity) {
                //         activity.pushNew();
                //     }
                // });
            }

            return next(null , { code:Code.OK ,diamond : diamond ,giftDiamond : giftDiamond,buyCnt :cnt });
        }
    });
};

