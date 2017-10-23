/**
 * Created by tony on 2016/9/19.
 */
var util = require('util'),
    _ = require('underscore');

var IndexData = require('../jsonTable');

var Mission = function (data) {
    IndexData.call(this, data ,[['conditionType','missionType','groupType']]);

};

util.inherits(Mission, IndexData);

var pro = Mission.prototype;
var getCustomKey=function(missionType,groupType)
{
    var key = missionType +'_'+groupType;
    return key;
};
var groupData = {};
pro.rowParser = function (row) {
    groupData = groupData || {};
    if( !groupData[row.conditionType] )
    {
        groupData[row.conditionType] = {};
    }

    var key = getCustomKey( row.missionType ,row.groupType );

    if(!groupData[row.conditionType][key])
    {
        groupData[row.conditionType][key] = { missionType: row.missionType,groupType:row.groupType };
    }
    return row;
};


pro.getPrimaryKey = function () {
    return 'id';
};
//通过条件id获取 同条件的不同missionType、groupType
pro.getDataGroupKey = function( conditionType )
{
    if( !groupData[conditionType] )
    {
        return {};
    }
    return groupData[conditionType];
};

pro.getDataByProgress = function( conditionType, progress)
{
    var dataList = this.all();
    var missionData = _.filter(dataList, function (checkData) {
        return conditionType == checkData.conditionType && progress == checkData.progress;
    });
    if (!missionData){
        return 0;
    }
    return missionData[0];
};

pro.getDataGroup = function( conditionType, missionType,groupType)
{
    var temp = this.findByIndex({conditionType: conditionType,missionType:missionType,groupType:groupType}) || [];
    if (!_.isArray(temp)) {
        temp = [temp];
    }
    return temp;
};

//通过参数
pro.getConditionValue2ByXX=function( conditionType, missionType,groupType )
{
    var temp = 0;
    var listTemp = this.getDataGroup( conditionType, missionType,groupType );
    _.map( listTemp ,function(data){
        temp = data.conditionValue2;
        return;
    });
    return temp;
};

//通过参数
pro.getConditionValueByXX=function( conditionType, missionType,groupType )
{
    var temp = null;
    var listTemp = this.getDataGroup( conditionType, missionType,groupType );

    return listTemp;
    _.map( listTemp ,function(data){
        temp = {conditionValue1:data.conditionValue1,conditionValue2:data.conditionValue2};
        return;
    });
    return temp;
};

module.exports = function (data) {
    return new Mission(data);
};