/**
 * Created by kilua on 2016/7/2 0002.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts'),
    flow = require('../../../consts/flow'),
    dataApi = require('../../../util/dataApi'),
    dataUtils = require('../../../util/dataUtils'),
    dropUtils = require('../../../domain/area/dropUtils');
var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

//判断钻石是否足够
function isSnatchDiamondEnough(player,isSingle){
    var needDiamond = 9999999;
    //判断首次夺宝
    var indianaData = null;
    if(isSingle  && player.snatchSingleCnt == 0){//只单次相关
        indianaData = dataApi.Indiana.getFirstSingleRow();
    }
    else{
        indianaData = dataApi.Indiana.getIndianaCfgByBarrierId(player.passedBarrierMgr.getNewBarrierId(Consts.CHAPTER_TYPE.NORMAL));
    }
    if(indianaData == null){
        logger.debug('isSnatchDiamondEnough indianaData == null');
        return [false];
    }

    needDiamond = isSingle ? indianaData.cost : (indianaData.cost * 10 *  dataUtils.getOptionValue('Altar_Discount', 1));
    if(isSingle && player.haveFreeSnatch()){//如果有免费次数,则消耗货币变成0；
        needDiamond = 0;
        return [true,needDiamond,indianaData];//直接返回，isEnoughSomeTypeMoney会认为0是没有参数
    }
    if(player.isEnoughSomeTypeMoney(Consts.MONEY_TYPE.DIAMOND , needDiamond)){
        return [true,needDiamond,indianaData];
    }
    return [false];
}

/*
 *   夺宝
 * */
pro.snatch = function (msg, session, next) {
    logger.debug('snatch playerId = %s, pages = %d', session.get('playerId'), msg.isSingle);
    var player = area.getPlayer(session.get('playerId'));
    var isSingle = (msg.isSingle == 1) ? true :false;

    // 功能是否开启
    if (!player.funcOpen(Consts.FUNCTION.SNATCH_TREASURES)) {
        return next(null, {code: Code.AREA.FUNC_DISABLED});
    }

    //钻石是否足够
    var checkEnough = isSnatchDiamondEnough(player,isSingle);
    if(!checkEnough[0]){
        return next(null, {code: Code.AREA.LACK_MONEY});
    }

    if(player.isBagFullVague()){
        return next(null, {code: Code.AREA.SOMEONE_BAG_FULL});
    }

    //扣除钻石
    var currDiamond = player.getMoneyByType( Consts.MONEY_TYPE.DIAMOND);
    player.setMoneyByType(Consts.MONEY_TYPE.DIAMOND , currDiamond - checkEnough[1],flow.MONEY_FLOW_COST.SNATCH_COST);

    //如果有免费夺宝，则设置下次可以免费夺宝的时间
    if(isSingle && player.haveFreeSnatch()){
        player.set('freeSnatchSingeEndTick',new Date().getTime() + dataUtils.getOptionValue('Altar_freeTime',24)*3600000);
    }

    var drops = [];
    if(isSingle){
        drops = dropUtils.getDropItems(checkEnough[2].dropId1);
        player.applyDrops(drops,null,flow.ITEM_FLOW.SNATCH_TREASURES);
        player.set('snatchSingleCnt', player.snatchSingleCnt+1);
        player.emit("onActSnatch",1);
    }
    else{
        drops = dropUtils.getDropItems(checkEnough[2].dropId10);
        for(var i = 1 ; i <= 9 ; i++ )
        {
            var tmp = dropUtils.getDropItems(checkEnough[2].dropId9);
            for(var key in tmp){
                drops.push(tmp[key]);
            }
        }
        player.applyDrops(drops,null,flow.ITEM_FLOW.SNATCH_TREASURES);
        player.emit("onActSnatch",10);
    }
    return next(null, {code: Code.OK, drops: drops});
};
