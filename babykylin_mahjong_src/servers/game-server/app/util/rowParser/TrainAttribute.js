/**
 * Created by tony on 2016/10/3.
 */
var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var TrainAttribute = function (data) {
    IndexData.call(this, data, [['id'],['customId']]);
};

util.inherits(TrainAttribute, IndexData);

var pro = TrainAttribute.prototype;

var maxCustomId = 0;

pro.rowParser = function (row) {
    maxCustomId = row.customId;
    row.serAwardMaxVal = row.awardValueTime * row.awardValueMax *100;//训练值最大值的100倍
    return row;
};

pro.getMaxCustomId = function(){
    return maxCustomId;
}

pro.getPrimaryKey = function () {
    return 'id';
};

module.exports = function (data) {
    return new TrainAttribute(data);
};


