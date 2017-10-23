/**
 * Created by Administrator on 2016/3/11 0011.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var SysAssistFight = function (data) {
    IndexData.call(this, data);
};

util.inherits(SysAssistFight, IndexData);

var pro = SysAssistFight.prototype;
var sysAssistList = [];
pro.rowParser = function (row) {
    // row.id = row.customId;
    if(row.customId == 0){
        sysAssistList.push(row);
    }
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

pro.getAllAssistList= function () {
    var clientInfo = [];
    sysAssistList.forEach(function (data) {
        var info = {};
        info.playerId = data.id;
        info.playername = data.assistPlayerName;
        info.headPicId = data.roleId;
        info.heroId = data.roleId;
        info.highPower = data.power;
        clientInfo.push(info);
    });
    return clientInfo;
};

pro.getDataById = function (id) {
    var data = this.findById(id);
    if (!data){
        return null;
    }
    var info = {};
    info.playerId = data.id;
    info.playername = data.assistPlayerName;
    info.headPicId = data.roleId;
    info.heroId = data.roleId;
    info.highPower = data.power;
    return info;
};

module.exports = function (data) {
    return new SysAssistFight(data);
};