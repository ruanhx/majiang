/**
 * Created by kilua on 2016/7/1 0001.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var EquipStrengthen = function (data) {
    IndexData.call(this, data);
};

util.inherits(EquipStrengthen, IndexData);

var pro = EquipStrengthen.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'strengthenLv';
};

module.exports = function (data) {
    return new EquipStrengthen(data);
};