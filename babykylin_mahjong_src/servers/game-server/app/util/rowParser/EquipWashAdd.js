/**
 * Created by tony on 2016/8/5.
 */
var util = require('util');
var _ = require('underscore');
var utils = require('../utils'),
    IndexData = require('../jsonTable');

//数据索引
var EquipWashAdd = function (data) {
    IndexData.call(this, data, [['type', 'value']]);
};

//继承基类
util.inherits(EquipWashAdd, IndexData);

var pro = EquipWashAdd.prototype;

//行解析
pro.rowParser = function (row) {
    //row.level = row.level
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

/*
*通过当前id找到下一级数据
* **/
pro.getNextData = function ( id  ) {
    var currData =  this.findById(id);
    var nextData =  this.findById( currData.nextId );
    return nextData;
};

module.exports = function (data) {
    return new EquipWashAdd(data);
};