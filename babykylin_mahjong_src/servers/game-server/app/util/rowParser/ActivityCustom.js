/**
 * Created by tony on 2016/10/3.
 */
var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var ActivityCustom = function (data) {
    IndexData.call(this, data, [['activityId']]);
};

util.inherits(ActivityCustom, IndexData);

var pro = ActivityCustom.prototype;
var type4timeMap = {};
pro.rowParser = function (row) {
    row.openingTime = utils.parseParams(row.openingTime, '#');
    type4timeMap[row.activityType] = row.openingTime;
    return row;
};

pro.getPrimaryKey = function () {
    return 'activityId';
};

module.exports = function (data) {
    return new ActivityCustom(data);
};
pro.contains = function(arr,obj){
    if(arr instanceof Array){
        for(var i = 0; i< arr.length ;i++){
            if(arr[i]==obj){
                return true;
            }
        }
    }
    return false;
}
pro.canJoin = function(activityType){
    var now = new Date();
    var week = now.getDay();
    if(week==0) week=7;
    if(now.getHours()<5){//少于五点少一天
        week = week-1;
        if(week==0) week=7;
    }
    return this.contains(type4timeMap[activityType],week);
};

