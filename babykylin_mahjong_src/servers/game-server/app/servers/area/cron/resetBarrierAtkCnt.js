/**
 * Created by lishaoshen on 15-12-11.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area');

var Cron = function(app){
    this.app = app;
};

var pro = Cron.prototype;

pro.reset = function(){
    logger.debug('reset current time %s', new Date().toTimeString());
    // 即时重置在线部分玩家，不在线的玩家等上线后再进行重置
    var playerIds = area.getPlayerIds();
    for(var playerId in playerIds ){
        var player = area.getPlayer(playerIds[playerId]);
        if(!!player){
            player.resetBarriers();
           // player.bossAtkCntManager.resetBossAtkCnt();
        }
    }
};

module.exports = function(app){
    return new Cron(app);
};