var pomelo = require('pomelo'),
	path = require('path'),
    mkdirp = require('mkdirp'),
    _ = require('underscore');

var sync = require('./plugins/pomelo-sync-plugin-ex'),
    routeUtil = require('./app/util/routeUtil'),
    area = require('./app/domain/area/area'),
    cronTriggerManager = require('./app/util/cronTriggerManager'),
    stateReportConfig = require('./config/stateReport'),
    roomMgr = require('./app/domain/area/roomMgr'),
    unregisterFilter = require('./app/servers/area/filter/unregisterFilter'),
    world = require('./app/domain/world/world'),
    stateReport = require('./app/util/stateReport');
	expressProxy = require('./app/components/express'),
    dataApi = require('./app/util/dataApi');

function getMysqlCfgPath(app) {
    var mysqlCfgPath = app.getBase() + '/config/mysql.json';
    if (require('fs').existsSync(mysqlCfgPath)) {
        return mysqlCfgPath;
    }
    return app.getBase() + '/shared/config/mysql.json';
}

function decrypt(cyphertext) {
    return new Buffer(cyphertext, 'base64').toString();
}

function decryptDBConfig(mysqlConfig) {
    mysqlConfig.password = decrypt(mysqlConfig.password);
    return mysqlConfig;
}

function configUserDB(app) {
    var dbClient = require('./app/dao/mysql/mysql').init(decryptDBConfig(app.get('mysql').GameUser));
    app.set('dbclient', dbClient);
    if (app.serverType === 'area') {
        // area server启用同步模块,默认同步间隔1分钟
        app.use(require('./plugins/pomelo-sync-plugin-ex'), {
            sync: {
                path: __dirname + '/app/dao/mapping',
                dbclient: dbClient
            }
        });
    }
}

function configStatDB(app) {
    if (_.contains(['area', 'gate'], app.serverType)) {
        app.set('statClient', require('./app/dao/mysql/mysql').init(decryptDBConfig(app.get('mysql').GameStat)));
    }
}

function configLogDB(app) {
    if (_.contains(['area'], app.serverType)) {
        app.set('logclient', require('./app/dao/mysql/mysql').init(decryptDBConfig(app.get('mysql').GameLog)))
    }
}

function configMysql(app) {
    app.loadConfig('mysql', app.getBase() + '/config/mysql.json');
    configUserDB(app);
    // // 统计库配置
    // configStatDB(app);
    // configLogDB(app);
}

function startApp() {
    /**
     * Init app for client.
     */
    var app = pomelo.createApp();
    app.set('name', 'gameserver');

    app.configure('production|development', function () {
        // remote configures
        app.set('remoteConfig', {
            cacheMsg: true,
            interval: 30
        });

        app.route('connector', routeUtil.connector);

        app.filter(pomelo.filters.timeout());

    });

    app.configure('development', function(){
        // 这个开起来才有 con-log*.log
        app.filter(pomelo.filters.time());
    });
    app.configure('production|development', 'area|connector|gate|world', function () {
        configMysql(app);
    });

// app configuration
    app.configure('production|development', 'connector', function () {
        app.set('connectorConfig', {
                connector: pomelo.connectors.hybridconnector,
                heartbeat: 3*60*1000,//毫秒
                //timeout:60*10,//秒
                disconnectOnTimeout: true,
                useDict: true,
                useProtobuf: true,
            });
    });

//app area
    app.configure('production|development', 'area', function () {
        console.log("####3");
        app.before(unregisterFilter());
        app.filter(pomelo.filters.serial());
        var areas = app.get('servers').area;
        var areaIdMap = {};
        var areaId = app.get('curServer').area;
        for (var id in areas) {
            areaIdMap[areas[id].area] = areas[id].id;
        }
        app.set('areaIdMap', areaIdMap);
        // route configures
        app.route('area', routeUtil.area);

        area.init({id: areaId});

        roomMgr.getInstance().roomInit();
        setInterval(function () {
            var mem = process.memoryUsage();
            var format = function (bytes) {
                return (bytes / 1024 /1024).toFixed(2) + 'MB';
            }
            console.log('process: heapTotal ' + format(mem.heapTotal) + ' heapUsed ' + format(mem.heapUsed) + ' rss ' + format(mem.rss));
        },180000);

    });

    app.configure('production|development', 'world', function () {

    });

    app.configure('production|development', 'gate', function () {
        app.set('connectorConfig',
            {
                connector: pomelo.connectors.hybridconnector//,
                //useProtobuf : true
            });
    });

    // app.configure('production|development', function(){
    //     if(app.serverType === 'gmhttp' || app.serverType === 'order') {
    //
    //         configMysql(app);
    //         var configKey = 'httpConfig';
    //         app.loadConfig(configKey, path.join(app.getBase(), 'config/http.json'));
    //         app.load('expressProxy', expressProxy(app, app.get(configKey)[app.getServerId()]));
    //     }
    // });
	
    var onlineCnt = 0;
    app.set('onlineCnt', onlineCnt);
    app.set('serverID',stateReportConfig.serverId);
// start app
    app.start(function (err) {
        if (err) {
            return;
        }
        app.configure('production|development', function () {
            var cronManager = cronTriggerManager.int(app);
            app.set('cronManager', cronManager);
        });


    });
}

process.on('uncaughtException', function (err) {
    console.error(' Caught exception: ' + err.stack);
});
/*
 *   Ensure path './logs' exists.
 * */
var logPath = './logs';
// Recursively mkdir
mkdirp(logPath, function (err) {
    if (err) {
        console.error('make dir %s failed!err = %s', logPath, err.stack);
    } else {
        // If the specified directory exists or create success.
        var timer = setInterval(function () {
            if (dataApi.isReady()) {
                clearInterval(timer);
                console.info('load all design data ok!start app...');
                startApp();
            }
        }, 1000);
    }
});