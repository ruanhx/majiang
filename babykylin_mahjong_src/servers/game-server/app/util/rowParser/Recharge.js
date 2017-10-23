/**
 * Created by tony on 2016/8/31.
 */
var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var Recharge = function (data) {
    IndexData.call(this, data,[['id']]);
};

util.inherits(Recharge, IndexData);

var pro = Recharge.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'productId';
};

pro.getUnionCardByType = function(type){
    for(var key in this.data){
        if(type == this.data[key].type){
            return this.data[key];
        }
    }
    return null;
}

module.exports = function (data) {
    return new Recharge(data);
};