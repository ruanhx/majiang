/**
 * Created by employee11 on 2016/2/1.
 */
var pomelo = require('pomelo'),
    _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename);

var consts = require('../../consts/consts'),
    flow = require('../../consts/flow'),
    dataUtils = require('../../util/dataUtils'),
    utils = require('../../util/utils')
    dataApi = require('../../util/dataApi'),
    dropUtils = require('../area/dropUtils');


var Manager = function (player) {
    this.player = player;
    this.VO.playerId = this.player.id;
};

var pro = Manager.prototype;
pro.clearDivisionPersionMgr = function(){
    delete this.player;

    delete this.VO;
}

var VO = function(data){
    this.highDivision = data.highDivision||1;//玩家历史最高段位
    this.opponents = data.opponents||[];//玩家刷新出来的对手
    this.refreshCnt = data.refreshCnt||0;//刷新次数
    this.clearTime = data.clearTime||0;//上次重置时间
};

pro.VO = new VO({});
pro.playerId = 0;


module.exports = Manager;

/**
 * 管理器加载数据
 * @param dbData
 */
pro.load = function(data){
    //logger.debug("division load data:%j",data);
    this.VO = new VO({});
    this.VO.playerId = this.player.id;
    if(data && data.length>0){
        this.VO.highDivision = data[0].highDivision||1;
        this.VO.opponents = JSON.parse(data[0].opponents||"[]");
        this.VO.refreshCnt = data[0].refreshCnt;
        this.VO.clearTime = data[0].clearTime;
    }
}

function getBaseDivScore(score){
    var tempArr = [];
    var rsDivScore = 0;
    _.each(dataUtils.getOptionList("EndlessDivisionScoreToPoint","#"),function(opt){
        tempArr = utils.parseParams(opt, '&');
        if(score > parseInt(tempArr[0]))
            rsDivScore = parseInt(tempArr[1]);
    });
    return rsDivScore;
}

/**
 * 更新段位积分
 * @param callBack
 */
pro.updateDivScore = function(session,divScore,score){
    var self = this;
    var heroId = 0;
    if(self.player.heroBag && self.player.heroBag.getItemByPos(self.player.curHeroPos)){
        var heroItem = self.player.heroBag.getItemByPos(self.player.curHeroPos);
        var heroData = dataApi.HeroAttribute.findByIndex({heroId:heroItem.roleId,quality:heroItem.quality});
        if(heroData){
            heroId = heroData.id || 0;
        }
    }
    var surpassCnt = 0;//超越个数
    _.each(self.VO.opponents,function(opponents){
        if(score>opponents.hScore){
            surpassCnt++;
        }
    });

    //段位升级处理
    pomelo.app.rpc.world.endlessRemote.reportDivisionScore(session, {
        playerId: self.player.id,
        hScore:self.player.highScore,
        hPower:self.player.highPower,
        heroId:heroId,
        name : self.player.playername,
        divScore: divScore,
        surpassCnt:surpassCnt,
        baseDivScore : getBaseDivScore(score)
    }, function (rs) {
        //logger.debug("段位结算报告回调 rs：%j",rs);
        if(rs.oldDivision!=rs.newDivision){
            self.player.emit("onActDivisionUp",rs.newDivision);
            pomelo.app.rpc.chat.chatRemote.updatePlayerInfo(session,{playerId:self.player.id,division:rs.newDivision},function(){});
            //升级了
            if( rs.newDivision>self.VO.highDivision){
                self.VO.highDivision = rs.newDivision;
                //发送奖励
                var endlessDivision = dataApi.EndlessDivision.findById(self.VO.highDivision);

                // 无尽段位到某个阶段 跑马灯
                self.player.missionMgr.progressUpdate(consts.MISSION_CONDITION_TYPE.DIVISION_SCORE,consts.MISSION_PROGRESS_VALUE_TYPE.MATH_MAX,self.VO.highDivision,[{type:consts.MAIL_PARAM_TYPE.CONFIG_VALUE,value:endlessDivision.name}]);
                logger.debug("段位升级 highDivision：%d",self.VO.highDivision);
                if(endlessDivision){
                    //获取奖励
                    var dropsItems = dropUtils.getDropItems( endlessDivision.levelUpDropId );
                    // 给与奖励
                    var drops = self.player.applyDrops(dropsItems,null,flow.ITEM_FLOW.DIVISION_GAIN);
                    //推送
                    self.player.pushMsg('endless.divisionLevelUp', {drops:drops});
                    logger.debug("段位升级奖励 drops：%j",drops);
                }else{
                    logger.error("endlessDivision 不存在:id=%j",self.VO.highDivision);
                }
            }else{
                //self.player.pushMsg('endless.divisionLevelUp', {drops:[]});
            }
        }
        self.VO.opponents = [];
        //保存数据
        self.player.emit("saveDivisionPerson",self.VO);
        if(rs.newDivision == dataUtils.getOptionValue("EndlessDivisionKingId",21)){//如果是王者 - - 给排行榜 - - 报告
            pomelo.app.rpc.world.rankListRemote.updateDivisionRankingList(session, {
                type : Consts.RANKING_TYPE.DIVISION,
                playerId: self.player.id,
                score: rs.newSocre
            }, function (res) {});
        }
    });

}

/**
 * 获取对手列表
 * @param callBack
 */
pro.getDivisionInfo = function(session,callBack){
    var self = this;
    pomelo.app.rpc.world.endlessRemote.getDivisionPlayerInfo(session,{playerId:self.player.id},function(playerInfo){
        //logger.debug("rpc 获取角色段位信息 :%j",playerInfo);
        playerInfo.highDivision = self.VO.highDivision;
        playerInfo.refreshCnt = self.VO.refreshCnt;
        if(!self.VO.opponents || self.VO.opponents.length==0){
            pomelo.app.rpc.world.endlessRemote.getDivisionOpponents(session, {
                playerId: self.player.id,
                hScore:self.player.highScore,
                hPower:self.player.highPower
            }, function (rs) {
                self.VO.opponents = rs;
                //保存数据
                self.player.emit("saveDivisionPerson",self.VO);
                callBack(self.VO.opponents,playerInfo);
            });
        }else{
            callBack(self.VO.opponents,playerInfo);
        }
    });
}

/**
 * 刷新对手列表
 * @param session
 * @param callBack
 */
pro.refreshOpponentList = function(session,callBack){
    var self = this;
    pomelo.app.rpc.world.endlessRemote.getDivisionOpponents(session, {
        playerId: self.player.id,
        hScore:self.player.highScore,
        hPower:self.player.highPower
    }, function (rs) {
        self.VO.opponents = rs;
        self.VO.refreshCnt++;
        //保存数据
        self.player.emit("saveDivisionPerson",self.VO);
        callBack(self.VO.opponents);
    });
}

pro.canFreeRefresh = function(){
    return (this.VO.refreshCnt < dataUtils.getOptionValue("EndlessDivisionFreeRenew",5));
}

pro.getRefreshCnt = function(){
    return this.VO.refreshCnt;
}

pro.dailyClean = function(){
    this.VO.refreshCnt=0;
    this.VO.clearTime=Date.parse(new Date());
    this.player.emit("saveDivisionPerson",this.VO);
}

pro.dailyCleanOffline = function () {
    var trigger = pomelo.app.get('cronManager').getTriggerById(consts.AREA_CRON.RESET_DIVISION_FREE_CNT),
        nextExecuteTime, now = Date.now();
    if (!this.VO.clearTime) {
        // 第一次
        this.dailyClean();
        return;
    }
    if (!!trigger && !!this.VO.clearTime) {
        nextExecuteTime = trigger.nextExcuteTime(this.VO.clearTime);
        if (nextExecuteTime < now) {
            this.dailyClean();
        }
    }
};


