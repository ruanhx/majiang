/**
 * Created with JetBrains WebStorm.
 * User: kilua
 * Date: 13-10-11
 * Time: 上午9:57
 * To change this template use File | Settings | File Templates.
 */

/*
*   对策划表某些特殊字段进行解析
* */

var _ = require('underscore');

var dataApi = require('./dataApi'),
    Consts = require('../script/consts');

var dataParser = module.exports = {};

/*
*   对模型配置表的记录进行解析
*   @param {Object} modelConfig a list of key-value pairs of model properties, may be modified according to the parse
 *   result.
* */
dataParser.parseModelConfig = function(modelConfig){
    var measure = modelConfig.bbox
        , result = true;

    if(!measure || measure === '-'){
        return false;
    }
    var elems = measure.split('#');
    if(!elems[0] || !elems[1]){
        result = false;
    }else{
        result = true;
        modelConfig.bbox = {length: Number(elems[0]), width: Number(elems[1])};
    }
    return result;
};

/*
 *   受击方(玩家或怪物)表现等级对应的暴击标准值
 * */
dataParser.getHitCritStdValByLv = function(level){
    var datas = dataApi.criLevel.findBy('lv', level)
        , data;
    if(!datas || !_.isArray(datas)){
        console.error('getPlayerHitCritStdValByLv data not found!level = %s', level);
        return 0;
    }
    data = datas[0];
    if(!data){
        return 0;
    }
    return data.staVal;
};

/*
 *   获取一波怪的信息
 * */
function makeMobGroup(groupData){
    var mobs = [], group = {},
        defCoeDict = {frontHPCoe: 1, frontAtkCoe: 1, midHPCoe: 1, midAtkCoe: 1, backHPCoe: 1, backAtkCoe: 1},
        mobCoeDict = dataApi.barrierCoeByType.findById(groupData.barrierType) || defCoeDict;
    if(groupData.frontMobId){
        mobs.push({id: groupData.frontMobId, LV: groupData.frontMobLV, dropId: groupData.frontMobDropId,
            pos: Consts.BATTLE_FIELD_POS.FRONT, coe: {hp: mobCoeDict.frontHPCoe, atk: mobCoeDict.frontAtkCoe}});
    }
    if(groupData.midMobId){
        mobs.push({id: groupData.midMobId, LV: groupData.midMobLV, dropId: groupData.midMobDropId,
            pos: Consts.BATTLE_FIELD_POS.MIDDLE, coe: {hp: mobCoeDict.midHPCoe, atk: mobCoeDict.midAtkCoe}});
    }
    if(groupData.backMobId){
        mobs.push({id: groupData.backMobId, LV: groupData.backMobLV, dropId: groupData.backMobDropId,
            pos: Consts.BATTLE_FIELD_POS.BACK, coe: {hp: mobCoeDict.backHPCoe, atk: mobCoeDict.backAtkCoe}});
    }
    group.id = groupData.group;
    group.uid = groupData.id;
    group.mobs = mobs;
    group.cond = groupData.cond;
    group.condParam = groupData.condParam;
    return group;
}

dataParser.getMobGroup = function(barrier, act, groupId){
    var groups = dataApi.groupRefreshMob.findBy('barrier', barrier),
        i, group;
    if(groups && groups.length > 0){
        for(i = 0; i < groups.length; ++i){
            group = groups[i];
            if(group.act === act && group.group === groupId){
                return makeMobGroup(group);
            }
        }
    }
};

dataParser.getOptionValue = function(section, option, defVal){
    var options = dataApi.config.findBy('section', section),
        i;
    if(!options || options.length <= 0){
        return defVal;
    }
    for(i = 0; i < options.length; ++i){
        if(options[i].option === option){
            return options[i].value;
        }
    }
    return defVal;
};