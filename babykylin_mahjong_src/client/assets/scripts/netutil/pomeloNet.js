
var netID = 1;

module.exports = function () {
    var EventEmitter = require('emitter');
    var net = Object.create(EventEmitter.prototype); // object extend from object

    var id = netID++;
    net.getID = function () {
        return id;
    }

    var gate = require('gatePomelo')(net);
    var connector = require('connectorPomelo')(net);
    net.connector = connector;

    var ihost = null;
    var iport = null;
    var iacc = null;
    var ipwd = null;
    var icb = null;
    var reqList = []; // 遇到网络中断，先压入队列
    var maxReqErrorTime = 3000;
    var reconnectTimes = 0;
    // 登出
    net.logout = function (cb) {
        cc.log('[net]:', id, 'logout');
        var forceCallBack = false;
        try {
            gate.logout();
            connector.logout();
        } catch (e) {
            forceCallBack = true;
        }

        var timer = setInterval(function () {
            if (forceCallBack || gate.getPomelo().isClosed() && connector.getPomelo().isClosed()) {
                clearInterval(timer);
                if (!!cb) {
                    cb();
                }
            }
        }, 100);
    };

    net.logoutGate = function () {
        cc.log('[net]:', id, 'logoutGate');
        gate.logout();
    }

    net.logoutConnector = function () {
        cc.log('[net]:', id, 'logoutConnector');
        connector.logout();
    }

    net.isClosed = function () {
        cc.log('net.isClosed', connector.getPomelo().isClosed());
        return connector.getPomelo().isClosed();
    };

    net.isPreare = function () {
        return connector.isPrepared();
    };

    // 初始登陆
    net.login = function (host, port, acc, pwd, cb) {
        ihost = host;
        iport = port;
        iacc = acc;
        ipwd = pwd;
        icb = cb;
        this.logout(function () {
            relogin();
        })
    };

    var relogin = function () {
        cc.log('[net]:', id, 'relogin');
        gate.login(ihost, iport, iacc);
    };

    net.reloginConnector = function () {
        cc.log('[net]:', id, 'reloginConnector');
        connector.islogining = true;
        connector.relogin();
    }

    // gate 拒绝连接
    net.on('gateRefuse', function () {
        // 界面弹
        cc.log('net:', id, 'on:gateRefuse');
    });

    // gate 拿到connector信息
    net.on('connectInfo', function (info) {
        connector.login(info.host, info.port, iacc, ipwd);
    });

    // connector 拒绝连接
    net.on('connectorRefuse', function () {
        cc.log('net:', id, 'on:connectorRefuse');
    });

    // on Auth
    net.on('auth', function (ret) {
        // 如果验证成功，不成功逻辑在外层绑定处理
        if (!ret.code) {
            // 先补发
            for (var i = 0; i < reqList.length; i++) {
                var item = reqList[i];
                if (item['type'] == 'request') {
                    cc.Game.net.request(item.route, item.msg, item.cb);
                }
                else if (item['type'] == 'notify') {
                    connector.getPomelo().notify(item.route, item.msg);
                }
            }

            reqList.length = [];

            // 处理回掉
            if (icb) {
                icb(ret);
            }
        }
    });

    var waitCbMap = {};
    var waitErrMap = {};

    //========== 封装接口 ==========
    net.request = function (route, msg, cb, err) {
        if (!cc.Game.net.connector.isPrepared()) {
            if (!net.lastCheckConnectorTime) {
                net.lastCheckConnectorTime = new Date();
                setTimeout(function () {
                    if (net.lastCheckConnectorTime) {
                        net.lastCheckConnectorTime = null;
                        cc.log('reconnectTimes', reconnectTimes);
                        if (!cc.Game.net.connector.isPrepared()) {
                            if (++reconnectTimes > 2) {
                                reconnectTimes = 0;
                                cc.Game.net.emit('gateRefuse');
                            } else {
                                cc.Game.net.reloginConnector();
                            }
                        }

                    }
                }, maxReqErrorTime);
            }
            cc.Game.toolMgr.showTip(cc.Game.toolMgr.formatEnumString('CONNECT_IS_NOT_PREPARE'));
            reqList.push({ 'type': 'request', 'route': route, 'msg': msg, 'cb': cb });
            return;
        }
        reconnectTimes = 0;
        net.lastCheckConnectorTime = null;
        var gen = function (data) {
            if (data.waitRequestId) {
                waitCbMap[data.waitRequestId] = cb;
                waitErrMap[data.waitRequestId] = err;
                return;
            } else {
                if (cb)
                    cb(data);
            }
        }
        connector.getPomelo().request(route, msg, gen, err);
    };

    net.on('commonDelayResponse', function (data) {
        if (!data.waitResponseId) {
            return;
        }
        var cb = waitCbMap[data.waitResponseId];
        var errCb = waitErrMap[data.waitResponseId];
        delete waitCbMap[data.waitResponseId];
        delete waitErrMap[data.waitResponseId];
        if (data.msg.code !== undefined) {
            if (!!errCb) {
                errCb(data.msg.code, data.msg.msg);
            } else {
                var title = cc.Game.toolMgr.formatEnumString('COMMON_TITLE');
                var content = cc.Game.toolMgr.formatEnumString('ERROR_CODE_' + data.msg.code);
                var strOK = cc.Game.toolMgr.formatEnumString('COMMON_OK');
                cc.Game.toolMgr.showTip(content);
            };
        } else {
            if (cb) cb(data.msg);
        }
    });

    net.notify = function (route, msg) {
        if (!connector.isPrepared()) {
            cc.Game.toolMgr.showTip(cc.Game.toolMgr.formatEnumString('CONNECT_IS_NOT_PREPARE'));
            reqList.push({ 'type': 'notify', 'route': route, 'msg': msg });
            return;
        }
        connector.getPomelo().notify(route, msg);
    };

    // net.on = function(route, cb) {
    //     // connector.getPomelo().on(route, cb);

    //     // 全局统一注册on的回调
    //     this.on(route, cb);
    // };

    return net;
}