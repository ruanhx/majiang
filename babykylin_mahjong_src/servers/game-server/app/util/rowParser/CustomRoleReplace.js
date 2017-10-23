/**
 * Created by Administrator on 2016/3/11 0011.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var CustomRoleReplace = function (data) {
    IndexData.call(this, data);
};

util.inherits(CustomRoleReplace, IndexData);

var pro = CustomRoleReplace.prototype;

pro.rowParser = function (row) {
    // row.id = row.customId;
    return row;
};

pro.getPrimaryKey = function () {
    return 'customId';
};

pro.getAllPowerByKey = function (id) {
    var data = this.findById(id);
    if (!data){
        return null;
    }
    var power = data.shieldPower + data.rolePower + data.secondWeaponPower + data.planePower;
    return power;
};

module.exports = function (data) {
    return new CustomRoleReplace(data);
};