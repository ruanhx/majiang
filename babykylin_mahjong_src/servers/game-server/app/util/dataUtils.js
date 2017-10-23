/**
 * Created by Administrator on 2016/3/10 0010.
 */

var _ = require('underscore');

var dataApi = require('./dataApi'),
    Consts = require('./../consts/consts'),
    utils = require('./utils');

var exp = module.exports = {};

//装备加成的倍率字段
var equipQuaAddList = null;

var Player_RoleSellList = null;

var randomBossAll = null;
var appearChanceTotal = 0;
/*
* strGroup：字符串数组 （比如0.2#0.2#0.3）
* value：0.1
* 通过value值计算value处在strGroup哪个区间
* 数组下标
* */
exp.getIndexByGroup = function( strGroup , value )
{
    var listNums = utils.parseParams( strGroup, '#');
    var tempBf = 0;
    var tempAf = 0;
     var length = listNums.length;
    for( var i =0 ; i <length;++i )
    {
        var num = listNums[i];
        tempAf+=num;
        if(value>=tempBf && value<=tempAf)
        {
            return i+1;
        }
        tempBf=tempAf;
    }
    return 1;
};

/**
 *通过systemId获取额外的小奖励
 * */
exp.getDropsBySystemId = function(systemId) {
    var dropIds = [];
    if(systemId<=0){
        return dropIds;
    }
    var  tmpAll = dataApi.EndlessBattle.all();
    var list = _.filter(tmpAll,function (tmp) {
      return tmp.systemId < systemId && tmp.dropId>0;
    });
    _.each(list,function (data) {
        dropIds.push(data.dropId)
    });
    return dropIds;
};

/*
* quality:装备品质
* 通过装备品质获取品质加成赔率
* */
exp.getEquipQuaAdd=function( quality )
{
    if(!equipQuaAddList)
    {
        equipQuaAddList=dataApi.CommonParameter.getOptionList("Equip_QualityAdd");
    }
    var length = equipQuaAddList.length;
    quality = quality>length ?length:quality;
    quality -=1;
    return equipQuaAddList[quality];
};

/*
 *   读取参数表的指定参数值
 * */
exp.getOptionValue = function (optionId, defVal) {
    return dataApi.CommonParameter.getOptionValue(optionId, defVal);
};

/*
 *   读取参数表的指定的数组型参数中的指定元素
 * */
exp.getOptionListValueByIndex = function (optionId, idx, splitChar) {
    return dataApi.CommonParameter.getOptionListValueByIndex(optionId, idx, splitChar);
};

/*
 *   读取参数表中的指定的数组型参数
 * */
exp.getOptionList = function (optionId, splitChar) {
    return dataApi.CommonParameter.getOptionList(optionId, splitChar);
};

exp.getRandomValue = function (optionId, splitChar) {
    var list = dataApi.CommonParameter.getOptionList(optionId, splitChar);
    if(list.length=2){
        return _.random(list[0],list[1]);
    }
    return -1;
};

/*
 *   查找前置关卡
 * */
exp.getPreBarrier = function (barrierId) {
    var customData = dataApi.Custom.findById(barrierId);
    if (customData) {
        var chapterData = dataApi.Chapter.findById(customData.chapterId);
        if (chapterData) {
            var barriers = chapterData.barriers,
                curBarrierIdx = _.indexOf(barriers, barrierId),
                preBarrier = barriers[curBarrierIdx - 1];
            if (preBarrier) {
                return preBarrier;
            }
            var preChapterData = dataApi.Chapter.findById(chapterData.preChapter);
            if (preChapterData) {
                return _.last(preChapterData.barriers);
            }
        }
    }
    return 0;
};

/*
 *   查找指定关卡的所有前置关卡id列表,包含自己
 * */
exp.getPreBarriers = function (barrierId) {
    var customData = dataApi.Custom.findById(barrierId),
        barriers = [];
    if (customData) {
        var chapterData = dataApi.Chapter.findById(customData.chapterId);
        if (chapterData) {
            barriers = barriers.concat(chapterData.barriers.slice(0, _.indexOf(chapterData.barriers, barrierId) + 1));
            dataApi.Chapter.getPreChapters(customData.chapterId).forEach(function (chapterId) {
                chapterData = dataApi.Chapter.findById(chapterId);
                if (chapterData) {
                    barriers = barriers.concat(chapterData.barriers);
                }
            });
        }
    }
    return barriers;
};

/*
 *   获取指定关卡的所有前置章节id列表，不包含指定关卡所在章节
 * */
exp.getPreChapters = function (barrierId) {
    var customData = dataApi.Custom.findById(barrierId);
    if (customData && customData.chapterId) {
        return dataApi.Chapter.getPreChapters(customData.chapterId);
    }
    return [];
};
/*
* 通过关卡id获取章节难度类型（普通还是精英）
* */
exp.getChapterDiffTypeByBarrierId=function(barrierId)
{
    var customData = dataApi.Custom.findById(barrierId);
    if (customData && customData.chapterId) {
        var ChapterData =dataApi.Chapter.findById( customData.chapterId );
        if( ChapterData )
        {
            return  ChapterData.difficulty;
        }
    }
    return Consts.CHAPTER_TYPE.NORMAL;
};

exp.getLanguage = function () {
    var language = dataApi.CommonParameter.getOptionValue('language','');
    return language;
};

exp.getChapterIdByBarrierId = function( barrierId )
{
    var customData = dataApi.Custom.findById(barrierId);
    if(!!customData)
    {
        return customData.chapterId;
    }
    return -1;
}
// /*
//  *  获取可出售的英雄列表
//  *  quality : 可出售的品质
//  *  */
// exp.getCanBuyHeroList = function()
// {
//     if( null == this.canBuyQuaList )
//     {
//         var qua = dataApi.CommonParameter.getOptionValue("Player_BuyHeroQua",1);
//         var temp = dataApi.HeroAttribute.getCanBuyHeroListByQua(qua);
//         this.canBuyQuaList = {};
//         var self = this;
//         _.map(temp,function( data ) {
//              self.canBuyQuaList[data.id] = data;
//         });
//     }
//     return this.canBuyQuaList;
// };
//
// /*
// *  角色是否可以购买
// *  */
// exp.isCanBuyHeroById = function( id )
// {
//     return !!this.getCanBuyHeroList()[id];
// }


/**
 * 通过（HeroAttribute表的）id 判断角色是否有配置为 解锁和购买
 * 返回：true表示有 反之则没有
 * */
exp.isConfigHeroLockById = function ( id ) {
    if( null == Player_RoleSellList ){
        Player_RoleSellList = {};
        var tempList = dataApi.CommonParameter.getOptionList("Player_RoleSellList");
        _.each(tempList,function (id) {
            Player_RoleSellList[id] = true;
        });
    }
    var temp = Player_RoleSellList[id];
    return  !!temp;
};

var MatchRange = function (low, high) {
    this.low = low;
    this.high = high;
};

MatchRange.prototype.equal = function (other) {
    return utils.almostEqualRelativeOrAbsolute(this.low, other.low) && utils.almostEqualRelativeOrAbsolute(this.high, other.high);
};

MatchRange.prototype.getInfo = function () {
    return {low: this.low, high: this.high};
};

exp.getEndlessMatchRange = function (optionId) {
    var rangeStr = exp.getOptionValue(optionId, '');
    var rangeNums = rangeStr.split('&');
    if (rangeNums.length === 2) {
        return new MatchRange(parseFloat(rangeNums[0]), parseFloat(rangeNums[1]));
    }
    return new MatchRange(1, 1);
};

exp.getRangeOption = function (optionId) {
    var rangeStr = exp.getOptionValue(optionId, '');
    var rangeNums = rangeStr.split('&');
    if (rangeNums.length === 2) {
        return new MatchRange(parseFloat(rangeNums[0]), parseFloat(rangeNums[1]));
    }
    return new MatchRange(0, 0);
};


/*
* 获取随机boss
*/
exp.randomBossDataByRand = function (bossList) {
    bossList = utils.parseParams(bossList,'#');
    if( randomBossAll == null ){
        randomBossAll = dataApi.RandomBoss.all();
        /*appearChanceTotal = 0;
        _.each(randomBossAll,function (data) {
            data.appearChanceBf = appearChanceTotal;
            appearChanceTotal += data.appearChance;
            data.appearChanceAf = appearChanceTotal;
        });*/
    }
    var pos = _.random(0,bossList.length-1);// [138786](随机boss模式优化)在关卡表新增一可以显示随机boss列表的新字段

    if(randomBossAll[bossList[pos]] != null){
        return randomBossAll[bossList[pos]];
    }
    else{
        return null;
    }
    /*var myRand = _.random(0,appearChanceTotal*1000)*0.001;
    var randomBossData  = _.filter( randomBossAll,function (data) {
        return data.appearChanceBf<=myRand && data.appearChanceAf>myRand;
    });
    if(_.size(randomBossData)>0){
        return randomBossData[0];
    }else{
        return null;
    }*/
};

exp.getRandomValueByWeight = function (randList, weightList) {
    var randomList = [];
    for (var i in weightList) {
        for (var j = 0; j < weightList[i]; j++) {
            randomList.push(randList[i]);
        }
    }
    var randomValue = randomList[Math.floor(Math.random()*randomList.length)];
    return randomValue;
}