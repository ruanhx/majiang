/**
 * Created by kilua on 2016/6/22 0022.
 */

var pomelo = require('pomelo');

var utils = require('./utils');

var exp = module.exports = {};

exp.getServerDay = function () {
    var serverStartTick = pomelo.app.get('serverStartTick'),
        serverStartTime = new Date(),
        curDate = new Date();
    serverStartTime.setTime(serverStartTick);
    return utils.daysBetween(curDate, serverStartTime) + 1;
};
