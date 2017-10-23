/**
 * Created by tony on 2016/3/25 0025.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var consts = require('./../../consts/consts');
var DropItemParameter = function (data) {
    IndexData.call(this, data);
};

util.inherits(DropItemParameter, IndexData);

var pro = DropItemParameter.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

/*
*   额外属性添加
* */
pro.getAttributes = function ( drop ) {
    var jsons = null;
    var dropType = drop.dropType;
    var id = drop.parameterId;
    if( id > 0 ){
        var data = this.findById(id);
        if(!!data){
            jsons={};
            if( consts.DROP_TYPE.HERO == dropType &&  1==data.type ){
                jsons.heroLevel = data.value;
            }
        }
    }
    return jsons;
};

module.exports = function (data) {
    return new DropItemParameter(data);
};