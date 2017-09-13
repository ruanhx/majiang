var emitter = require('emitter');
window.MyEmitter = emitter;

var protocol = require('pomelo-protocol');
window.Protocol = protocol;

var protobuf = require('pomelo-protobuf');
window.protobuf = protobuf;

module.exports = function (id, netRootOn) {
  var JS_WS_CLIENT_TYPE = 'js-websocket';
  var JS_WS_CLIENT_VERSION = '0.0.1';

  var Protocol = window.Protocol;
  var Package = Protocol.Package;
  var Message = Protocol.Message;
  var EventEmitter = window.MyEmitter;

  if (typeof (window) != "undefined" && typeof (sys) != 'undefined' && sys.localStorage) {
    window.localStorage = sys.localStorage;
  }

  var RES_OK = 200;
  var RES_FAIL = 500;
  var RES_OLD_CLIENT = 501;

  if (typeof Object.create !== 'function') {
    Object.create = function (o) {
      function F() {
      }

      F.prototype = o;
      return new F();
    };
  }

  var root = window;
  var pomelo = Object.create(EventEmitter.prototype); // object extend from object
  //   root.pomelo = pomelo;
  var socket = null;
  var reqId = 0;
  var callbacks = {};
  var handlers = {};
  //Map from request id to route
  var routeMap = {};

  var heartbeatInterval = 0;
  var heartbeatTimeout = 0;
  var nextHeartbeatTimeout = 0;
  var gapThreshold = 100;   // heartbeat gap threashold
  var heartbeatId = null;
  var heartbeatTimeoutId = null;

  var handshakeCallback = null;

  var decode = null;
  var encode = null;

  var useCrypto;

  var handshakeBuffer = {
    'sys': {
      type: JS_WS_CLIENT_TYPE,
      version: JS_WS_CLIENT_VERSION
    },
    'user': {}
  };

  var initCallback = null;
  var url = null;
  pomelo.init = function (params, cb) {
    initCallback = cb;
    var host = params.host;
    var port = params.port;

    url = 'ws://' + host;
    if (port) {
      url += ':' + port;
    }

    handshakeBuffer.user = params.user;
    handshakeCallback = params.handshakeCallback;
    initWebSocket(url, cb);
  };
  var copyArray = function (dest, doffset, src, soffset, length) {
    // Uint8Array
    for (var index = 0; index < length; index++) {
      dest[doffset++] = src[soffset++];
    }
  };

  var _buffer = null;
  var appendDataToBuffer = function (data) {
    if (!_buffer) {
      _buffer = new Uint8Array(data);
      return;
    }
    var temp = _buffer;
    _buffer = new Uint8Array(temp.length + data.length);
    copyArray(_buffer, 0, temp, 0, temp.length);
    copyArray(_buffer, temp.length, data, 0, data.length);
  };
  var takeProto = function () {
    if (!_buffer || _buffer.length < 4) {
      return null;
    }
    var offset = 0;
    var type = _buffer[offset++];
    var bodyLength = ((_buffer[offset++]) << 16 | (_buffer[offset++]) << 8 | _buffer[offset++]) >>> 0;
    var len = 4 + bodyLength;
    if (_buffer.length == len) {
      var ret = new Uint8Array(_buffer);
      _buffer = null;
      return ret;
    } else if (_buffer.length > len) {
      var ret = _buffer.subarray(0, len);
      _buffer = _buffer.subarray(len);
      return ret;
    } else {
      return null;
    }
  };
  var initWebSocket = function (url, cb) {
    var onopen = function (event) {
      //cc.log("onopen", new Date());
      var obj = Package.encode(Package.TYPE_HANDSHAKE, Protocol.strencode(JSON.stringify(handshakeBuffer)));
      send(obj);
    };
    var onmessage = function (event) {
      // cc.error("onmessage", new Date());
      appendDataToBuffer(event.data);
      var proto = null;
      while (proto = takeProto()) {
        processPackage(Package.decode(proto), cb);
      }
      // new package arrived, update the heartbeat timeout
      if (heartbeatTimeout) {
        nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
      }
    };
    var onerror = function (event) {
      pomelo.emit('io-error', event);
      cc.log(id, 'socket error: ', event);
    };
    var onclose = function (event) {
      pomelo.emit('close', event);
      pomelo.emit('disconnect', event);
      cc.log(id, 'socket close: ', event);
    };
    socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    socket.onopen = onopen;
    socket.onmessage = onmessage;
    socket.onerror = onerror;
    socket.onclose = onclose;
  };

  pomelo.isClosed = function () {
    return socket == null;
  }

  pomelo.disconnect = function () {
    if (socket) {
      if (socket.disconnect) socket.disconnect();
      if (socket.close) socket.close();
      cc.warn(id, '【disconnect】 from url:' + url);
      socket = null;
    }


    if (heartbeatId) {
      clearTimeout(heartbeatId);
      heartbeatId = null;
    }
    if (heartbeatTimeoutId) {
      clearTimeout(heartbeatTimeoutId);
      heartbeatTimeoutId = null;
    }
  };

  pomelo.request = function (route, msg, cb, errcb) {
    if (arguments.length === 2 && typeof msg === 'function') {
      cb = msg;
      msg = {};
    } else {
      msg = msg || {};
    }
    route = route || msg.route;
    if (!route) {
      return;
    }
    if (errcb) cb.errcb = errcb;

    reqId++;
    sendMessage(reqId, route, msg);

    callbacks[reqId] = cb;
    routeMap[reqId] = route;

    cc.log(id, "[request]:", reqId, route, "msg:", msg);
  };

  pomelo.notify = function (route, msg) {
    cc.log(id, "[notify]:", route, "msg:", msg);

    msg = msg || {};
    sendMessage(0, route, msg);
  };

  var sendMessage = function (reqId, route, msg) {
    var type = reqId ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;

    //compress message by protobuf
    var protos = !!pomelo.data.protos ? pomelo.data.protos.client : {};
    if (!!protos[route]) {
      var start = new Date().getTime();//起始时间
      msg = protobuf.encode(route, msg);
      var end = new Date().getTime();//接受时间
      //cc.log("encode", route, "cost", (end - start) + "ms");//返回函数执行需要时间
    } else {
      msg = Protocol.strencode(JSON.stringify(msg));
    }


    var compressRoute = 0;
    if (pomelo.dict && pomelo.dict[route]) {
      route = pomelo.dict[route];
      compressRoute = 1;
    }

    msg = Message.encode(reqId, type, compressRoute, route, msg);
    var packet = Package.encode(Package.TYPE_DATA, msg);
    send(packet);
  };

  var send = function (packet) {
    socket.send(packet.buffer);
  };


  var handler = {};

  var heartbeat = function (data) {
    if (!heartbeatInterval) {
      // no heartbeat
      return;
    }

    var obj = Package.encode(Package.TYPE_HEARTBEAT);
    if (heartbeatTimeoutId) {
      clearTimeout(heartbeatTimeoutId);
      heartbeatTimeoutId = null;
    }

    if (heartbeatId) {
      // already in a heartbeat interval
      return;
    }

    heartbeatId = setTimeout(function () {
      heartbeatId = null;
      send(obj);

      nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
      heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, heartbeatTimeout);
    }, heartbeatInterval);
  };

  var heartbeatTimeoutCb = function () {
    var gap = nextHeartbeatTimeout - Date.now();
    if (gap > gapThreshold) {
      heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, gap);
    } else {
      ('server heartbeat timeout');
      pomelo.emit('heartbeat timeout');
      pomelo.disconnect();
    }
  };

  var handshake = function (data) {
    data = JSON.parse(Protocol.strdecode(data));
    if (data.code === RES_OLD_CLIENT) {
      pomelo.emit('error', 'client version not fullfill');
      return;
    }

    if (data.code !== RES_OK) {
      pomelo.emit('error', 'handshake fail');
      return;
    }

    handshakeInit(data);

    var obj = Package.encode(Package.TYPE_HANDSHAKE_ACK);
    send(obj);
    if (initCallback) {
      initCallback(socket);
      initCallback = null;
    }
  };

  var onData = function (data) {
    //probuff decode
    var msg = Message.decode(data);

    if (msg.id > 0) {
      msg.route = routeMap[msg.id];
      delete routeMap[msg.id];
      if (!msg.route) {
        return;
      }
    }

    msg.body = deCompose(msg);

    processMessage(pomelo, msg);
  };

  var onKick = function (data) {
    data = JSON.parse(Protocol.strdecode(data));
    pomelo.emit('onKick', data);
  };

  handlers[Package.TYPE_HANDSHAKE] = handshake;
  handlers[Package.TYPE_HEARTBEAT] = heartbeat;
  handlers[Package.TYPE_DATA] = onData;
  handlers[Package.TYPE_KICK] = onKick;

  var processPackage = function (msgs) {
    if (Array.isArray(msgs)) {
      for (var i = 0; i < msgs.length; i++) {
        var msg = msgs[i];
        handlers[msg.type](msg.body);
      }
    } else {
      handlers[msgs.type](msgs.body);
    }
  };

  var processMessage = function (pomelo, msg) {
    var time = new Date();
    time = time.getSeconds() + ':' + time.getMilliseconds();
    cc.log(id, time + '[recv]:', msg.id ? msg.id : "", msg.route, msg.body)

    // request 的也会回调
    if (!!netRootOn) {
      if (msg.body.code !== undefined) {
        netRootOn.error(msg.route, msg.body);
      }
      else {
        if (msg.body.waitRequestId) {//统一回包处理

        } else if (msg.body.waitResponseId) {
          if (!msg.body.msg || msg.body.msg.code !== undefined) {
            netRootOn.error(msg.body.route, msg.body.msg);
          } else {
            netRootOn.emit(msg.body.route, msg.body.msg); // on的回调统一交给外
          }
          netRootOn.emit(msg.route, msg.body); // 统一回包on的回调
        } else {
          netRootOn.emit(msg.route, msg.body); // on的回调统一交给外层
        }
      }
    }
    else {
      if (msg.body.code !== undefined) {
        pomelo.error(msg.route, msg.body);
      }
      else {
        if (msg.body.waitRequestId) {//统一回包处理

        } else if (msg.body.waitResponseId) {
          if (!msg.body.msg || msg.body.msg.code !== undefined) {
            netRootOn.error(msg.body.route, msg.body.msg);
          } else {
            netRootOn.emit(msg.body.route, msg.body.msg); // on的回调统一交给外
          }
          pomelo.emit(msg.route, msg.body); // 统一回包on的回调
        } else {
          pomelo.emit(msg.route, msg.body); // on的回调统一交给外层
        }
      }
    }

    //if have a id then find the callback function with the request
    var cb = callbacks[msg.id];
    delete callbacks[msg.id];
    if (typeof cb !== 'function') {
      return;
    }
    if (msg.body.code !== undefined) {
      if (cb.errcb) {
        cb.errcb(msg.body.code, msg.body.msg);
      }
      else {
        /*
        var content = cc.Game.toolMgr.formatEnumString('COMMON_ERROR_CODE'
          , msg.body.code
          , cc.Game.toolMgr.formatEnumString('ERROR_CODE_' + msg.body.code));
          */
        var content = cc.Game.toolMgr.formatEnumString('ERROR_CODE_' + msg.body.code);
        cc.Game.toolMgr.showTip(content);
        //cc.Game.msgBoxMgr.confirm(title, content, function () {}, strOK);
        //cc.log('processMessage',content);
      }
    } else {
      cb(msg.body);
    }
    return;
  };

  var processMessageBatch = function (pomelo, msgs) {
    for (var i = 0, l = msgs.length; i < l; i++) {
      processMessage(pomelo, msgs[i]);
    }
  };

  var deCompose = function (msg) {

    cc.warn("deCompose start", msg.body.length, new Date());

    var protos = !!pomelo.data.protos ? pomelo.data.protos.server : {};
    var abbrs = pomelo.data.abbrs;
    var route = msg.route;

    //Decompose route from dict
    if (msg.compressRoute) {
      if (!abbrs[route]) {
        return {};
      }

      route = msg.route = abbrs[route];
    }
    if (!!protos[route]) {
      var start = new Date().getTime();//起始时间
      var ret = protobuf.decode(route, msg.body);
      var end = new Date().getTime();//接受时间
      //cc.log("decode", route, "cost", (end - start) + "ms");//返回函数执行需要时间
      // cc.error("deCompose end protos[route]", ret);
      return ret;
    } else {
      var decode = Protocol.strdecode(msg.body);
      // cc.error("deCompose end", msg.route, decode.length, decode);
      return JSON.parse(decode);
    }

    return msg;
  };

  var handshakeInit = function (data) {
    if (data.sys && data.sys.heartbeat) {
      heartbeatInterval = data.sys.heartbeat * 1000;   // heartbeat interval
      heartbeatTimeout = heartbeatInterval * 2;        // max heartbeat timeout
    } else {
      heartbeatInterval = 0;
      heartbeatTimeout = 0;
    }

    initData(data);

    if (typeof handshakeCallback === 'function') {
      handshakeCallback(data.user);
    }
  };

  //Initilize data used in pomelo client
  var initData = function (data) {
    if (!data || !data.sys) {
      return;
    }
    pomelo.data = pomelo.data || {};
    var dict = data.sys.dict;
    var protos = data.sys.protos;
    var parser = require('parser');
    var client = parser.parse(require('clientProtos'));
    var server = parser.parse(require('serverProtos'));
    cc.log("initData", client, server);
    //Init compress dict
    if (dict) {
      pomelo.data.dict = dict;
      pomelo.data.abbrs = {};

      for (var route in dict) {
        pomelo.data.abbrs[dict[route]] = route;
      }
    }

    //Init protobuf protos
    if (protos) {
      pomelo.data.protos = {
        server: server || {},
        client: client || {}
      };
      if (!!protobuf) {
        protobuf.init({ encoderProtos: client, decoderProtos: server });
      }
    }
  };

  //module.exports = pomelo;
  return pomelo;
}
//})();
