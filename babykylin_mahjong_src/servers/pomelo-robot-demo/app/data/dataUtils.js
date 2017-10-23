/**
 * Created by kilua on 14-4-30.
 */

var _ = require('underscore');

var dataApi = require('./dataApi');

var dataUtils = module.exports = {};

/*
 *   判定关卡是否boss关卡，检查是否在boss关卡列表中
 *   @param {Number} 关卡ID
 *   @return {Boolean} 是boss关卡则返回true，否则false
 * */
dataUtils.isBossBarrier = function(barrierId){
    var results = dataApi.campConfig.findBy('bossBarrierId', barrierId);
    return (results.length > 0);
};

/*
*   关卡是否包含在战役配置表中(如果没有，可能是测试数据)
* */
dataUtils.isBarrierInCamp = function(barrierId){
    return (!!_.find(dataApi.campConfig.all(), function(row){
        return _.contains(row.BarrID, barrierId);
    }));
};
/*
*   过滤出当前可以攻打的关卡
*   @param {Number} playerLv        当前等级
*   @param {Array}  passBarrierIds  已通关关卡
*   @param {Number} playerPower     玩家当前行动力
*   @return {Array} a list of enabled barrier ids.
* */
dataUtils.getEnableBarrierIds = function(playerLv, passBarrierIds, playerPower){
    var barriers = dataApi.barrier.all(),
        result = [];
    console.log('getEnableBarrierIds playerLv = %s', playerLv);
    _.each(barriers, function(barrier){
        if(barrier.LVRes > playerLv){
            //console.log('ignore barrier %s, LVRes = %s', barrier.BarrierID, barrier.LVRes);
            return;
        }
        if(barrier.Pow > playerPower){
            //console.log('ignore barrier %s, Pow = %s', barrier.BarrierID, barrier.Pow);
            return;
        }
        if(barrier.LastBarrID !== 0){
            if(!_.contains(passBarrierIds, barrier.LastBarrID)){
                //console.log('ignore barrier %s, LastBarrID = %s not passed!', barrier.BarrierID, barrier.LastBarrID);
                return;
            }
        }
        // 不打boss关卡
        if(dataUtils.isBossBarrier(barrier.BarrierID)){
            return;
        }
        // 不打测试关卡
        if(!dataUtils.isBarrierInCamp(barrier.BarrierID)){
            return;
        }
        result.push(barrier.BarrierID);
    });
    return result;
};

///*
//*   test
//* */
//var result = dataUtils.getEnableBarrierIds(18, [37], 10);
//console.log('getEnableBarrierIds(1, [], 0) = %j', result);