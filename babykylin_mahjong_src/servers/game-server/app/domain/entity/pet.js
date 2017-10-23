/**
 * Created by Administrator on 2016/2/29 0029.
 */

var util = require('util');

var logger = require('pomelo-logger').getLogger(__filename);

var dataApi = require('../../util/dataApi');

var Pet = function (opts) {
    opts = opts || {};

    this.playerId = opts.playerId;
    this.pos = opts.pos || 0;
    this.roleId = opts.roleId;
    this.quality = opts.quality;
    this.lv = opts.lv;
    this.exp = opts.exp;

    this.bindData();

};

var pro = Pet.prototype;

pro.clearPet = function(){
    delete this.playerId;
    delete this.pos;
    delete this.roleId;
    delete this.quality;
    delete this.lv;
    delete this.exp;
    if(!!this.data){
        delete this.data;
    }
}

pro.bindData = function () {
    var petData = dataApi.PetAttribute.findByIndex({petId: this.roleId, quality: this.quality});
    if (petData) {
        this.data = petData;
    } else {
        logger.error('bindData failed!data not found!roleId = %s, quality = %s', this.roleId, this.quality);
    }
};

pro.qualityUp = function () {
    this.quality++;
    this.bindData();
};

pro.lvUp = function (addExp) {
    var curLv = this.lv, curExp = this.exp + addExp;
    for (var j = curLv; j < this.data.maxLevel; j++) {
        var upgradeExp = dataApi.UpgradeExp.findById(j);
        if (curExp > upgradeExp.petUpgradeExp) {
            curLv++;
            curExp -= upgradeExp.petUpgradeExp;
            if (curLv === this.data.maxLevel) {
                curExp = Math.min(curExp, upgradeExp.petUpgradeExp);
            }
        } else {
            break;
        }
    }
    this.lv = curLv;
    this.exp = curExp;
};

pro.getTotalExp = function () {
    var curLV, totalExp = 0, upgradeData;
    for (curLV = 1; curLV < this.lv; ++curLV) {
        upgradeData = dataApi.UpgradeExp.findById(curLV);
        if (upgradeData) {
            totalExp += upgradeData.petUpgradeExp;
        }
    }
    totalExp += this.exp;
    return totalExp;
};

pro.getData = function () {
    var petInfo = {};
    petInfo.playerId = this.playerId;
    petInfo.pos = this.pos;
    petInfo.roleId = this.roleId;
    petInfo.quality = this.quality;
    petInfo.lv = this.lv;
    petInfo.exp = this.exp;
    return petInfo;
};

pro.getClientInfo = function () {
    var clientInfo = {};
    clientInfo.pos = this.pos;
    clientInfo.petId = this.roleId;
    clientInfo.quality = this.quality;
    clientInfo.lv = this.lv;
    clientInfo.exp = this.exp;
    return clientInfo;
};

pro.setLevel = function (level) {
    if (this.lv !== level) {
        this.lv = level;
        return true;
    }
    return false;
};

pro.getPetId = function () {
    return this.data.id;
};

pro.getNeedMat1Cnt = function () {
    return this.data.needMat1Num;
};

pro.getNeedMat1 = function () {
    return this.data.needMat1;
};

pro.getNeedMat2Cnt = function () {
    return this.data.needMat2Num;
};

pro.getNeedMat2 = function () {
    return this.data.needMat2;
};

pro.getMaxLV = function () {
    return this.data.maxLevel;
};

pro.getNeedMoney = function () {
    return this.data.needMoney;
};

module.exports = Pet;