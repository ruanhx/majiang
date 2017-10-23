/**
 * Created by kilua on 2015-06-26.
 */
var url = require('url'),
    util = require('util');

var orderLogger = require('pomelo-logger').getLogger('order-log', __filename),
    logger = require('pomelo-logger').getLogger(__filename),
    orderListDao = require('../../../dao/orderListDao'),
    innerOrderDao = require('../../../dao/innerOrderDao');

var SHARE = require('../../../../../serverManager/share');

function getProductId(app, productId, innerOrderId, cb){
    if(productId){
        return cb(productId);
    }
    innerOrderDao.getByOrderId(app.get('dbclient'), innerOrderId, function(err, order){
        if(order){
            return cb(order.productId);
        }
        return cb();
    });
}
module.exports = function(app, http){
    http.get('/order', function(req, res) {
        var url_parts = url.parse(req.url, true);
        var msg = url_parts.query;
        console.log(' \n\n\n order  msg = %j ',msg);
        orderLogger.debug('http 订单服务器 收到订单信息 ： order msg = %j', msg);
        getProductId(app, msg.productId, msg.innerOrderId, function(productId){
            if(productId) {
                msg.productId = productId;
            }
            app.rpc.world.orderRemote.order.toServer('*', msg, function(err, status, code){
                if(err){
                    orderLogger.error('/order err = %s, orderId = %s', err.stack, msg.orderId);
                    return res.send({status: SHARE.STATUS.EXCEPTION, code: SHARE.CODE.OTHER_ERROR});
                }
                if(code) {
                    return res.send({status: status, code: code});
                }else{
                    return res.send({status: status});
                }
            });
        });
    });

    http.get('/orderQuery', function(req, res){
        var url_parts = url.parse(req.url, true),
            msg = url_parts.query;
        logger.debug('orderQuery msg = %j', msg);
        function formatTime(time){
            time = new Date(time);
            return util.format('%s-%s-%s %s:%s:%s', time.getFullYear(), time.getMonth(),
                time.getDate(), time.getHours(), time.getMinutes(), time.getSeconds());
        }
        // 先查询 GameLog.OrderList
        orderListDao.getByOrderId(app.get('logClient'), msg.orderId, function(err, order){
            if(order){
                return res.send({status: SHARE.STATUS.SUCCESS, order: {
                    order: order.orderId,
                    uid: order.uid,
                    money: order.money,
                    gamemoney: order.gameMoney,
                    time: formatTime(order.createTime),
                    nickname: order.playerName,
                    server_id: msg.serverId,
                    status: order.status
                }});
            }else{
                // 再查询 GameUser.OrderCache
                //orderCacheDao
                return res.send({status: SHARE.STATUS.FAILURE, code: SHARE.CODE.ORDERID_EXIST});
            }
        });
    });
};