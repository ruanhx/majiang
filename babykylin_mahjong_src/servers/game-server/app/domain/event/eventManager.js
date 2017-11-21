/**
 * Created by lishaoshen on 2015/11/3.
 */
var pomelo = require('pomelo');

var exp = module.exports;

/**
 * Listen event for entity
 */
exp.addEvent = function (entity) {
    switch (entity.type) {
        case 1:
            addSaveEvent(entity);
            break;
        default :
    }
};

/**
 * Add save event for player
 * @param {Object} player The player to add save event for.
 */
function addSaveEvent(player) {
    var app = pomelo.app;

    player.on('save', function () {
        app.get('sync').exec('playerSync.updatePlayer', player.id, player.getData(), player.id);
    });

    player.on('flush', function (cb) {
        pomelo.app.get('sync').flush('playerSync.logoff', player.id, {id: player.id}, player.id, cb);
    });

    player.on('activity.save', function (actData) {
        pomelo.app.get('sync').exec('playerActivitySync.save', actData.id, actData, player.id);
    });

    player.on('savePlayerRefresh',function(vData){
        app.get('sync').exec('playerRefreshSync.save', player.id, vData, player.id);
    });

}

exp.clearEvent = function (entity) {
    switch (entity.type) {
        case 1:
            entity.removeAllListeners();
            break;
        default :
    }
};