/**
 * Created by kilua on 2016/7/1 0001.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var EquipRefine = function (data) {
    IndexData.call(this, data);
};

util.inherits(EquipRefine, IndexData);

var pro = EquipRefine.prototype;

var maxLV = 0;
pro.rowParser = function (row) {
    maxLV = Math.max(maxLV, row.refinelv);
    return row;
};

pro.getPrimaryKey = function () {
    return 'refinelv';
};

pro.getMaxLV = function () {
    return maxLV;
};

module.exports = function (data) {
    return new EquipRefine(data);
};