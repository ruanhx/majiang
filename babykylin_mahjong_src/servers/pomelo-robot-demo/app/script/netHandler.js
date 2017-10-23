/**
 * Created by kilua on 14-4-30.
 */

var crc = require('crc');

var netHandler = module.exports = {};

//var pomelo;
//
//netHandler.setNetHandler = function(netHandler){
//    pomelo = netHandler;
//};

netHandler.queryEntry = function(pomelo, MAC, callback) {
    pomelo.request('gate.gateHandler.queryEntry', {uid: MAC}, function(data) {
		console.info("queryEntry data=%j",data);
        if(data.code !== 200) {
            console.log('Servers error!');
            return;
        }
        callback(data.host, data.port);
    });
};

netHandler.entry = function(pomelo, MAC, pwd, state, interface, userData, cb){
    /*pomelo.request('connector.entryHandler.entry', {MAC: MAC, password: pwd, interface:"default",state: state, interface: interface,
        userData: userData}, cb);*/

    pomelo.request('connector.entryHandler.entry', {MAC: MAC, password: pwd/*,interface:"default",state:state,userData:userData,clienDataMD5:'ca28dfd1aba0a72a2af3fd42ca847c88'*/}, function (data) {
        console.log('connector.entryHandler.entry data = %j',data);
        cb(data);
    });
};

/*
 *   创建角色
 * */
netHandler.createPlayer = function(pomelo, msg, cb){
    pomelo.request('connector.roleHandler.createPlayer', msg, cb);
};

netHandler.enterScene = function(pomelo, cb) {
    console.log('enter scene...');
    pomelo.request("area.playerHandler.enterScene", {}, cb);
};


/**
 * 卢家泉    通用发送数据包接口
 * @param pomelo
 * @param clientProtos
 * @param param
 * @param cb
 */
netHandler.sendRequest = function(pomelo,clientProtos,param,cb){
    var funcName = clientProtos.replace('.','_');
    if(!netHandler[funcName] || typeof netHandler[funcName] !== 'function'){
        netHandler[funcName] = function(pomelo,param,callback){
            console.info('%s param=%j',funcName,param);
            pomelo.request(clientProtos,param,callback);
        }
    }
    netHandler[funcName](pomelo,param,cb);
}