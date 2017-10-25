/**
 * Created by kilua on 2016/6/30 0030.
 */

var async = require('async'),
    logger = require('pomelo-logger').getLogger(__filename);

var serverStatusDao = require('../../dao/serverStatusDao'),
    scoreRankingListDao = require('../../dao/scoreRankingListDao'),
    weekScoreRankingListDao = require('../../dao/weekScoreRankingListDao'),
    catchRankingListDao = require('../../dao/catchRankingListDao'),
    barrierRankListDao = require('../../dao/barrierRankListDao'),
    rankListDao = require('../../dao/rankListDao'),
    dataUtils = require('../../util/dataUtils'),
    dataApi = require('../../util/dataApi'),
    common = require('./common'),
    scoreRankingList = require('../../domain/world/scoreRankingList'),
    catchRankingList = require('../../domain/world/rankList/catchRankingList'),
    divisionRankingList = require('../../domain/world/rankList/divisionRankingList'),
    starRankingList = require('../../domain/world/rankList/starRankingList'),
    powerRankingList = require('../../domain/world/rankList/powerRankingList'),
    barrierRankingList = require('../../domain/world/rankList/barrierRankingList'),
    playerManager = require('../../domain/world/playerManager'),
    playerMiniData = require('../../domain/world/playerMiniData').getInstance(),
    rankListManager = require('../../domain/world/rankListManager').getInstance(),
    divisionMgr = require('../../domain/world/divisionMgr').get(),
    endlessReport = require('../../domain/world/endlessReport').get(),
    endlessMgr = require('../../domain/world/endlessMgr'),
    friendsMgr = require('../../domain/world/friendsMgr').get();


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

function loadScoreRankingList(cb) {
    scoreRankingListDao.load(function (err, dbRankingList) {
        if (err) {
            logger.error('loadScoreRankingList failed!');
            cb(err);
        } else {
            var waitTimer = setInterval(function () {
                if (!dataApi.isReady()) {
                    return;
                }
                clearInterval(waitTimer);

                scoreRankingList.getScoreRankingList().load(dbRankingList);
                cb();
            }, 1000);
        }
    });
}

function loadWeekScoreRankingList(cb) {
    weekScoreRankingListDao.load(function (err, dbRankingList) {
        if (err) {
            cb(err);
        } else {
            var waitTimer = setInterval(function () {
                if (!dataApi.isReady()) {
                    return;
                }
                clearInterval(waitTimer);

                scoreRankingList.getWeekScoreRankingList().load(dbRankingList);
                cb();
            }, 1000);
        }
    });
}

function loadCatchRankingList(cb) {
    catchRankingListDao.load(function (err, dbRankingList) {
        if (err) {
            cb(err);
        } else {
            var waitTimer = setInterval(function () {
                if (!dataApi.isReady()) {
                    return;
                }
                clearInterval(waitTimer);

                catchRankingList.getCatchRankingList().load(dbRankingList);
                cb();
            }, 1000);
        }
    });
}

function loadBarrierRankingList(cb) {
    barrierRankListDao.load(5,function (err, dbRankingList) {
        if (err) {
            cb(err);
        } else {
            var waitTimer = setInterval(function () {
                if (!dataApi.isReady()) {
                    return;
                }
                clearInterval(waitTimer);

                barrierRankingList.getModle().load(dbRankingList);
                cb();
            }, 1000);
        }
    });
}

function loadDivisionRankingList(cb) {
    rankListDao.load(3,function (err, dbRankingList) {
        if (err) {
            logger.error('loadDivisionRankingList failed!');
            cb(err);
        } else {
            var waitTimer = setInterval(function () {
                if (!dataApi.isReady()) {
                    return;
                }
                clearInterval(waitTimer);

                divisionRankingList.getModle().load(dbRankingList);
                cb();
            }, 1000);
        }
    });
};

function loadStarRankingList(cb) {
    rankListDao.load(7,function (err, dbRankingList) {
        if (err) {
            logger.error('loadDivisionRankingList failed!');
            cb(err);
        } else {
            var waitTimer = setInterval(function () {
                if (!dataApi.isReady()) {
                    return;
                }
                clearInterval(waitTimer);

                starRankingList.getModle().load(dbRankingList);
                cb();
            }, 1000);
        }
    });
};

function loadPowerRankingList(cb) {
    rankListDao.load(8,function (err, dbRankingList) {
        if (err) {
            logger.error('loadPowerRankingList failed!');
            cb(err);
        } else {
            var waitTimer = setInterval(function () {
                if (!dataApi.isReady()) {
                    return;
                }
                clearInterval(waitTimer);

                powerRankingList.getModle().load(dbRankingList);
                cb();
            }, 1000);
        }
    });
};
function playerMiniDataInit(cb){
    playerMiniData.init();
    cb();
}

function divisionMgrInit(cb){
    divisionMgr.init();
    cb();
}

function loadFriends(cb){
    friendsMgr.loadFriend();
    cb();
}

function loadGlobalEndless(cb){
    endlessMgr.getInstance().init();
    cb();
}

function  rankListMgrInit(cb) {
    rankListManager.init();
    cb();
}

exp.beforeStartup = function (app, cb) {
    cb();
    // async.parallel([
    //     function (callback) {
    //         loadServerStatus(app, callback);
    //     },
    //     loadScoreRankingList,
    //     loadWeekScoreRankingList,
    //     loadCatchRankingList,
    //     loadDivisionRankingList,
    //     loadBarrierRankingList,
    //     divisionMgrInit,
    //     loadFriends,
    //     loadGlobalEndless,
    //     loadStarRankingList,
    //     loadPowerRankingList,
    //     playerMiniDataInit
    // ], function (err) {
    //     cb(err);
    // });
};

exp.afterStartup = function (app, cb) {
    cb();
};

exp.beforeShutdown = function (app, cb) {
    playerManager.get().beforeShutdown(app,function () {
        cb();
        // scoreRankingListDao.save(scoreRankingList.getScoreRankingList().getData(), function (err) {
        //     weekScoreRankingListDao.save(scoreRankingList.getWeekScoreRankingList().getData(), function(){
        //         catchRankingListDao.save(catchRankingList.getCatchRankingList().getData(),function(){
        //             endlessReport.saveAll(function(){
        //                 cb();
        //             });
        //         });
        //     });
        // });
    });
};

exp.afterStartAll = function (app) {
    app.rpc.area.serverStatusRemote.syncStatus.toServer('*', app.get('serverStartTick'), app.get('opFlags'), function(){});
};
