/**
 * Created by tony on 2016/11/23.
 */

var util = require('util');
var _ = require('underscore');
var IndexData = require('../jsonTable');
var dataApi = require('../dataApi');
var utils = require('../utils');
var Compose = function (data) {
    this.managerData = {};
    IndexData.call(this, data);

};

util.inherits(Compose, IndexData);
var composeMangerData = {};
var pro = Compose.prototype;

pro.rowParser = function (row) {
    // if(  composeMangerData ==null )
    // {
    //     composeMangerData = {};
    // }
    //
    // var needRoleQuality = row.needRoleQuality;
    //
    // if( null == composeMangerData[needRoleQuality] ||  _.isUndefined(composeMangerData[needRoleQuality]) ){
    //     composeMangerData[needRoleQuality] = {};
    //     composeMangerData[needRoleQuality].tempRate = 0;
    //     composeMangerData[needRoleQuality].randScetion = [];
    //     composeMangerData[needRoleQuality].needRoleQuality = row.needRoleQuality;
    //     composeMangerData[needRoleQuality].needRoleNum = row.needRoleNum;
    //     composeMangerData[needRoleQuality].newRoleLevel = row.newRoleLevel;
    //     composeMangerData[needRoleQuality].needGold = row.needGold;
    //     composeMangerData[needRoleQuality].needDiamond = row.needDiamond;
    //     composeMangerData[needRoleQuality].posToHero = [];
    // }
    // composeMangerData[needRoleQuality].posToHero.push( { newRoleId : row.newRoleId , newRoleLevel : row.newRoleLevel } );
    // composeMangerData[needRoleQuality].tempRate+=row.rate;
    // composeMangerData[needRoleQuality].randScetion.push(composeMangerData[needRoleQuality].tempRate);




    return row;
};

pro.getPrimaryKey = function () {
    return 'needRoleQuality';
};

pro.getIndex = function ( randNum,tempRates ) {
    var randIndex = 0;
    var tempValue = 0;//累加值
    var length =_.size(tempRates);
    for( var i = 0 ;i< length;++i){
        var num = tempRates[i];
        tempValue+=num;
        if( randNum > tempValue )
        {
            randIndex+=1;
        }
        else {
            return randIndex;
        }
    }
    return randIndex;
};

/*
* 随机出数据
* */
pro.randDataById = function( needRoleQuality ){
    var data = this.findById(needRoleQuality);
    var tempRates =  utils.parseParams(data.rate , '#');
    var newRoleIds = utils.parseParams(data.newRoleId , '#');
    var randNum = Math.random();
    var randIndex = this.getIndex(randNum,tempRates);
    var heroJson =   { newRoleId :newRoleIds[randIndex] , newRoleLevel : data.newRoleLevel };
    return heroJson;
};

pro.getRandHero = function (gradeList,composeRand) {
    var heroNumber  = gradeList.length;

    // 列表 ： 单条评级的总值 =（gradeWeight和）
    var gradeMaxNumList   = [];// [20,40,50];
    var allgradeValueList = [];//[[10,1,1,1,0,0],[10,1,1,1,0,0],[10,1,1,1,0,0],[10,1,1,1,0,0],[10,1,1,1,0,0]];
    _.each(composeRand,function (data) {
        gradeMaxNumList.push(data.gradeWeightTotal);
        var tmpList = utils.parseParams(data.gradeWeight , '#');
        allgradeValueList.push(tmpList);
    });

    //计算总低值
    var totalCnt = 0;
    var i;
    for( i  = 0; i < heroNumber ; ++i ){
        var tmpGrade = gradeList[i];
        totalCnt += gradeMaxNumList[tmpGrade-1];
    }

    //计算概率区间
    var lastRand = [];

    //最大评级数
    var maxGradeCnt = _.size(composeRand);

    var a,singeVale = 0;//单级的分子
    for(a = 0; a < maxGradeCnt ; ++a){
        var c;
        for( c = 0 ; c < heroNumber; ++c ){
            var tmpGrade = gradeList[c];
            singeVale += allgradeValueList[tmpGrade-1][a];
        }
        lastRand.push( singeVale );
    }
    var randTmp = _.random(0,singeVale*1000)*0.001;

    //随机到的评级

    var myGrade = _.sortedIndex(lastRand,randTmp)+1;
    return myGrade;
};

/*
* 通过评级随机英雄
* */
pro.randHeroByGrade = function ( data ) {
    var roleAndRateList =  utils.parseParams(data.roleAndRate , '#');
    var length = roleAndRateList.length;
    var i = 0;
    var total = 0;
    var heroIdList = [];
    var radeList = [];
    for( i ; i < length ; ++i ){
        var tmpList = utils.parseParams(roleAndRateList[i] , '&');
        heroIdList.push(tmpList[0]);
        total+=tmpList[1];
        radeList.push(total);
    }

    var randTmp = _.random(0,total*1000)*0.001;

    //随机到的评级
    var index = _.sortedIndex(radeList,randTmp);
    var heroId = heroIdList[index];
    // var dataList = dataApi.HeroAttribute.findByIndex({heroId:heroId,roleGrade:grade});
    // if(_.size(dataList)>0){
    //     return dataList[0];
    // }
    return heroId;
};

module.exports = function (data) {
    return new Compose(data);
};