/**
 * 段位管理器
 * Created by LUJIAQUAN on 2017/6/8 0005.
 */

var util = require('util');
var pomelo = require('pomelo')
var logger = require('pomelo-logger').getLogger(__filename),
    async = require('async'),
    _ = require('underscore');

var dataUtils = require('../../util/dataUtils'),
    dataApi = require('../../util/dataApi'),
    playerManager = require('./playerManager').get(),
    EventEmitter = require('events').EventEmitter,
    consts = require('../../consts/consts'),
    async = require('async'),
    mailRemote = require('../../servers/world/remote/mailRemote'),
    utils = require('../../util/utils'),
    ai = require("./ai");
var divisionDao = require('../../dao/divisionDao'),
     divisionSync = require('../../dao/mapping/divisionSync');

var DIVISION_ID_KING = dataUtils.getOptionValue("EndlessDivisionKingId",21);

// 注册存储事件
var registerEvents = function(event) {
    event.on("save", function(dec) {
        // rpc调用存储数据 TODO: 多服务器的分发
        logger.debug("divisionMgr 事件提交！");
        pomelo.app.rpc.area.endlessRemote.updateDivisionPlayer('area-server-1', dec, function() {
        });
    });
};
var Division = function(){
    EventEmitter.call(this);
    registerEvents(this);
}
util.inherits(Division, EventEmitter);
var pro = Division.prototype;

var DivisionRecord = function(opt){
    this.id = opt.id||0;
    this.divisionId = opt.divisionId||1;
    this.playerId = opt.playerId||0;
    this.name = opt.name||'';
    this.heroId = opt.heroId||0;
    this.hPower = opt.hPower||0;
    this.hScore = opt.hScore||0;
    this.divScore = opt.divScore||0;
    this.isRobot = opt.isRobot||0;
}
var playerMap = {};//key:playerId ,value: DivisionRecord    段位角色表缓存

var divisionMap = {};//key:divisionId ,value: DivisionRecord[] 段位对手表

var maxRobotId = 0;
/**
 * 随机  min<= r <=max
 * @param min
 * @param max
 * @returns {number}
 * @constructor
 */
function RandomNumBetween(min,max){
    var range = max-min;
    return min + Math.round(Math.random() * range);
}

/**
 * 初始化函数
 */
pro.init = function(){
    //如果数据数据库没有机器人
    var self = this;
    self.loadData(function (hashRobots) {
        if(!hashRobots){
            self.refreshAi();
        }
        self.refreshPlayer(function(){
            //数据全部加载完-- 做一次整体排序
            self.reSort();
        });
    });


}

/**
 * 刷新AI
 */
pro.refreshAi = function(){
    var self = this;
    var divisionIds = dataApi.EndlessDivision.getDivisionIdList();
    this.clearAI();
    var robotList = [];
    divisionIds.forEach(function(id){
        robotList = _.union(robotList,self.doMakeAiRobotByDivision(id));
        divisionMap[id] = _.union(divisionMap[id],robotList);
    });
    //保存AI
    //logger.debug("生成AI : %j",robotList);
    this.saveDatas(robotList);
}

//生成AI分数
function makeAIScore(baseScore){
    var minScore,maxScore = 0;//分数区间
    minScore = parseInt(baseScore*(1+dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy04_1',0,"#")));
    maxScore = parseInt(baseScore*(1+dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy04_1',1,"#")));
    var rs = RandomNumBetween(minScore,maxScore)+RandomNumBetween(0,dataUtils.getOptionValue("EndlessDivisionEnemy04_2",1000));
    return rs;
}

//生成AI战力
function makeAIPower(basePower){
    var minPower,maxPower = 0;//战力区间
    minPower = parseInt(basePower*(1+dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy05_1',0,"#")));
    maxPower = parseInt(basePower*(1+dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy05_1',1,"#")));
    var rs = RandomNumBetween(minPower,maxPower)+RandomNumBetween(0,dataUtils.getOptionValue("EndlessDivisionEnemy05_2",10));
    return rs;
}

/**
 *根据段位id生成AI
 * @param id
 */
pro.doMakeAiRobotByDivision = function(divisionId){
    var divisionData = dataApi.EndlessDivision.findById(divisionId);
    var scoreStep = parseInt((divisionData.aiScore[1] - divisionData.aiScore[0])/divisionData.aiNum),//计算步长
        powerStep = parseInt((divisionData.aiPower[1] - divisionData.aiPower[0])/divisionData.aiNum);
    var tSumScore=divisionData.aiScore[0],//基础值
        tSumPower = divisionData.aiPower[0];
    var robotList = [];

    for(var i = divisionData.aiNum; i>0 ;--i){

        var robot = new DivisionRecord({
            playerId:++maxRobotId,
            divisionId:divisionId,
            name:ai.getRndFullName(),//生成AI名字
            heroId:divisionData.aiRole[parseInt(divisionData.aiRole.length * Math.random())],//生成猎魔人id
            hScore:makeAIScore(tSumScore),
            hPower:makeAIPower(tSumPower),
            isRobot:1
        });
        robotList.push(robot);
        tSumScore+=scoreStep;
        tSumPower+=powerStep;
    }
    //logger.debug("根据段位id:%d , 生成AI : %j",divisionId,robotList);
    return robotList;
}

/**
 * 刷新真实玩家信息
 */
pro.refreshPlayer = function(cb){
    //logger.debug("刷新真是玩家进对手表*******开始");
    var self = this;
    var divisionIds = dataApi.EndlessDivision.getDivisionIdList();

    this.clearPlayer();
    var playerList = [];

    var tempDiviSionPlayer = {};
    var tempPlayer;

    for(var playerId in playerMap){//角色信息分类
        tempPlayer = playerMap[playerId];
        if(!tempDiviSionPlayer[tempPlayer.divisionId]){
            tempDiviSionPlayer[tempPlayer.divisionId]=[];
        }
        tempDiviSionPlayer[tempPlayer.divisionId].push(tempPlayer);
    }

    divisionIds.forEach(function(id){
        var endlessDivision = dataApi.EndlessDivision.findById(id);
        if(endlessDivision){
            if(!tempDiviSionPlayer[id]){
                tempDiviSionPlayer[id]=[];
            }
            if(endlessDivision.playerNum<=tempDiviSionPlayer[id].length){
                //随机查询玩家进入对手表
                tempDiviSionPlayer[id] = _.shuffle(tempDiviSionPlayer[id]);
                divisionMap[id] = _.union(divisionMap[id],tempDiviSionPlayer[id].slice(0,endlessDivision.playerNum));
            }else{
                divisionMap[id] = _.union(divisionMap[id],tempDiviSionPlayer[id]);
            }

        }
    });
    self.reSort();
    //logger.debug("刷新真是玩家进对手表*******结束");

}

/**
 *报告段位赛情况
 * @param playerId      玩家id                    long
 * @param highScore     历史最高分                int
 * @param highPower     历史最高战力              int
 * @param heroId        当时的猎魔人id            int
 * @param name          玩家名字                  string
 * @param divScore      段位积分                  int
 * @param surpassCnt    超越个数                  int
 * @param baseDivScore  基础段位分                  int
 */
pro.reportScore = function(playerId , highScore ,highPower , heroId, name, divScore,surpassCnt,baseDivScore){
    logger.debug("reportScore 收到！playerId：%d,highScore:%d,highPower:%d,heroId:%d,name:%s,divScore:%d,surpassCnt:%d,baseDivScore:%d",playerId,highScore,highPower,heroId,name,divScore,surpassCnt,baseDivScore);
    var playerRecord = playerMap[playerId];
    var rs = {};
    var serDivScore = baseDivScore;
    serDivScore += dataApi.EndlessDivision.getPointsAdd((playerRecord?playerRecord.divisionId:1),surpassCnt);
    if(serDivScore !== divScore){
        logger.error("服务端计算的段位分跟客户端的不一致！serDivScore=%s , divScore=%s 采用服务端数据",serDivScore,divScore);
        divScore = serDivScore;
    }
    //计算段位
    if(playerRecord){
        //logger.debug("reportScore playerRecord 存在！");
        var newDivision = dataApi.EndlessDivision.getDivisionByPoints(playerRecord.divScore + divScore);
        rs.oldDivision = playerRecord.divisionId;
        playerRecord.divisionId = newDivision;//修改段位值
        playerRecord.divScore = playerRecord.divScore + divScore;
        playerRecord.hScore = highScore;
        playerRecord.hPower = highPower;
        //判断段位是否发生改变
        if(rs.oldDivision != newDivision){
            //如果就段位的对手表中有自己，直接删掉
            var index = _.indexOf(playerRecord);
            divisionMap[playerRecord.divisionId].splice(index,1);
            var endlessDivision = dataApi.EndlessDivision.findById(playerRecord.divisionId);
            //判断新段位是否缺人
            if(endlessDivision.playerNum > divisionMap[playerRecord.divisionId].length){
                divisionMap[playerRecord.divisionId].push(playerRecord)
            }
        }
        //更新数据
        this.emit("save",playerRecord);
        rs.newDivision = playerRecord.divisionId;
        rs.newSocre = playerRecord.divScore;
    }else{
        logger.debug("reportScore playerRecord 不存在！");
        var newDivision = dataApi.EndlessDivision.getDivisionByPoints(divScore);
        //创建角色数据
        var newPlayer = new DivisionRecord({
            divisionId : newDivision||1,
            playerId : playerId||0,
            name : name||'',
            heroId : heroId||0,
            hPower : highPower||0,
            hScore : highScore||0,
            divScore : divScore||0,
        });
        rs.oldDivision = 1;
        var endlessDivision = dataApi.EndlessDivision.findById(newPlayer.divisionId);
        //判断新段位是否缺人
        if(endlessDivision.playerNum > divisionMap[newPlayer.divisionId].length){
            divisionMap[newPlayer.divisionId].push(newPlayer)
        }
        playerMap[newPlayer.playerId] = newPlayer;
        rs.newDivision = newPlayer.divisionId;
        rs.newSocre = newPlayer.divScore;
        //更新数据
        this.emit("save",newPlayer);
    }
    return rs;
}

/**
 * 加载数据
 */
pro.loadData = function(cb){
    divisionDao.findAll(function(err,records){
        var hashRobot = false;
        records.forEach(function(record){
            if(1 == record.isRobot){
                hashRobot = true;
                if(!divisionMap[record.divisionId]){
                    divisionMap[record.divisionId] = [];
                }
                divisionMap[record.divisionId].push(record);
            }else {
                playerMap[record.playerId] = record;
            }

        });
        cb(hashRobot);
    });
}

/**
 * 清空真玩家
 */
pro.clearPlayer = function(){
    for(var key in divisionMap){
        divisionMap[key].forEach(function(playerData){
            if(0==playerData.isRobot){
                divisionMap[key].remove(playerData);
            }
        });
    }
}

/**
 * 清空AI
 */
pro.clearAI = function(){
    for(var key in divisionMap){
        divisionMap[key].forEach(function(playerData){
            if(1==playerData.isRobot){
                divisionMap[key].remove(playerData);
            }
        });
    }
    //清除数据库
    divisionDao.removeAll();
}

/**
 * 重新排序
 */
pro.reSort = function(){
    //logger.debug("排序开始");
    for(var key in divisionMap){
        divisionMap[key] = _.sortBy(divisionMap[key],'hPower');
    }
}

/**
 * 保存数据
 */
pro.saveDatas = function( records){
    divisionDao.add(records);
}

/**
 * 保存全部
 */
pro.saveAll = function () {
    //TODO:需要吗？现在都是有改变就保存
}

/**
 * 获取对手列表
 * @param playerId
 * @param highPower
 * @param highScore
 */
pro.refreshOpponents = function(playerId,highPower,highScore){
    //如果玩家之前没玩过，那么在这里就没有数组
    var self = this ;
    var player = playerMap[playerId];
    if(!player){
        player = new DivisionRecord({
            playerId:playerId,
            hPower:highPower,
            hScore:highScore
        })
    }
    var divisionId = player.divisionId || 1;
    var rsOpponents=[];
    if(divisionId==DIVISION_ID_KING){//王者段位
        rsOpponents.push(self.getKingOpponent1(player,highPower,highScore,rsOpponents));
        rsOpponents.push(self.getKingOpponent2(player,highPower,highScore,rsOpponents));
        rsOpponents.push(self.getKingOpponent3(player,highPower,highScore,rsOpponents));

    }else{//非王者段位
        rsOpponents.push(self.getGeneralOpponent(player,highPower,highScore,divisionMap[divisionId],
            dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy01',0,"#"),dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy01',1,"#"),
            dataUtils.getOptionValue("EndlessDivisionEnemyOut01",0.8),rsOpponents));
        rsOpponents.push(self.getGeneralOpponent(player,highPower,highScore,divisionMap[divisionId],
            dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy02',0,"#"),dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy02',1,"#"),
            dataUtils.getOptionValue("EndlessDivisionEnemyOut02",1.2),rsOpponents));
        rsOpponents.push(self.getGeneralOpponent(player,highPower,highScore,divisionMap[divisionId],
            dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy03',0,"#"),dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy03',1,"#"),
            dataUtils.getOptionValue("EndlessDivisionEnemyOut03",3),rsOpponents));
    }
    return rsOpponents;
}

/**
 * 王者第一个对手
 * @param player
 * @param highPower
 * @param highScore
 * @param exclude
 */
pro.getKingOpponent1 = function(player,highPower,highScore,exclude){
    var self = this;
    var miniPower = Math.floor(highPower*dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy01_1',0,"#")),
        maxPower = Math.floor(highPower*dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy01_1',1,"#"));
    var tempOpponents = [];//满足所有条件删选后的对手
    var tempOpponents2 = [];//第二规则筛选不通过的对手
    var rsOpponent = {};//筛选结果
    for(var i=0 ; i<divisionMap[DIVISION_ID_KING].length ; i++){
        if(player.playerid == divisionMap[DIVISION_ID_KING][i].playerId)//不能是挑战者
            continue;
        if(divisionMap[DIVISION_ID_KING][i].hPower > miniPower && divisionMap[DIVISION_ID_KING][i].hPower < maxPower){
            tempOpponents.push(divisionMap[DIVISION_ID_KING][i]);
        }else{
            tempOpponents2.push(divisionMap[DIVISION_ID_KING][i]);
        }
    }
    if(tempOpponents.length==0){
        if(tempOpponents2.length == 0){//如果都找不到--降级挑选
            rsOpponent = self.getGeneralOpponent(player,highPower,highScore,divisionMap[DIVISION_ID_KING-1],
                dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy03',0,"#"),dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy03',1,"#"),
                dataUtils.getOptionValue("EndlessDivisionEnemyOut03",3),exclude);
        }else{
            var index = Math.floor(Math.random()*tempOpponents2.length);
            rsOpponent = tempOpponents2[index];
        }
    }else{
        var index = Math.floor(Math.random()*tempOpponents.length);
        rsOpponent = tempOpponents[index];
    }
    return rsOpponent;
}

/**
 * 王者第二个对手
 * @param player
 * @param highPower
 * @param highScore
 * @param exclude
 */
pro.getKingOpponent2 = function(player,highPower,highScore,exclude){

    var self = this;
    var miniPower = Math.floor(highPower*dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy02_1',0,"#")),
        maxPower = Math.floor(highPower*dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy02_1',1,"#"));
    var tempOpponents = [];//满足所有条件删选后的对手
    var tempOpponents2 = [];//第二规则筛选不通过的对手
    var rsOpponent = {};//筛选结果
    for(var i=0 ; i<divisionMap[DIVISION_ID_KING].length ; i++){
        if(player.playerid == divisionMap[DIVISION_ID_KING][i].playerId)//不能是挑战者
            continue;
        if(divisionMap[DIVISION_ID_KING][i].hPower > miniPower && divisionMap[DIVISION_ID_KING][i].hPower < maxPower){
            tempOpponents.push(divisionMap[DIVISION_ID_KING][i]);
        }else{
            tempOpponents2.push(divisionMap[DIVISION_ID_KING][i]);
        }
    }
    if(tempOpponents.length==0){
        if(tempOpponents2.length == 0){//如果都找不到--降级挑选
            rsOpponent = self.getGeneralOpponent(player,highPower,highScore,divisionMap[DIVISION_ID_KING-1],
                dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy03',0,"#"),dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy03',1,"#"),
                dataUtils.getOptionValue("EndlessDivisionEnemyOut03",3),exclude);//TODO:读表
        }else{
            var index = Math.floor(Math.random()*tempOpponents2.length);
            rsOpponent = tempOpponents2[index];
        }
    }else{
        var index = Math.floor(Math.random()*tempOpponents.length);
        rsOpponent = tempOpponents[index];
    }
    return rsOpponent;
}

/**
 * 王者第三个对手
 * @param player
 * @param highPower
 * @param highScore
 * @param exclude
 */
pro.getKingOpponent3 = function(player,highPower,highScore,exclude){

    var self = this;

    var miniPower = Math.floor(highPower*dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy03_1',0,"#")),
        maxPower = Math.floor(highPower*dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy03_1',1,"#"));
    var miniPower2 = Math.floor(highPower*dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy03_2',0,"#")),
        maxPower2 = Math.floor(highPower*dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy03_2',1,"#"));

    var tempOpponents = [];//满足所有条件删选后的对手
    var tempOpponents2 = [];//不满足条件一但是满足条件二的对手
    var tempOpponents3 = [];//都不满足
    var rsOpponent = {};//筛选结果
    for(var i=0 ; i<divisionMap[DIVISION_ID_KING].length ; i++){
        if(player.playerid == divisionMap[DIVISION_ID_KING][i].playerId)//不能是挑战者
            continue;
        if(divisionMap[DIVISION_ID_KING][i].hPower > miniPower && divisionMap[DIVISION_ID_KING][i].hPower < maxPower){
            tempOpponents.push(divisionMap[DIVISION_ID_KING][i]);
        }else{
            if(divisionMap[DIVISION_ID_KING][i].hPower > miniPower2 && divisionMap[DIVISION_ID_KING][i].hPower < maxPower2){
                tempOpponents2.push(divisionMap[DIVISION_ID_KING][i]);
            }else{
                tempOpponents3.push(divisionMap[DIVISION_ID_KING][i]);
            }
        }
    }
    if(tempOpponents.length==0){
        if(tempOpponents2.length == 0){
            if(tempOpponents3.length == 0){//如果都找不到--降级挑选
                rsOpponent = self.getGeneralOpponent(player,highPower,highScore,divisionMap[DIVISION_ID_KING-1],
                    dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy03',0,"#"),dataUtils.getOptionListValueByIndex('EndlessDivisionEnemy03',1,"#"),
                    dataUtils.getOptionValue("EndlessDivisionEnemyOut03",3),exclude);//TODO:读表
            }else{
                var index = Math.floor(Math.random()*tempOpponents3.length);
                rsOpponent = tempOpponents3[index];
            }
        }else{
            var index = Math.floor(Math.random()*tempOpponents2.length);
            rsOpponent = tempOpponents2[index];
        }
    }else{
        var index = Math.floor(Math.random()*tempOpponents.length);
        rsOpponent = tempOpponents[index];
    }
    return rsOpponent;
}

/**
 * 生成一个正常对手
 * @param player
 * @param highPower
 * @param highScore
 * @param allOpponents
 * @param sectionS
 * @param sectionE
 * @param hScorePercent
 * @param exclude
 * @returns {{}}
 */
pro.getGeneralOpponent = function(player,highPower,highScore,allOpponents,sectionS,sectionE,hScorePercent,exclude){
    var start = Math.floor(allOpponents.length*sectionS);
    var end = Math.ceil(allOpponents.length*sectionE);
    var rsOpponent = {};//筛选结果

    var tempOpponents = [];//满足所有条件删选后的对手
    var tempOpponents2 = [];//第二规则筛选不通过的对手

    for(var i=start;i<end;i++){
        if(player.playerid == allOpponents[i].playerId)//不能是挑战者
            continue;
        if(_.indexOf(exclude,allOpponents[i]) !=- 1)//不能重复
            continue;
        if(allOpponents[i].hScore > parseInt(highScore * hScorePercent)){
            tempOpponents2.push(allOpponents[i])
        }else{
            tempOpponents.push(allOpponents[i]);
        }
    }
    if(tempOpponents.length==0){
        var index = Math.floor(Math.random()*tempOpponents2.length);
        rsOpponent = tempOpponents2[index];
    }else{
        var index = Math.floor(Math.random()*tempOpponents.length);
        rsOpponent = tempOpponents[index];
    }
    return rsOpponent;
}

pro.getPlayerInfo = function(playerId){
    return playerMap[playerId];
}

/**
 * 每周段位积分重置   TODO:是否会跟每日冲突
 */
pro.weekReset = function(){
    var mr = new mailRemote(pomelo.app);
    var endlessDivision;
    var sysMail,mail;
    for(var key in playerMap) {
        if(playerMap[key]){
            endlessDivision = dataApi.EndlessDivision.findById(playerMap[key].divisionId);
            if(endlessDivision){
                sysMail = dataApi.SysEamil.findById(endlessDivision.weekMailId);
                if (sysMail) {
                    //发送邮件
                    mail = {title: sysMail.title, info: sysMail.text, sender: sysMail.name, drop: sysMail.dropId,
                        infoParams:JSON.stringify([{type:consts.MAIL_PARAM_TYPE.CONFIG_VALUE, value:endlessDivision.name}])};
                    mr.CreateMailNew(playerMap[key].playerId, mail, function (err) {
                    });
                }
                playerMap[key].divisionId = dataApi.EndlessDivision.getDivisionByPoints(endlessDivision.pointsReset);
                playerMap[key].divScore = endlessDivision.pointsReset;
                var player = playerManager.getPlayer(playerMap[key].playerId);
                if (player) {
                    logger.debug("段位重置推送");
                    player.pushMsgToClient('endless.divisionUpdate', {divisionId:playerMap[key].divisionId,divScore:playerMap[key].divScore});
                }
            }
            this.emit("save",playerMap[key]);
        }

    }
}

pro.dispatchAwards = function(){
    var mr = new mailRemote(pomelo.app);
    // var player;
    var endlessDivision;
    var sysMail,mail;

    async.eachSeries(_.values(playerMap),function (player,callback) {

        endlessDivision = dataApi.EndlessDivision.findById(player.divisionId);
        if(endlessDivision){
            sysMail = dataApi.SysEamil.findById(endlessDivision.mailTextId);
            //logger.debug("@@@@@ sysMail：%j",sysMail);
            if (sysMail) {
                //发送邮件
                mail = {title: sysMail.title, info: sysMail.text, sender: sysMail.name, drop: sysMail.dropId,
                    infoParams:JSON.stringify([{type:consts.MAIL_PARAM_TYPE.CONFIG_VALUE, value:endlessDivision.name}])};
                mr.CreateMailNew(player.playerId, mail, function (err) {
                    callback();
                });
            }
        }
    },function (err) {
        if(err){
            logger.error("dispatchAwards err");
        }
    });

}


var instance;
module.exports.get = function () {
    if (!instance) {
        instance = new Division();
    }
    return instance;
};




