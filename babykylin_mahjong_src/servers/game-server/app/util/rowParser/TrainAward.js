/**
 * Created by tony on 2016/10/3.
 */
var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var TrainAward = function (data) {
    IndexData.call(this, data, [['id']]);
};

util.inherits(TrainAward, IndexData);

var pro = TrainAward.prototype;

var dataList = [];
pro.rowParser = function (row) {
    dataList.push(row);
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

module.exports = function (data) {
    return new TrainAward(data);
};

pro.getDataList = function(){
    return dataList;
}


