/**
 * Created by tony on 2016/7/19.
 */
var util = require('util');
var _ = require('underscore');
var utils = require('../utils'),
    IndexData = require('../jsonTable');

//数据索引
var EquipWash = function (data) {
    IndexData.call(this, data);
};

//继承基类
util.inherits(EquipWash, IndexData);

var pro = EquipWash.prototype;

//行解析
pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

//随机出一个小于cnt的数据
pro.randOneData = function( cnt ,typeIdList )
{
    var rows = _.filter(this.data, function(row){
        return ( row.needtime<=(cnt+1)  ) &&  !_.contains(typeIdList, row.washType) ;
    });
    return _.sample(rows);
}
/*
* 通过洗练id获取洗练行数据
*
pro.getWashData = function (id) {
    var washData = this.findByIndex({id:id});
    if (_.isArray(id)) {
        // 找不到数据时，结果是个空数组；找到多条数据时，结果是个数组
        return null;
    }
    return washData;
};**/

module.exports = function (data) {
    return new EquipWash(data);
};