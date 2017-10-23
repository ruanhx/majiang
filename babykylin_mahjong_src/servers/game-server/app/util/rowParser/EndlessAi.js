/**
 * Created by kilua on 2016/7/18 0018.
 */

var util = require('util');

var _ = require('underscore');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var EndlessAi = function (data) {
    IndexData.call(this, data);
};

util.inherits(EndlessAi, IndexData);

var pro = EndlessAi.prototype;

pro.rowParser = function (row) {
    row.powerRange = utils.parseParams(row.powerRange, '#');
    row.heroId = utils.parseParams(row.heroId, '#');
    row.petId = utils.parseParams(row.petId, '#');
    return row;
};

pro.getPrimaryKey = function () {
    return '';
};

pro.getRndHeroIdByPower = function (power) {
    var aiDatas = _.filter(this.data, function (aiData) {
        return power >= aiData.powerRange[0] && power <= aiData.powerRange[1];
    });
    // 应该有且只有一条数据被找到
    var aiData = aiDatas[0];
    if (aiData) {
        return _.sample(aiData.heroId) || 0;
    }
    return 0;
};

pro.getRndPetIdByPower = function (power) {
    var aiDatas = _.filter(this.data, function (aiData) {
        return power >= aiData.powerRange[0] && power <= aiData.powerRange[1];
    });
    var aiData = aiDatas[0];
    if (aiData) {
        return _.sample(aiData.petId) || 0;
    }
    return 0;
};

module.exports = function (data) {
    return new EndlessAi(data);
};