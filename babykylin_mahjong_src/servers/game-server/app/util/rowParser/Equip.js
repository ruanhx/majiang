/**
 * Created by kilua on 2016/6/30 0030.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var Equip = function (data) {
    IndexData.call(this, data);
};

util.inherits(Equip, IndexData);

var pro = Equip.prototype;

pro.rowParser = function (row) {
    var chance1 = row.probability1,
        chance2 = row.probability2,
        chanceTotal = chance1 + chance2;
    if (chanceTotal) {
        // 随机装备概率按权重算
        row.probability1 = row.probability1 / chanceTotal;
        row.probability2 = row.probability2 / chanceTotal;
    } else {
        row.probability1 = 0;
        row.probability2 = 0;
    }
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

module.exports = function (data) {
    return new Equip(data);
};