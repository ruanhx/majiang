/**
 * Created by tony on 2016/10/3.
 */
var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var HunterItemAttribute = function (data) {
    IndexData.call(this, data, [['id']]);
};

util.inherits(HunterItemAttribute, IndexData);

var pro = HunterItemAttribute.prototype;

pro.rowParser = function (row) {

    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

module.exports = function (data) {
    return new HunterItemAttribute(data);
};

