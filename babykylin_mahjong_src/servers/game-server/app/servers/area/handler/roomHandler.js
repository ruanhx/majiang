/**
 * Created by Administrator on 2017/10/25 0025.
 */
var pomelo = require('pomelo'),
    async = require('async'),
    logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    playerDao = require('../../../dao/playerDao'),
    dataApi = require('../../../util/dataApi'),
    dataUtils = require('../../../util/dataUtils'),
    utils = require('../../../util/utils'),
    dropUtils = require('../../../domain/area/dropUtils'),
    consts = require('../../../consts/consts'),
    flow = require('../../../consts/flow'),
    Utils =  require('../../../util/utils');


var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

pro.createRoom = function (msg, session, next) {

};