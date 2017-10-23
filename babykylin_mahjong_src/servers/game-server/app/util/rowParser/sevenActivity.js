/**
 * Created by tony on 2016/12/28.
 */
var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var sevenActivity = function (data) {
    IndexData.call(this, data);
};

util.inherits(sevenActivity, IndexData);

var pro = sevenActivity.prototype;
var dataList = []
pro.rowParser = function (row) {
    dataList.push(row);
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

pro.getList = function(){
    return dataList;
}

module.exports = function (data) {
    return new sevenActivity(data);
};