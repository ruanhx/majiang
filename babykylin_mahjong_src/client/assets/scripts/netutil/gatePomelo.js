

module.exports = function (root) {
    return new GatePomelo(root);
}

var GatePomelo = function (root) {
    this.islogining = false;
    this.root = root;
    var Pomelo = require('pomelo-client');
    this.refuseTimes = 0;
    this.queryData = null;
    this.id = '[gate]:' + root.getID();
    this.pomelo = new Pomelo(this.id);
}

GatePomelo.prototype.getPomelo = function () {
    return this.pomelo;
}

// 获取当前请求到的内容
GatePomelo.prototype.getQueryData = function () {
    return queryData;
}


// 登出
GatePomelo.prototype.logout = function () {
    this.islogining = false;
    try {
        this.pomelo.disconnect();
    } catch (e) {
        cc.log(e);
        throw e;
    }
}

// 登陆接口
GatePomelo.prototype.login = function (host, port, uid) {
    cc.log(this.id, 'login:', host, port);
    this.islogining = true;
    // 清理
    this.refuseTimes = 0;

    this.host = host;
    this.port = port;
    this.uid = uid;
    this.relogin();
}

GatePomelo.prototype.relogin = function () {
    if (!this.islogining) {
        cc.log(this.id, 'GatePomelo not connect');
        return;
    }

    var self = this;
    try {
        this.pomelo.disconnect();
    } catch (e) {
        cc.log(e);
    }
    this.queryData = null;

    // 网络拒绝连接
    this.pomelo.once('io-error', function (event) {
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
    });

    // 新建
    this.pomelo.init({
        'host': this.host,
        'port': this.port,
        'user': {},
        'handshakeCallback': function () { }
    }, function () {
        self.refuseTimes = 0;
        cc.log(self.id, '【connected】:' + self.host + ":" + self.port);
        // 请求connector信息
        var route = 'gate.gateHandler.queryEntry';
        self.pomelo.request(route, {
            'uid': self.uid
        }, function (data) {
            if (data.code) {
                // 通知
                self.root.emit('gateRefuse');
                return;
            }

            self.queryData = data;
            // 通知
            if (self.islogining)
                self.root.emit('connectInfo', data);
            // 断开gate
            try {
                self.pomelo.disconnect();
            } catch (e) {
                console.log(e);
            }
        }, function (error) {
            // var content = cc.Game.toolMgr.formatEnumString('ERROR_CODE_' + error);
            // cc.Game.toolMgr.showTip(content);
            self.root.emit('gateRefuse');
        });
    });
}

