/**
 * Created by Administrator on 2016/3/11 0011.
 */

var util = require('util');
var _ = require('underscore');
var IndexData = require('../jsonTable');

var EndlessPowerCheck = function (data) {
    IndexData.call(this, data);
};

util.inherits(EndlessPowerCheck, IndexData);

var pro = EndlessPowerCheck.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return '';
};

pro.getLimitScore = function (fightPower) {
    var dataList = this.all();

    var limitScore = _.filter(dataList, function (checkData) {
        return fightPower >= checkData.fightLow && fightPower < checkData.fight;
    });
    if (!limitScore){
        return 0;
    }
    return limitScore[0].score;
};

module.exports = function (data) {
    return new EndlessPowerCheck(data);
};