/**
 * Created by tony on 2015-10-03.
 */
var fs = require('fs'),
    path = require('path'),
	_ = require('underscore'),
	passwordEncoder = require('./../passwordEncoder');

var portUtil = require('./../portUtil'),
	configs = require('./../configs'),
	portGroup = parseInt( configs.portGroup );	 
	
//配置文件路径
var cfgDir = './../../snExchangeServer/config/';	
var cfgDirSchema = './../../snExchangeServer/config/schema/';	

var exp = module.exports = {};

//===================================================================================================
//-----------------------------------执行方法---------------------------------------------------------
//===================================================================================================
var configure =exp.configure = function()
{ 
    configureMySql(path.join(cfgDir, 'mysql.json'),  path.join(cfgDir, 'mysql.json.bak'));
    configureCfg(path.join(cfgDir, 'config.json'),  path.join(cfgDir, 'config.json.bak'));        
	console.log('snExchangeServer Configuration completed');

    shMysql( path.join(cfgDirSchema, 'createTable.sh') ,  path.join(cfgDirSchema, 'createTable.sh.bak') );
}; 

//===================================================================================================
//-----------------------------------配置文件---------------------------------------------------------
//===================================================================================================
var configureMySql = exp.configureMySql = function(cfgFile,templateFile){    
    var data = JSON.parse(fs.readFileSync(templateFile, {encoding: 'utf8'}));

    var _host = configs.host;
    var _portGroup = configs.portGroup;
    var _user = configs.mysql.user;
    var _password = configs.mysql.password;


    var _SnExchangeServer = configs.SnExchangeServer;
    if(_SnExchangeServer.portGroup != -1){
        _portGroup = _SnExchangeServer.portGroup
    }

    if(_SnExchangeServer.host != '-'){
        _host = _SnExchangeServer.host
    }

    if(_SnExchangeServer.mysql.user != '-'){
        _user = _SnExchangeServer.mysql.user
    }

    if(_SnExchangeServer.mysql.password != '-'){
        _password = _SnExchangeServer.mysql.password
    }

    data.host = _host;
    data.port = parseInt( portUtil.getPort(data.port, _portGroup) );
    data.user = _user;
    data.password = passwordEncoder.encrypt(_password);
    data.database = _SnExchangeServer.databaseName+_portGroup;
    fs.writeFileSync(cfgFile, JSON.stringify(data));
};
  
var configureCfg = exp.configureCfg = function(cfgFile,templateFile){    
    var data = JSON.parse(fs.readFileSync(templateFile, {encoding: 'utf8'}));

    var _portGroup = portGroup;

    if( configs.SnExchangeServer.portGroup != -1 ){
        _portGroup = configs.SnExchangeServer.portGroup;
    }

    data.port = parseInt( portUtil.getPort(data.port, _portGroup) );
    fs.writeFileSync(cfgFile, JSON.stringify(data));
}


//===================================================================================================
//-----------------------------------数据库文件-------------------------------------------------------
//===================================================================================================
//修改创建数据库使用的账号和密码
var shMysql= exp.configureMySql = function(cfgFile,templateFile)
{
	var temp = fs.readFileSync(templateFile, {encoding: 'utf8'}); 

    var _user = configs.rootMysql.user;
    var _password = configs.rootMysql.password;
    var _portGroup = portGroup;

    if( configs.SnExchangeServer.mysql.user != '-' ){
        _user = configs.SnExchangeServer.mysql.user;
    }

    if( configs.SnExchangeServer.mysql.password != '-' ){
        _password = configs.SnExchangeServer.mysql.password;
    }

    if( configs.SnExchangeServer.portGroup != -1 ){
        _portGroup = configs.SnExchangeServer.portGroup;
    }

	temp = temp.replace(/user/g,_user);
	temp = temp.replace(/password/g,_password);
	temp = temp.replace(/databaseName/g,(configs.SnExchangeServer.databaseName+_portGroup));  
    fs.writeFileSync(cfgFile, temp );
}

configure();