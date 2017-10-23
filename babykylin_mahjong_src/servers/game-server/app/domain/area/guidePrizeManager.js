/**
 * Created by kilua on 2016/5/17 0017.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var Manager = function (player) {
    this.player = player;
};

var pro = Manager.prototype;

pro._makeIndex = function () {
    var self = this;
    self.guideById = {};
    self.guideIds.forEach(function (guideId) {
        self.guideById[guideId] = 1;
    });
};

pro.load = function (guideIds) {
    this.guideIds = guideIds || [];
    this._makeIndex();
    logger.debug('load guideIds = %j, guideById = %j', this.guideIds, this.guideById);
};

pro.exists = function (guideId) {
    return !!this.guideById[guideId];
};

pro.add = function (guideId) {
    if (!this.guideById[guideId]) {
        this.guideIds.push(guideId);
        this.guideById[guideId] = 1;
        // 触发保存
        logger.debug('addGuidePrize guideId = %s', guideId);
        this.player.emit('saveGuidePrize', {playerId: this.player.id, guideIds: this.guideIds});
    } else {
        logger.debug('add already have guideId = %s', guideId);
    }
};

var guidePrizeMgrByPlayerId = {};
module.exports.get = function (player) {
    var guidePrizeMgr = guidePrizeMgrByPlayerId[player.id];
    if (!guidePrizeMgr) {
        guidePrizeMgr = guidePrizeMgrByPlayerId[player.id] = new Manager(player);
    }
    return guidePrizeMgr;
};

module.exports.remove = function(player){
    var guidePrizeMgr = guidePrizeMgrByPlayerId[player.id];
    if(guidePrizeMgr){
        delete guidePrizeMgrByPlayerId[player.id];
    }
};