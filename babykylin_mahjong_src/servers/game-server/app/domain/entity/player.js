/**
 * Created by employee11 on 2015/12/15.
 */

var util = require('util');

var _ = require('underscore'),
    pomelo = require('pomelo'),
    logger = require('pomelo-logger').getLogger(__filename);

var Entity = require('./entity'),
    consts = require('../../consts/consts'),
    UnlockChapterManager = require('./unlockChapterManager'),
    dataApi = require('../../util/dataApi'),
    dataUtils = require('../../util/dataUtils'),
    utils = require('../../util/utils'),
    EVENTS = require('../event/events'),
    messageService = require('../messageService'),
    DailyResetManager = require('../../util/dailyResetManager'),
    dropUtils = require('../area/dropUtils'),
    Code = require('../../../shared/code'),
    Consts = require('../../consts/consts'),
    FLOW = require('../../consts/flow');


//推送玩家属性
function onUpdateProp(prop, value) {
    var player = this;
    if (_.indexOf(player.saveProperties, prop) !== -1) {
        player.save();
    }
    player.pushMsg('player.updateProp', {prop: prop, value: value});
}

/**
 * Initialize a new 'Player' with the given 'opts'.
 * Player inherits Character
 *
 * @param {Object} opts
 * @api public
 */
var Player = function (opts) {
    opts = opts || {};
    opts.type = 1;
//  Character.call(this, opts);
    Entity.call(this, opts);
    this.saveProperties = [
        'roleLevel', 'playername', 'gem', 'roomId'
    ];

    //游戏语言
    this.playername = opts.playername;
    this.gem = opts.gem;
    this.MAC = opts.MAC;
    this.id = opts.id;
    this.roomId = opts.roomId;
    this.frontendId = opts.frontendId;
    this.sessionId = opts.sessionId;
    this.on(EVENTS.UPDATE_PROP, onUpdateProp.bind(this));
    // this.roleLevel = opts.roleLevel;

};

util.inherits(Player, Entity);

var pro = Player.prototype;

pro.getData = function () {
    var self = this;
    var data = {};
    var parentData = Entity.prototype.getData.call(this);

    _.each(self.saveProperties, function (prop) {
        data[prop] = self[prop];
    });

    for (var prop in parentData) {
        if (parentData.hasOwnProperty(prop)) {
            data[prop] = parentData[prop];
        }
    }
    return data;
};


pro.getClientInfo = function () {
    var client = {};
    client.playername = this.playername;
    client.gem = this.gem;
    client.roomId = this.roomId;
    client.account = this.MAC;
    client.userid = this.id;
    return client;
};

pro.clearLeaveTimer = function () {
    clearTimeout(this.leaveTimer);
    this.leaveTimer = 0;
};
pro.setFrontendId = function (frontendId) {
    this.frontendId = frontendId;
};

pro.setSession = function (newSession) {
    this.session = newSession;
};

pro.pushMsg = function (route, msg) {
    messageService.pushMessageToPlayer({uid: this.id, sid: this.frontendId}, route, msg);
};
module.exports = Player;

