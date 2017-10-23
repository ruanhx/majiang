/**
 * Created by Administrator on 2016/2/29 0029.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var PetAttribute = function (data) {
    IndexData.call(this, data, [['petId', 'quality']]);
};

util.inherits(PetAttribute, IndexData);

var pro = PetAttribute.prototype;

pro.rowParser = function (row) {
    //row.Id = row.id;
    //row.id = [row.roleId, row.quality].join('_');
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

/*
 *   通过宠物id查找宠物数据
 * */
pro.getPetDataById = function (petId) {
    return this.findById(petId);
};

module.exports = function (data) {
    return new PetAttribute(data);
};