/**
 * Created by tony on 2016/10/3.
 */
var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var EndlessDivision = function (data) {
    IndexData.call(this, data, [['id']]);
};

util.inherits(EndlessDivision, IndexData);

var pro = EndlessDivision.prototype;
var divisionIdList = [];
pro.rowParser = function (row) {
    divisionIdList.push(row.id);
    row.aiScore = utils.parseParams(row.aiScore, '#');
    row.aiPower = utils.parseParams(row.aiPower, '#');
    row.aiRole = utils.parseParams(row.aiRole, '#');
    row.pointsAdd = utils.parseParams(row.pointsAdd, '#');
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

pro.getDivisionIdList = function(){
    return divisionIdList;
}

pro.getDivisionByPoints = function(points){
    var self = this;
    var tempdivisionData;
    var rsDivision = 0;
    for(var i=0;i<divisionIdList.length;i++){
        tempdivisionData = self.findById(divisionIdList[i]);
        if(tempdivisionData.points > points){
            break;
        }
        rsDivision = divisionIdList[i];
    }
    return rsDivision;
}

pro.getPointsAdd = function(divisionId,surpassCnt){
    var self = this;
    if(surpassCnt===0) return 0;
    var division = self.findById(divisionId);
    if(!division) return 0;
    if(surpassCnt>division.pointsAdd.length) return 0;
    return division.pointsAdd[surpassCnt-1];
}

module.exports = function (data) {
    return new EndlessDivision(data);
};

