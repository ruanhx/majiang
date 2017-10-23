/**
 * Created by kilua on 2015-06-02.
 */

var utils = require('../../../mylib/utils/lib/utils');

var exp = module.exports = {};


exp.syncRechargeFlags = function(app, opFlags){
    app.set('rechargeFlags', opFlags);
    app.rpc.area.syncRechargeFlags.syncRechargeFlags.toServer('*', opFlags, function(){});
};

exp.syncOpFlags = function(app, opFlags){
    app.set('opFlags', opFlags);
    app.rpc.area.serverStatusRemote.syncOpFlags.toServer('*', opFlags, function(){});
};

exp.syncShopFlags = function(app, opFlags){
    app.set('shopFlags', opFlags);
    app.rpc.area.serverStatusRemote.syncShopFlags.toServer('*', opFlags, function(){});
};

exp.syncExceptionPlayers = function(app, exceptionPlayerIds){
    app.rpc.area.exceptionPlayerRemote.syncExceptionPlayers.toServer('*', exceptionPlayerIds, function(){});
};

exp.syncRemoveExceptionPlayers = function(app, exceptionPlayerIds){
    app.rpc.area.exceptionPlayerRemote.syncRemoveExceptionPlayers.toServer('*', exceptionPlayerIds, function(){});
};