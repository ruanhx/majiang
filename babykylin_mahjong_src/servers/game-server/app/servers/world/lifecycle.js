/**
 * Created by kilua on 2016/6/30 0030.
 */

var async = require('async'),
    logger = require('pomelo-logger').getLogger(__filename);

var serverStatusDao = require('../../dao/serverStatusDao'),
    dataUtils = require('../../util/dataUtils'),
    dataApi = require('../../util/dataApi'),
    common = require('./common');


var exp = module.exports;

function loadServerStatus(app, cb) {
    serverStatusDao.load(function (err, status) {
        if (!!status && !status.startTime) {
            // 初始化开服时间
            serverStatusDao.initStartTime(function (err, success) {
                if (success) {
                    app.set('serverStartTick', Date.now());

                    var tryTimer = setInterval(function () {
                        if (!dataApi.CommonParameter) {
                            return;
                        }
                        clearInterval(tryTimer);
                        var initOpFlags = dataUtils.getOptionList('Act_operationFlag', '#');
                        serverStatusDao.saveOpFlags(initOpFlags, function (err, success) {
                            if (success) {
                                app.set('opFlags', initOpFlags);
                            }
                            cb(err);
                        });
                    }, 1000);
                } else {
                    cb();
                }
            });
        } else {
            if (!err) {
                app.set('opFlags', status.opFlags);
                app.set('serverStartTick', status.startTime);
            }
            cb(err);
        }
    });
}

exp.beforeStartup = function (app, cb) {
    cb();

};

exp.afterStartup = function (app, cb) {
    cb();
};

exp.beforeShutdown = function (app, cb) {
    playerManager.get().beforeShutdown(app,function () {
        cb();

    });
};

exp.afterStartAll = function (app) {
    app.rpc.area.serverStatusRemote.syncStatus.toServer('*', app.get('serverStartTick'), app.get('opFlags'), function(){});
};
