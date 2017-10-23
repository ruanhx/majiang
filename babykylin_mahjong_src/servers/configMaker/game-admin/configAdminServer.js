/**
 * Created by fisher on 2017-04-05.
 */
var fs = require('fs'),
    path = require('path'),
	_ = require('underscore'),
	passwordEncoder = require('./../passwordEncoder');

var portUtil = require('./../portUtil'),
	configs = require('./../configs'),
	portGroup = parseInt( configs.portGroup );	 
	
//配置文件路径
var cfgDir = './../../gmServer/config/';
var cfgDirSchema = './../../gmServer/config/schema/';

var exp = module.exports = {};

//===================================================================================================
//-----------------------------------执行方法---------------------------------------------------------
//===================================================================================================
var configure =exp.configure = function()
{ 
    configureMySql(path.join(cfgDir, 'mysql.json'),  path.join(cfgDir, 'mysql.json.bak'));
    configureCfg(path.join(cfgDir, 'config.json'),  path.join(cfgDir, 'config.json.bak'));        
	console.log('gmServer Configuration completed');

    shMysql( path.join(cfgDirSchema, 'createTable.sh') ,  path.join(cfgDirSchema, 'createTable.sh.bak') );
}; 

//===================================================================================================
//-----------------------------------配置文件---------------------------------------------------------
//===================================================================================================
var configureMySql = exp.configureMySql = function(cfgFile,templateFile){    
    var data = JSON.parse(fs.readFileSync(templateFile, {encoding: 'utf8'}));

    var _host = configs.ip;
    var _portGroup = configs.portGroup;
    var _user = configs.rootMysql.user;
    var _password = configs.rootMysql.password;


    var _GameAdmin = configs.gmServer;
    if(_GameAdmin.portGroup != -1){
        _portGroup = _GameAdmin.portGroup
    }

    if(_GameAdmin.host != '-'){
        _host = _GameAdmin.host
    }

    if(_GameAdmin.mysql.user != '-'){
        _user = _GameAdmin.mysql.user
    }

    if(_GameAdmin.mysql.password != '-'){
        _password = _GameAdmin.mysql.password
    }

    data.host = _host;
    data.port = parseInt( portUtil.getPort(data.port, _portGroup) );
    data.user = _user;
    data.password = passwordEncoder.encrypt(_password);
    data.database = _GameAdmin.databaseName+_portGroup;
    fs.writeFileSync(cfgFile, JSON.stringify(data));
};
  
var configureCfg = exp.configureCfg = function(cfgFile,templateFile){    
    var data = JSON.parse(fs.readFileSync(templateFile, {encoding: 'utf8'}));

    var _portGroup = portGroup;

    if( configs.gmServer.portGroup != -1 ){
        _portGroup = configs.gmServer.portGroup;
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

    if( configs.gmServer.mysql.user != '-' ){
        _user = configs.gmServer.mysql.user;
    }

    if( configs.gmServer.mysql.password != '-' ){
        _password = configs.gmServer.mysql.password;
    }

    if( configs.gmServer.portGroup != -1 ){
        _portGroup = configs.gmServer.portGroup;
    }

	temp = temp.replace(/user/g,_user);
	temp = temp.replace(/password/g,_password);
	temp = temp.replace(/databaseName/g,(configs.gmServer.databaseName+_portGroup));
    fs.writeFileSync(cfgFile, temp );
}

configure();