/**
 * Created by kilua on 2014-11-25.
 */

var common = require('./common');

module.exports = function(row){
    row.growPow = common.parseParamPair(row.growPow);
    row.growIQ = common.parseParamPair(row.growIQ);
    row.growAgi = common.parseParamPair(row.growAgi);
    row.growAtk = common.parseParamPair(row.growAtk);
    row.growHP = common.parseParamPair(row.growHP);
    row.growDef = common.parseParamPair(row.growDef);
    row.growDuck = common.parseParamPair(row.growDuck);
    row.growCrit = common.parseParamPair(row.growCrit);
    row.growDuckPro = common.parseParamPair(row.growDuckPro);
    row.growCritPro = common.parseParamPair(row.growCritPro);
    row.growHitPro = common.parseParamPair(row.growHitPro);
    return row;
};