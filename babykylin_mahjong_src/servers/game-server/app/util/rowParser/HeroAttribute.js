/**
 * Created by employee11 on 2016/3/1.
 */
var util = require('util');
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../utils'),
    IndexData = require('../jsonTable');

var dataApi = require('../dataApi');
var HeroAttribute = function (data) {
    IndexData.call(this, data, [['heroId', 'quality'],[ 'quality'],['heroId', 'roleGrade']]);
};

util.inherits(HeroAttribute, IndexData);

var pro = HeroAttribute.prototype;



pro.rowParser = function (row) {
    //row.Id = row.id;
    //row.id = [row.heroId, row.quality].join('_');
    row.skills = utils.parseParams(row.skills, '#');
    row.jumpSkill = utils.parseParams(row.jumpSkill, '#');
    row.smallSkills = utils.parseParams(row.smallSkills, '#');
    //row.jumpSkill.forEach(function(jumpSkill){
    //    row.skills.unshift(jumpSkill);
    //});
    //row.skills.unshift(row.bigSkill);
    row.appropriateSkill = utils.parseParams(row.appropriateSkill,'#');
    row.appropriateNeedHeroId = utils.parseParams(row.appropriateNeedHeroId,'#');

    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

/*
 *   通过猎魔人id，查找猎魔人数据
 * */
pro.getHeroDataById = function (heroId) {
    return this.findById(heroId);
};

/*
 *   通过可售英雄品质，查找可出售猎魔人列表
 * */
pro.getCanBuyHeroListByQua = function ( qua ) {
    return this.findByIndex({quality:qua});
};

/***
 *  通过索引查找分解后的收益  -- rsValue收益累加
 */
pro.getDecomposeValueByIndex = function(index,rsValue){
    if(!rsValue) return;
    var mthis = this;
    var data = mthis.findByIndex(index);
    if(!data.decomposeValue){
        data.decomposeValue = {money:0,needMat:{},heroCount:1};
        //角色分解递归算法
        var doDecompose = function(heroSimple,rsGain,heroCount){
            if(heroSimple.quality && 1 < heroSimple.quality){
                var heroData = mthis.findByIndex({heroId:heroSimple.heroId,quality:heroSimple.quality - 1});
                if(heroData){
                    rsGain.money +=  (heroData.needMoney * heroCount);
                    if(heroData.needMat1 != 0){
                        rsGain.needMat[heroData.needMat1] = (rsGain.needMat[heroData.needMat1] || 0) + heroData.needMat1Num*heroCount;
                    }
                    if(heroData.needMat2 != 0){
                        var heroMatData = mthis.findById(heroData.needMat2);
                        rsGain.heroCount += heroData.needMat2Num * heroCount;
                        doDecompose({heroId:heroMatData.heroId,quality:heroMatData.quality},rsGain,heroData.needMat2Num * heroCount);
                    }
                    doDecompose({heroId:heroData.heroId,quality:heroData.quality},rsGain,heroCount);
                }else{
                    //TODO:
                    logger.debug("存在不能用的heroData  heroId:%d,quality:%d",heroSimple.heroId,heroSimple.quality - 1);
                }
            }
        }

        doDecompose({heroId:data.heroId,quality:data.quality},data.decomposeValue,1);
        // logger.debug("生产分解物资：id:%d ,row.decomposeValue: %j",row.id,row.decomposeValue);
    }
    rsValue.money = (rsValue.money || 0) + data.decomposeValue.money;
    rsValue.heroCount = (rsValue.heroCount || 0) + data.decomposeValue.heroCount;

    for(var key in data.decomposeValue.needMat){
        rsValue.needMat[key] = (rsValue.needMat[key] || 0) + data.decomposeValue.needMat[key];
    }
};


module.exports = function (data) {
    return new HeroAttribute(data);
};