/**
 * Created by rhx on 2017/9/2.
 */
var rechargeDao = require('../dao/rechargeDao'),
    dbClient = require('../dao/mysql/mysql');
var rechargeReward = function () {
    this.rechargeList = {};
};
var pro = rechargeReward.prototype;

pro.initData = function () {
    var self = this;
    rechargeDao.getAll(dbClient, {}, function (err,res) {
        res.forEach(function (record) {
            self.rechargeList[record.MAC] = record;
        });
    });
};

pro.getRechargeInfo = function (Mac) {
    return this.rechargeList[Mac];
}


var _recharge = null;
module.exports.getInstance = function () {
    if (!_recharge) {
        _recharge = new rechargeReward();
    }
    return _recharge;
};