/**
 * Created by Administrator on 2016/3/25 0025.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var Indiana = function (data) {
    IndexData.call(this, data);
};

util.inherits(Indiana, IndexData);

var pro = Indiana.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

pro.getFirstSingleRow = function(){
    for(var key in this.data){
        if(this.data[key].barrierHigh == 0){//barrierHigh==0表示首次夺宝
            return this.data[key];
        }
    }
}

pro.getIndianaCfgByBarrierId = function(newBarrierId){
    for(var key in this.data){
        if(this.data[key].barrierLow <= newBarrierId && newBarrierId <= this.data[key].barrierHigh){
            return this.data[key];
        }
    }
    return null;
}

module.exports = function (data) {
    return new Indiana(data);
};