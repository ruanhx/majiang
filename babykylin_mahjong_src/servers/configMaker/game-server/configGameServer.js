/**
 * Created by tony on 2015-10-03.
 */
var fs = require('fs'),
    path = require('path'),
	_ = require('underscore'),
	passwordEncoder = require('./../passwordEncoder');



var portUtil = require('./../portUtil'),
	configs = require('./../configs'),
	cfgDir = './../../game-server/config/',
	mysqlDir = './../../game-server/MySQL/MySqlBat/', 
	portGroup = configs.portGroup;
	
	
var exp = module.exports = {};

var configure = function()
{	
    configureHttp( path.join(cfgDir, 'http.json'), path.join(cfgDir, 'http.json.bak') );
    configureMySql(  path.join(cfgDir, 'mysql.json') ,  path.join(cfgDir, 'mysql.json.bak'));
	configureAuth(  path.join(cfgDir, 'auth.json') ,  path.join(cfgDir, 'auth.json.bak'));
	configureServers(  path.join(cfgDir, 'servers.json') ,  path.join(cfgDir, 'servers.json.bak'));
	configureStateReport(  path.join(cfgDir, 'stateReport.json') ,  path.join(cfgDir, 'stateReport.json.bak') ,  path.join('./../ClientStateReport', 'stateReport.json')  );
	configureMaster(  path.join(cfgDir, 'master.json') ,  path.join(cfgDir, 'master.json.bak')); 
	//configureSn(  path.join(cfgDir, 'sn.json') ,  path.join(cfgDir, 'sn.json.bak'));

	//创建数据库表 
	shMysql( path.join(mysqlDir, 'createUser.sh') ,  path.join(mysqlDir, 'createUser.sh.bak') );
	shMysql( path.join(mysqlDir, 'GameLog.sh') ,  path.join(mysqlDir, 'GameLog.sh.bak') ,configs.game_server.database.GameLog);
	shMysql( path.join(mysqlDir, 'GameUser-Source.sh') ,  path.join(mysqlDir, 'GameUser-Source.sh.bak'),configs.game_server.database.GameUser );
	shMysql( path.join(mysqlDir, 'statistics.sh') ,  path.join(mysqlDir, 'statistics.sh.bak') ,configs.game_server.database.GameStat);
	console.log('game-server Configuration completed');
};

//登录验证服是否开放
var isOpenPlatform = function( platformName )
{
	var b = false;
	_.each(configs.game_server.authPaltforms,function( platform ) {
		
		if( platform == platformName )
		{ 
			b = true;
		}
	});
	return b;
};

//===================================================================================================
//-----------------------------------配置mysql语句--------------------------------------------
//===================================================================================================
var shMysql= exp.shMysql = function(cfgFile,templateFile,databaseName )
{
	var temp = fs.readFileSync(templateFile, {encoding: 'utf8'}); 
	temp = temp.replace(/user/g,configs.rootMysql.user);
	temp = temp.replace(/password/g,configs.rootMysql.password);
	if(!!databaseName)
	{ 
		temp = temp.replace(/databaseName/g,databaseName + portGroup);	
	}
    fs.writeFileSync(cfgFile, temp );
} 

var configureAuth = exp.configureAuth = function(cfgFile, templateFile){
    var temp = JSON.parse(fs.readFileSync(templateFile, {encoding: 'utf8'}));
     _.each(temp,function(data,platformName ) 
	{ 
		if( platformName== 'default')
		{ 
			var authConfigPath = './../../authServer/config/config.json.bak';
			var temp = JSON.parse(fs.readFileSync(authConfigPath, {encoding: 'utf8'}));
			data.url = 'http://'+configs.ip+':'+portUtil.getPort(temp.port, portGroup)+'/authCheck'; 
		}
		if( isOpenPlatform( platformName ) )
		{
			data.enable = true;
		}
	});
    fs.writeFileSync(cfgFile, JSON.stringify(temp));
};

var configureServers = exp.configureServers = function(cfgFile, templateFile){
    var temp = JSON.parse(fs.readFileSync(templateFile, {encoding: 'utf8'}));
	
	var host = '127.0.0.1';
     _.each(temp,function(modeConfig,platformName ) 
	{ 
		_.each(modeConfig , function(data,indexName ) { 
			for( var i = 0 ; i < data.length; ++i)
			{			
				if( !!data[i].clientPort )
				{		
					data[i].clientPort = portUtil.getPort(data[i].clientPort, portGroup) ;
				}
				if( !!data[i].port )
				{
					data[i].port = portUtil.getPort(data[i].port, portGroup) ;
				} 
				if( !!data[i].clientHost )
				{						
					data[i].clientHost = configs.host;
				}
				if( !!data[i].host )
				{						
					data[i].host =  host;
				} 
			}	
		});  
		 
	});
    fs.writeFileSync(cfgFile, JSON.stringify(temp));
};

var configureStateReport = exp.configureStateReport = function(cfgFile, templateFile,clientFile ){
	var temp = JSON.parse(fs.readFileSync(templateFile, {encoding: 'utf8'}));
	temp.name = configs.game_server.stateReport.serverName;
	temp.alias = configs.game_server.stateReport.alias;
	temp.port = parseInt( portUtil.getPort(temp.port, portGroup) );
	temp.host = configs.host;
	var update_server_port = require('./../../update-server/config').port;
	temp.pkgUrl = configs.host+':'+update_server_port+'/';
	if(!!clientFile)
	{
		fs.exists(clientFile,function(exists){
			if(exists)
			{
				var tempData  = fs.readFileSync(clientFile, {encoding: 'utf8'});
				if(!!tempData)
				{
					var newStateReport = JSON.parse(tempData);
					temp.clientVersion = newStateReport.clientVersion;
					temp.resVersion = newStateReport.resVersion;
					if(newStateReport.name!=null){
						temp.name = newStateReport.name;
					}					
					console.log("ClientStateReport/stateReport.json clientVersion = %s , resVersion = %s ，planTableSvnVersion = %s , serverName = %s ",temp.clientVersion,temp.resVersion,newStateReport.planTableSvnVersion,newStateReport.name);		
					fs.writeFileSync(cfgFile, JSON.stringify(temp));					
				}		
			}
			else
			{
				console.log("not found ClientStateReport/stateReport.json");
			}
		});
		
	}	
	
};

var configureMaster = exp.configureMaster = function(cfgFile, templateFile){
	var temp = JSON.parse(fs.readFileSync(templateFile, {encoding: 'utf8'}));
	_.each(temp, function(modeConfig){ 
		modeConfig.port = parseInt( portUtil.getPort(modeConfig.port, portGroup) );
    });
	fs.writeFileSync(cfgFile, JSON.stringify(temp));
};

var configureHttp = exp.configureHttp = function(cfgFile, templateFile){
      var temp = JSON.parse(fs.readFileSync(templateFile, {encoding: 'utf8'}));
    _.each(temp, function(modeConfig){ 
		_.each(modeConfig , function(data) { 
			 data.port = parseInt( portUtil.getPort(data.port, portGroup) );
		});  
    });
    fs.writeFileSync(cfgFile, JSON.stringify(temp));
};

var configureMySql = exp.configureMySql = function(cfgFile,templateFile){
    var temp = JSON.parse(fs.readFileSync(templateFile, {encoding: 'utf8'}));
    _.each(temp, function(modeConfig){
		_.each(modeConfig , function(data) { 
			data.host = configs.ip;
			data.port = parseInt( portUtil.getPort(data.port, portGroup) );
			data.user = configs.mysql.user;
			data.password = passwordEncoder.encrypt(configs.mysql.password);
			data.database = configs.game_server.database[data.database]+portGroup;
		});  
    });
    fs.writeFileSync(cfgFile, JSON.stringify(temp));
};


var configureSn = exp.configureSn = function(cfgFile, templateFile){
    var temp = JSON.parse(fs.readFileSync(templateFile, {encoding: 'utf8'}));

	var _path = path.join('./../../snExchangeServer/config/', 'config.json.bak'); 
	var sn_json_bak = JSON.parse(fs.readFileSync(_path, {encoding: 'utf8'})); 
	var port = parseInt( portUtil.getPort(sn_json_bak.port, portGroup) );
	
	var stringTemp =  JSON.stringify(temp);
	stringTemp = stringTemp.replace(/=port=/g,port);
	stringTemp = stringTemp.replace(/=host=/g,configs.ip);	
    fs.writeFileSync(cfgFile, stringTemp );
};

configure();