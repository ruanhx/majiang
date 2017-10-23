/**
 * Created by rhx on 2017/6/7.
 */
var pomelo = require('pomelo'),
    area = require('../../../domain/area/area'),
    logger = require('pomelo-logger').getLogger(__filename),
    dataUtils = require('../../../util/dataUtils');

var Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;
// 更新抓宝排行
pro.updateCatchRankingList = function (dec, cb) {
    this.app.get('sync').exec('catchRankingListSync.save', dec.id, dec, dec.id);
    var res = {};
    return cb(res);
};
// 清空抓宝排行
pro.clearCatchRankingList = function (dec, cb) {
    this.app.get('sync').exec('catchRankingListSync.save', dec.id, dec, dec.id);
    var res = {};
    return cb(res);
};

// 更新关卡排行
pro.updateBarrierRankingList = function (dec, cb) {
    this.app.get('sync').exec('barrierRankListSync.save', [dec.id, dec.type].join('_'), dec, dec.id);
    var res = {};
    return cb(res);
};
// 清空关卡排行
pro.clearBarrierRankingList = function (dec, cb) {
    this.app.get('sync').exec('barrierRankListSync.save', [dec.id, dec.type].join('_'), dec, dec.id);
    var res = {};
    return cb(res);
};

// 更新排行 统一使用
pro.updateRankingList = function (dec, cb) {
    this.app.get('sync').exec('rankListSync.save', [dec.id, dec.type].join('_'), dec, dec.id);
    var res = {};
    return cb(res);
};
// 清空排行 统一使用
pro.clearRankingList = function (dec, cb) {
    this.app.get('sync').exec('rankListSync.save', [dec.id].join('_'), dec, dec.id);
    var res = {};
    return cb(res);
};