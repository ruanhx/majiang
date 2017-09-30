/**
 * Created by Administrator on 2017/9/12 0012.
 */
var Player = function (opts) {
    this.seat = opts.seat;
    this.count = [];
    this.userId = opts.userId;
    this.totalCnt = 0;
    this.ready = false;
    this.thisTurnCnt =0;
};

var pro = Player.prototype;


module.exports = Player;