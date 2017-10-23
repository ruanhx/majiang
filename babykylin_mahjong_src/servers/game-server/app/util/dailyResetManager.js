/**
 * Created by kilua on 2014-12-02.
 */
var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var _ = require('underscore'),
    pomelo = require('pomelo'),
    logger = require('pomelo-logger').getLogger(__filename);
/*
 *   每日重置属性管理器
 *   @param {Object} opts {properties: {prop: {reset: ?, init: ?}, ...}, recordTimeProp: 'xxx', cronId: ?}
 *   1、需要在数据库Player表添加相应的字段,并记录时间字段默认设置为0,然后修改playerSync
 *   2、创建此对象,并调用load
 *   3、由cron调用 reset 接口
 *   4、上线时调用 processOfflineReset
 * */
var DailyResetManager = function (player, opts) {
    EventEmitter.call(this);

    this.player = player;
    this.properties = opts.properties || {};
    this.recordTimeProp = opts.recordTimeProp;
    this.cronId = opts.cronId;
};

util.inherits(DailyResetManager, EventEmitter);

var pro = DailyResetManager.prototype;
pro.clearDailyResetManager = function (prop, config) {
    delete this.player;
    delete this.properties;
    delete this.recordTimeProp;
    delete this.cronId;

    this.removeAllListeners();
};
/*
 *   添加需要重置的属性及配置
 * */
pro.addProp = function (prop, config) {
    this.properties[prop] = config;
};
/*
 *   需要保存的属性
 * */
pro.getDBProps = function () {
    var props = [];
    _.each(this.properties, function (val, propName) {
        props.push(propName);
    });
    props.push(this.recordTimeProp);
    return props;
};

/*
 *   加载数据
 * */
pro.load = function (opts) {
    var self = this,
        dbProps = this.getDBProps();
    dbProps.forEach(function (dbProp) {
        // 加载数据
        self.player[dbProp] = opts[dbProp];
        // 设定保存
        self.player.saveProperties.push(dbProp);
    });
};

/*
 *   需要下发的属性
 * */
pro.getClientProps = function () {
    var props = [];
    _.each(this.properties, function (val, propName) {
        props.push(propName);
    });
    return props;
};

/*
 *   获取下发给客户端的信息
 * */
pro.getClientInfo = function (info) {
    info = info || {};
    var self = this,
        clientProps = self.getClientProps();
    clientProps.forEach(function (clientProp) {
        info[clientProp] = self.player[clientProp];
    });
    return info;
};

function getValue(val) {
    if (typeof val === 'function') {
        return val();
    }
    return val;
}
/*
 *   初始化,由 processOfflineReset 调用
 * */
pro.init = function () {
    var self = this;
    _.each(self.properties, function (config, prop) {
        self.player.set(prop, getValue(config.init));
    });
    self.player.set(self.recordTimeProp, Date.now());
    // 触发初始化事件，外部可以监听此事件，进行额外处理
    this.emit('init');
};

/*
 *   在线重置,由 cron 调用
 * */
pro.reset = function () {
    var self = this;
    _.each(self.properties, function (config, prop) {
        self.player.set(prop, getValue(config.reset));
    });
    self.player.set(self.recordTimeProp, Date.now());
    // 触发重置事件，外部可以监听此事件，进行额外处理
    this.emit('reset');
};

/*
 *   上线时，检查并进行相应的初始化或重置
 * */
pro.processOfflineReset = function () {
    var trigger = pomelo.app.get('cronManager').getTriggerById(this.cronId),
        nextExecuteTime, now = Date.now();
    var dbTime = this.player[this.recordTimeProp];
    if (!dbTime) {
        this.init();
    } else if (!!trigger) {
        nextExecuteTime = trigger.nextExcuteTime(dbTime);
        logger.debug('processOfflineReset %s = %s', this.recordTimeProp, new Date(this.player[this.recordTimeProp]).toTimeString());
        if (nextExecuteTime < now) {
            this.reset();
        }
    }
};

module.exports = DailyResetManager;