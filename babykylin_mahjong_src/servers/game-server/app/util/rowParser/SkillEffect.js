/**
 * Created by kilua on 2016/8/19 0019.
 */

var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var SkillEffect = function (data) {
    IndexData.call(this, data);
};

util.inherits(SkillEffect, IndexData);

var pro = SkillEffect.prototype;

pro.rowParser = function (row) {
    row.effectRateAddOfLevel = utils.parseParams(row.effectRateAddOfLevel, '#');
    var levelAddDict = {};
    row.effectRateAddOfLevel.forEach(function (levelAdd) {
        var parts = utils.parseParams(levelAdd, '&');
        if (parts && parts.length === 2) {
            levelAddDict[parts[0]] = parts[1];
        }
    });
    row.effectRateAddOfLevel = levelAddDict;

    row.effectValueAddOfLevel = utils.parseParams(row.effectValueAddOfLevel, '#');
    levelAddDict = {};
    row.effectValueAddOfLevel.forEach(function (levelAdd) {
        var parts = utils.parseParams(levelAdd, '&');
        if (parts && parts.length === 2) {
            levelAddDict[parts[0]] = parts[1];
        }
    });
    row.effectValueAddOfLevel = levelAddDict;
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

pro.getEffectRateAddByLevel = function (row, curLV) {
    var i, addVal;
    for (i = curLV; i >= 1; --i) {
        addVal = row.effectRateAddOfLevel[curLV];
        if (addVal) {
            return addVal;
        }
    }
    return 0;
};

pro.getEffectValueAddByLevel = function (row, curLV) {
    var i, addVal;
    for (i = curLV; i >= 1; --i) {
        addVal = row.effectValueAddOfLevel[curLV];
        if (addVal) {
            return addVal;
        }
    }
    return 0;
};

pro.getEffectRateAddTotalByLevel = function (row, curLV) {
    var i, addTotal = 0;
    for (i = 1; i <= curLV; ++i) {
        addTotal += this.getEffectRateAddByLevel(row, i - 1/*剔除1级*/);
    }
    return addTotal;
};

pro.getEffectValueAddTotalByLevel = function (row, curLV) {
    var i, addTotal = 0;
    for (i = 1; i <= curLV; ++i) {
        addTotal += this.getEffectValueAddByLevel(row, i - 1/*剔除1级*/);
    }
    return addTotal;
};

module.exports = function (data) {
    return new SkillEffect(data);
};