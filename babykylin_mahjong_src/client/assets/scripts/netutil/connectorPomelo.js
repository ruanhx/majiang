

module.exports = function (root) {
    return new ConnectorPomelo(root);
}

var ConnectorPomelo = function (root) {
    this.islogining = false; // 是否正在连接
    this.root = root;
    var Pomelo = require('pomelo-client');
    this.refuseTimes = 0;
    this.isPrepare = false; // 是否准备好，逻辑层网络工作
    this.id = '[connector]:' + root.getID();
    this.pomelo = new Pomelo(this.id, root);

    var self = this;

    this.pomelo.on('onKick', function (event) {
        self.islogining = false;
        cc.log(self.id, 'onKick');
        self.root.emit('onKick');
    });

    this.pomelo.on('disconnect', function () {
        cc.log(self.id, 'disconnect ' + self.refuseTimes);
    });
}

// isPrepare
ConnectorPomelo.prototype.isPrepared = function () {
    return this.isPrepare;
}

ConnectorPomelo.prototype.getPomelo = function () {
    return this.pomelo;
}

// 登出
ConnectorPomelo.prototype.logout = function () {
    this.islogining = false;
    try {
        this.pomelo.disconnect();
    } catch (e) {
        cc.log(e);
        throw e;
    }
}

ConnectorPomelo.prototype.onLoginFail = function () {
    var self = this;
    self.refuseTimes += 1;
    cc.log(self.id, 'refuse connect: ' + self.refuseTimes);
    // 3次无法连接到则弹框， 确认：login
    if (self.refuseTimes >= 3) {
        self.refuseTimes = 0;
        // 通知
        self.root.emit('gateRefuse');
        return;
    }
    else {
        setTimeout(function () {
            self.relogin();
        }, 3000);
    }
}

// 登陆接口
ConnectorPomelo.prototype.login = function (host, port, acc, pwd) {
    cc.log(this.id, 'login:', host, port, acc, pwd);
    this.islogining = true;
    // 清理
    this.host = host;
    this.port = port;
    this.acc = acc;
    this.pwd = pwd;
    this.relogin();
}

ConnectorPomelo.prototype.relogin = function () {
    if (!this.islogining) {
        cc.log(this.id, 'ConnectorPomelo not connect');
        return;
    }

    var self = this;
    try {
        this.pomelo.disconnect();
    } catch (e) {
        cc.log(e);
    }
    this.isPrepare = false;

    // 网络中断, 断线重连
    this.pomelo.once('io-error', function (event) {
        self.isPrepare = false;
        self.pomelo.off('close')
        self.onLoginFail();
    });

    // 新建
    this.pomelo.init({
        'host': this.host,
        'port': this.port,
        'user': {},
        'handshakeCallback': function () { }
    }, function () {

        // 网络中断, 断线重连
        self.pomelo.once('close', function (event) {
            self.isPrepare = false;
            self.pomelo.off('io-error')
            cc.log(self.id, 'once close, reconnect')
            self.relogin();
        });

        cc.log(self.id, '【connected】:' + self.host + ":" + self.port);
        // 验证登陆信息
        var route = 'connector.entryHandler.entry';
        self.pomelo.request(route, {
            'acc': self.acc,
            'pwd': self.pwd,
            'key': self.key,
        }, function (data) {
            cc.log(self.id, 'request 【connected】:' + self.host + ":" + self.port);
            if (self.islogining) {
                if (!data.code) {
                    self.refuseTimes = 0;
                    self.isPrepare = true;
                } else {
                    self.onLoginFail();
                }
                self.root.emit('auth', data);
            } else {
                self.onLoginFail();
            }
        }, function (error) {
            // var content = cc.Game.toolMgr.formatEnumString('ERROR_CODE_' + error);
            // cc.Game.toolMgr.showTip(content);
            self.onLoginFail();
        });
    });
}
