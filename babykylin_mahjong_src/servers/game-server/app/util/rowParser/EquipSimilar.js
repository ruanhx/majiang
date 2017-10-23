/**
 * Created by kilua on 2016/6/30 0030.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var EquipSimilar = function (data) {
    IndexData.call(this, data);
};

util.inherits(EquipSimilar, IndexData);

var pro = EquipSimilar.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

pro.getPower = function(id,num){
    var power = 0;
    var similar = this.findById(id);
    if(!similar) return power;
    if(num>=2){
        power += similar.similarTwoPower;
    }
    if(num>=4){
        power += similar.similarFourPower;
    }
    if(num>=6){
        power += similar.similarSixPower;
    }
    if(num>=8){
        power += similar.similarEightPower;
    }
    return power;
}

module.exports = function (data) {
    return new EquipSimilar(data);
};