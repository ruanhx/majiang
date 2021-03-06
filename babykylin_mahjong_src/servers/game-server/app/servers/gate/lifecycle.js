/**
 * Created by employee11 on 2015/12/3.
 */
var util = require('util');

var request = require('request');

var stateReport = require('../../../config/stateReport'),
    httpCfg = require('../../../config/http.json');

var exp = module.exports;

exp.beforeStartup = function (app, cb) {
    cb();
};

exp.afterStartup = function (app, cb) {
    cb();
};

exp.beforeShutdown = function (app, cb) {
    cb();
};

exp.afterStartAll = function (app) {
    console.info('afterStartAll all server start ok!registering...');
    app.set('prepared', true);

    startStateReport(app);
};

// 这里读的是gate server所在的服务器，如果是分布式部署，注意同步配置
// function getGMHttpPort(app) {
//     var gmHttpCfg = httpCfg[app.get('env')] || {};
//     gmHttpCfg = gmHttpCfg.gmhttp || {};
//     return gmHttpCfg.port || 3601;
// }
function getServerInfo(app) {
    var serverInfo = {}, curServer = app.getCurServer();
    serverInfo.name = stateReport.name;
    serverInfo.serverId = stateReport.serverId;
    serverInfo.ip = curServer.clientHost ? curServer.clientHost : curServer.host;
    serverInfo.port = curServer.clientPort;
    serverInfo.maxOnlineCnt = stateReport.maxClient;
    serverInfo.onlineCnt = app.get('onlineCnt');
    serverInfo.clientVersion = stateReport.clientVersion;
    serverInfo.clientMinVer = stateReport.clientMinVer;
    serverInfo.resVersion = stateReport.resVersion;
    serverInfo.packages = stateReport.packages;
    serverInfo.pkgUrl = stateReport.pkgUrl;
    serverInfo.alias = stateReport.alias;
    serverInfo.flag = stateReport.flag;
    serverInfo.tips = stateReport.tips;
    serverInfo.doMainName = stateReport.doMainName;
    serverInfo.isSkipGuide = stateReport.isSkipGuide;
    // serverInfo.gmPort = getGMHttpPort(app);
    return serverInfo;
}

function pushServerInfo(app) {
    var options = {
        uri: util.format('http://%s:%s/pushServerInfo', stateReport.host, stateReport.port),
        method: 'POST',
        json: getServerInfo(app)
    };

    request(options, function (err, res) {
        if (err) {
            console.log('pushServerInfo failed!err = %s', err.stack);
            return;
        }
        if (res.statusCode !== 200) {
            console.log('pushServerInfo failed!code = %s', res.statusCode);
        }

    });
}

function startStateReport(app) {
    pushServerInfo(app);

    setInterval(function () {
        pushServerInfo(app);
    }, 30000);
}
