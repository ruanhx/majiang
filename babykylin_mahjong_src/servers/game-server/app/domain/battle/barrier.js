/**
 * Created by employee11 on 2015/12/18.
 */

var id = 1;

var barrier = function (opts) {
    this.id = id++;
    this.barrierId = opts.barrierId;
    this.name = opts.name;
    this.startTick = Date.now();
    this.buyTimeCount = 0;
    this.reviveCnt = 0;
    this.player = opts.player;
    this.passTime = opts.passTime;
    this.isPassed = 0;
};

module.exports = barrier;

var pro = barrier.prototype;

pro.getInfo = function () {
    return {
        id: this.id,
        startTick: this.startTick,
        buyTimeCount: this.buyTimeCount
    };
};

pro.doBuyTime = function () {
    this.buyTimeCount += 1;
};

pro.doRevive = function () {
    this.reviveCnt += 1;
};

/*
 *   销毁关卡前调用
 * */
pro.destroy = function () {
    this.costTick = Date.now() - this.startTick;
};

