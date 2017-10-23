/**
 * Created by 卢家泉 on 2017/5/16 活动副本
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    dataApi = require('../../../util/dataApi'),
    dataUtils = require('../../../util/dataUtils'),
    dropUtils = require('../../../domain/area/dropUtils'),
    libUtils = require('../../../../mylib/utils/lib/utils'),
    trainMgr = require('../../../domain/area/trainMgr'),
    Consts = require('../../../consts/consts');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

pro.trainInfo = function(msg, session, next){
    //logger.debug("收到trainInfo~~~");
    var player =  area.getPlayer(session.get('playerId'));
    var trainVO = player.trainMgr.getInfo();
    //logger.debug("训练请求页面信息 trainInfo trainVO:%j",trainVO);
    next(null, {code: Code.OK,trainVO:trainVO});
}

pro.clickGain = function(msg, session, next){
    //logger.debug("收到clickGain~~~");
    var player =  area.getPlayer(session.get('playerId'));
    var code = player.trainMgr.clickGain({startTime:msg.startTime ,endTime:msg.endTime ,clickCnt:msg.clickCnt,clickRemainCnt:msg.clickRemainCnt ,clickCoolEndTime: msg.clickCoolEndTime});
    var trainVO = player.trainMgr.getInfo();
    //logger.debug("处理结果clickGain~~~ code：%d,trainVO:%j",code,trainVO);
    next(null, {code: code,trainVO:trainVO});
}

pro.quicken = function(msg, session, next){
    //logger.debug("quicken~~~");
    var player =  area.getPlayer(session.get('playerId'));
    var code = player.trainMgr.quicken({type:msg.type});
    if(code==Code.OK){
        var rs = player.trainMgr.gain(false);
        rs.trainVO = player.trainMgr.getInfo();
        //logger.debug("quicken~~~ 加速领取结果 rs:%j",rs);
        next(null, rs);
    }else{
        logger.error("quicken~~~ 加速失败 trainVO:%j",code,player.trainMgr.getInfo());
        next(null, {code: Code.AREA.FAIL});
    }
}

pro.gain = function(msg, session, next){
    //logger.debug("gain~~~");
    var player =  area.getPlayer(session.get('playerId'));
    var rs = player.trainMgr.gain(true);
    rs.trainVO = player.trainMgr.getInfo();
    //logger.debug("gain~~~ 领取结果 rs:%j",rs);
    next(null, rs);
}
