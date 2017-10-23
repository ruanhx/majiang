/**
 * Created by tony on 2017/2/15.
 */

var util = require('util');

var _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename);

var Activity = require('../playerActivity'),
    dataApi = require('../../../util/dataApi'),
    dropUtils = require('../../area/dropUtils'),
    CondDetail = require('../../../domain/activity/condDetail'),
    utils = require('../../../util/utils'),
    Consts = require('../../../consts/consts');

var UnionPrivilege = function (manager, player, actData) {
    Activity.call(this, manager, player, actData);

};

util.inherits(UnionPrivilege, Activity);

var pro = UnionPrivilege.prototype;

pro.haveAwardsToDraw = function () {
    var player = this.player;
    var weekCardEndTick = player.weekCardEndTick,
        weekCardWelfareTick = player.weekCardWelfareTick,
        monthCardEndTick = player.monthCardEndTick,
        monthCardWelfareTick = player.monthCardWelfareTick,
        foreverCardEndTick = player.foreverCardEndTick,
        foreverCardWelfareTick = player.foreverCardWelfareTick;
    var now = new Date();
    //判断特权是否已经过期，以及是否可以领取
    var weekfareDate = new Date(weekCardWelfareTick);
    if(now.getTime() < weekCardEndTick && (now.getDate() != weekfareDate.getDate() || now.getMonth() != weekfareDate.getMonth() || now.getFullYear() != weekfareDate.getFullYear())){
        return true;
    }
    var monthfareDate = new Date(monthCardWelfareTick);
    if(now.getTime() < monthCardEndTick && (now.getDate() != monthfareDate.getDate() || now.getMonth() != monthfareDate.getMonth() || now.getFullYear() != monthfareDate.getFullYear())){
        return true;
    }
    var yearfareDate = new Date(foreverCardWelfareTick);
    if(foreverCardEndTick > 0 && (now.getDate() != yearfareDate.getDate() || now.getMonth() != yearfareDate.getMonth() || now.getFullYear() != yearfareDate.getFullYear())){
        return true;
    }

    return false;
};

//新的一天给客户端推送红点
pro.reset = function () {
    this.refreshRedSpot();
}

module.exports = UnionPrivilege;
