/**
 * Created by employee11 on 2016/2/1.
 */
var pomelo = require('pomelo'),
    _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename);

var consts = require('../../consts/consts'),
    Code = require('../../../shared/code'),
    dataUtils = require('../../util/dataUtils'),
    dataApi = require('../../util/dataApi'),
    dropUtils = require('../area/dropUtils');


var Manager = function (player) {
    this.player = player;
};

var pro = Manager.prototype;

module.exports = Manager;
pro.clearEndlessPVPBoxMgr = function(){
    delete this.player;

    delete this.dataVO;
}

var VO = function(data){
    if(!data) data = {};
    this.playerId = data.playerId||0;

    this.endlessId = data.endlessId||'';
    this.occasionId = data.occasionId||0;
    this.score = data.score||0;
    this.drew = data.drew||0;
    this.reopenCnt = data.reopenCnt||0;
    this.boxDouble = data.boxDouble||0;
    this.systemId = data.systemId||0;
}

pro.dataVO = new VO();//

var loadOk = false;

/**
 * 加载
 * @param dbData
 */
pro.loadData = function(dbData){
    this.dataVO = new VO();
    if(dbData){
        this.dataVO = dbData;
    }else{
        this.dataVO.playerId = this.player.id;
    }
    loadOk = true;
}

/**
 * 保存宝箱
 * @param data
 */
pro.saveBox = function(data){
    this.dataVO = new VO(data);
    this.player.emit("saveEndlessPVPBox",this.dataVO);
}

/**
 * 有没有宝箱
 * @returns {boolean}
 */
pro.hasBox = function(){
    if(this.dataVO.endlessId==="" || this.dataVO.occasionId===0){
        return false;
    }
    return true;
}

/**
 * 是否已经领取
 * @returns {number|*}
 */
pro.isDrew = function(){
    return this.dataVO.drew;
}

/**
 * 设置领取
 */
pro.setDrew = function(){
    this.dataVO.drew = 1;
    this.player.emit("saveEndlessPVPBox",this.dataVO);
}

/**
 * 设置重开宝箱次数
 */
pro.setReopenCnt = function(){
    this.dataVO.reopenCnt = 1;
    this.player.emit("saveEndlessPVPBox",this.dataVO);
}

/**
 * 获取宝箱数据
 * @returns {VO|*}
 */
pro.getBoxData = function(){
    return this.dataVO;
}

