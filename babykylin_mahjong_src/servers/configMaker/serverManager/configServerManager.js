/**
 * Created by tony on 2015-10-03.
 */
var fs = require('fs'),
    path = require('path'),
	_ = require('underscore'),
	passwordEncoder = require('./../passwordEncoder');

var portUtil = require('./../portUtil'),
	configs = require('./../configs'),
	portGroup = parseInt( configs.serverManager.portGroup );	 
	
//配置文件路径
var cfgDir = './../../serverManager/config/';	
	
var exp = module.exports = {};

//===================================================================================================
//-----------------------------------配置相关json配置文件--------------------------------------------
//===================================================================================================
var configureHttp = exp.configureHttp = function(cfgFile, templateFile){
    var temp = JSON.parse(fs.readFileSync(templateFile, {encoding: 'utf8'}));

    var _portGroup = configs.portGroup;
    if( configs.serverManager.portGroup != -1 ){
        _portGroup = configs.serverManager.portGroup;
    }
    temp.port = portUtil.getPort(temp.port, _portGroup);
    fs.writeFileSync(cfgFile, JSON.stringify(temp));
};
 
var configureMysql = exp.configureMysql = function(cfgFile, templateFile){
    var temp = JSON.parse(fs.readFileSync(templateFile, {encoding: 'utf8'}));
    
    var _host = configs.ip;
    var _portGroup = configs.portGroup;
    var _user = configs.mysql.user;
    var _password = configs.mysql.password;

    if( configs.serverManager.host != '-' ){
        _host = configs.serverManager.host;
    }

    if( configs.serverManager.portGroup != -1 ){
        _portGroup = configs.serverManager.portGroup;
    }

    if( configs.serverManager.mysql.user != '-' ){
        _user = configs.serverManager.mysql.user;
    }

    if( configs.serverManager.mysql.password != '-' ){
        _password = configs.serverManager.mysql.password;
    }

    _.each(temp, function(modeConfig){        
        modeConfig.host = _host;
        modeConfig.port = parseInt( portUtil.getPort(modeConfig.port, _portGroup) );
        modeConfig.user = _user;
        modeConfig.password = passwordEncoder.encrypt( _password );
		modeConfig.database = configs.serverManager.databaseName+_portGroup;
    });
    fs.writeFileSync(cfgFile, JSON.stringify(temp));
};

var isOpenOrder = function( platformName )
{
	var b = false;
	_.each(configs.serverManager.orderPaltforms,function( platform ) {
		
		if( platform == platformName )
		{ 
			b = true;
		}
	});
	return b;
};

var configureOrder = exp.configureOrder = function(cfgFile, templateFile){
    var temp = JSON.parse(fs.readFileSync(templateFile, {encoding: 'utf8'}));
    var _portGroup = configs.portGroup;
    if( configs.serverManager.portGroup != -1 ){
        _portGroup = configs.serverManager.portGroup;
    }
    _.each(temp,function(data,platformName ) 
	{
		data.port = parseInt( portUtil.getPort(data.port, _portGroup) );
		if( isOpenOrder( platformName ) )
		{
			data.enable = true;
		}
	});
    fs.writeFileSync(cfgFile, JSON.stringify(temp));
};


//===================================================================================================
//-----------------------------------配置mysql语句--------------------------------------------
//===================================================================================================
var shMysql= exp.shMysql = function(cfgFile,templateFile)
{
	var temp = fs.readFileSync(templateFile, {encoding: 'utf8'}); 

    var _portGroup = configs.portGroup;
    var _user = configs.rootMysql.user;
    var _password = configs.rootMysql.password;

   
    if( configs.serverManager.portGroup != -1 ){
        _portGroup = configs.serverManager.portGroup;
    }

    if( configs.serverManager.mysql.user != '-' ){
        _user = configs.serverManager.mysql.user;
    }

    if( configs.serverManager.mysql.password != '-' ){
        _password = configs.serverManager.mysql.password;
    }


	temp = temp.replace(/user/g,_user);
	temp = temp.replace(/password/g,_password); 
	temp = temp.replace(/databaseName/g,configs.serverManager.databaseName + _portGroup);
    fs.writeFileSync(cfgFile, temp );
}


//===================================================================================================
//-----------------------------------获取端口--------------------------------------------------------
//===================================================================================================
function getMysqlPorts(cfgFile){
    var conf = JSON.parse(fs.readFileSync(cfgFile, {encoding: 'utf8'})),
        ports = [];
    _.each(conf, function(modeConf){
        ports.push(parseInt(modeConf.port));
    });
    return _.uniq(ports);
}

function getStateReportPort(cfgFile){
    var conf = JSON.parse(fs.readFileSync(cfgFile, {encoding: 'utf8'}));
    return parseInt(conf.port);
}

function getOrderPorts(cfgFile){
    var conf = JSON.parse(fs.readFileSync(cfgFile, {encoding: 'utf8'})),
        ports = [];
    _.each(conf, function(ifConf){
        ports.push(parseInt(ifConf.port));
    });
    return _.uniq(ports);
}


//===================================================================================================
//-----------------------------------执行方法--------------------------------------------------------
//===================================================================================================
var configure =exp.configure = function()
{
    configureHttp( path.join(cfgDir,  'config.json'),path.join(cfgDir, 'config.json.bak'));
    configureMysql(path.join(cfgDir, 'mysql.json'),  path.join(cfgDir, 'mysql.json.bak'));   
	configureOrder(path.join(cfgDir, 'order.json'),  path.join(cfgDir, 'order.json.bak')); 

	var cfgDirSchema = cfgDir+'schema/';
	shMysql( path.join(cfgDirSchema, 'createTable.sh') ,  path.join(cfgDirSchema, 'createTable.sh.bak') );
	
	console.log('serverManager Configuration completed');
};

configure();

//===================================================================================================
//-----------------------------------此服务器端口列表--------------------------------------------------------
//===================================================================================================
exp.getNeedOpenPorts = function(){
    var ports = [];
    ports.push(getStateReportPort(path.join(cfgDir, 'config.json')));
    ports = ports.concat(getMysqlPorts(path.join(cfgDir, 'mysql.json')));
    ports = ports.concat(getOrderPorts(path.join(cfgDir, 'order.json')));
    return _.uniq(ports);
};