/**
 * Created by rhx on 2017/6/8.
 */
var pomelo = require('pomelo'),
    area = require('../../../domain/area/area'),
    playerManager = require('../../../domain/world/playerManager');

var Code = require('../../../../shared/code');
//     Consts = require('../../../consts/consts');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

pro.push = function (clientInfo,callback) {
    playerManager.get().rollingMessage(clientInfo);
    callback(null,{code:Code.OK});
};