/**
 * Created by kilua on 2015-06-01.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var serverStatusDao = require('../../../dao/serverStatusDao'),
    common = require('../common'),
    utils = require('../../../util/utils'),
    activityManager = require('../../../domain/activity/activityManager');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

pro.getOperationFlags = function(cb){
    cb(null, this.app.get('opFlags'), utils.getServerDay(this.app));
};

pro.getAllFlags = function(cb){
    cb(null, this.app.get('opFlags'), this.app.get('shopFlags'), utils.getServerDay(this.app));
};


pro.setOperationFlags = function(opFlags, cb){
    var app = this.app;
    serverStatusDao.saveOpFlags(opFlags, function(err, success){
        if(err){
            cb(err, app.get('opFlags'));
        }else{
            if(success){
                common.syncOpFlags(app, opFlags);
                // 广播area服务器检查并添加或删除活动
                app.rpc.area.serverStatusRemote.updatePlayerActivitys.toServer('*', opFlags, utils.getServerDay(app), function(){});
                cb(null, app.get('opFlags'));
            }else{
                cb(null, app.get('opFlags'));
            }
        }
    });
};

pro.getShopFlags = function(cb){
    cb(null, this.app.get('shopFlags'), utils.getServerDay(this.app));
};

pro.setShopFlags = function(opFlags, cb){
    var app = this.app;
    serverStatusDao.saveShopFlags(app.get('dbclient'), opFlags, function(err, success){
        if(err){
            cb(err.message, app.get('shopFlags'));
        }else{
            if(success){
                common.syncShopFlags(app, opFlags);
                // 广播area服务器检查并添加或删除活动
                app.rpc.area.serverStatusRemote.setShopFlags.toServer('*', opFlags, utils.getServerDay(app), function () {
                    
                });
                cb(null, app.get('opFlags'), app.get('shopFlags'));
            }else{
                cb(null, app.get('opFlags'), app.get('shopFlags'));
            }
        }
    });
};

/*
*   查询当前服务器上进行的活动
* */
pro.getCurServerActivities = function(cb){
    cb(null, activityManager.getCurServerActivities(this.app.get('opFlags'), utils.getServerDay(this.app)), this.app.get('opFlags'));
};