/**
 * Created by rhx on 2017/6/13.
 */
var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore'),
    pomelo = require('pomelo');

var dataApi = require('../../util/dataApi'),
    common = require('../../util/utils'),
    BarrierRandBoss = require('../entity/passedBarrierManager').BarrierRandBoss,
    randBossDao = require('../../dao/randBossDao'),
    friendsDao = require('../../dao/friendsDao');
Consts = require('../../consts/consts');

var randomBossMgr = function () {
    this.randBossList = {};
};
// module.exports = randomBossMgr;
var pro = randomBossMgr.prototype;


pro.init = function (cb) {
    var self = this;
    randBossDao.load(function (err, dbRandBossList) {
        if (err) {
            cb(err);
        } else {
            var waitTimer = setInterval(function () {
                if (!dataApi.isReady()) {
                    return;
                }
                clearInterval(waitTimer);
                if (!dbRandBossList) {
                    return;
                }
                dbRandBossList.forEach(function (boss) {
                    self.randBossList[boss.playerId] = new BarrierRandBoss(boss);
                });
                cb();
            }, 1000);
        }
    });
};
pro.setRandBoss = function (playerId, boss) {
    this.randBossList[playerId] = boss;
};
//  根据PlayerId获取所有boss
pro.getFriendBoss = function (friendId) {

    return this.randBossList[friendId];
};


var _getInstance;
module.exports.getInstance = function () {
    if (!_getInstance) {
        _getInstance = new randomBossMgr();
    }
    return _getInstance;
};
