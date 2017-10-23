/**
 * Created by tony on 2015-10-03.
 */
var fs = require('fs'),
    path = require('path'),
	_ = require('underscore');

var serverManagerConfig = require('../../serverManager/config/config'),	
	authServerConfig =	  require('../../authServer/config/config'),	
	update_serverConfig = require('../../update-server/config'),
	snExchange_serverConfig = require('../../snExchangeServer/config/config'),	
	game_serverMaster =   require('../../game-server/config/master'),	
	game_serverServers =   require('../../game-server/config/servers'),
	gm_serverConfig = require('../../gmServer/config/config'),
	
	configs = require('../configs');
	
var exp = module.exports = {};

var addPort=exp.addPort =function(port)
{
	return port + '\\|';
}
var server_sh=exp.server_sh=function()
{
	var cfgDir = '../../'
	var cfgFile = path.join(cfgDir, 'server.sh'),
		templateFile = path.join(cfgDir, 'server.sh.bak');
		
	var temp = fs.readFileSync(templateFile, {encoding: 'utf8'});	
	temp = temp.replace(/MasterPort/g,game_serverMaster.development.port);

	var serversPortGroup = '';
	_.each(game_serverServers,function(data,name){ 
		if( name == 'development')
		{
			_.each(data,function( serverItem,serverName ){				 
				var length = serverItem.length; 
				for(var i = 0 ; i < length ; ++i)
				{									
					if( !!serverItem[i].clientPort )
					{
						if(_.isNumber(serverItem[i].clientPort))
						{
							serversPortGroup+=addPort(serverItem[i].clientPort);	
						}
						else
						{
							var portNum =serverItem[i].clientPort.replace('++', '');
							serversPortGroup+=addPort(portNum);	
						}
					}
					if( !!serverItem[i].port )
					{
						if(_.isNumber(serverItem[i].port))
						{
							serversPortGroup+=addPort(serverItem[i].port);	
						}
						else
						{
							var portNum =serverItem[i].port.replace('++', '');
							serversPortGroup+=addPort(portNum);	
						} 
					} 
				}
			});
		}
	});
	var protGroup = addPort( serverManagerConfig.port )+
					addPort( update_serverConfig.port )+
					addPort( authServerConfig.port )+
					addPort( snExchange_serverConfig.port)+
					addPort( gm_serverConfig.port )+
					serversPortGroup+
					game_serverMaster.development.port;
	
	
	temp = temp.replace(/ports/g,protGroup);
	fs.writeFileSync(cfgFile, temp);
};

var update_sh=exp.update_sh=function()
{
	var cfgDir = '../../'
	var cfgFile = path.join(cfgDir, 'update.sh'),
		templateFile = path.join(cfgDir, 'update.sh.bak');
		
	var temp = fs.readFileSync(templateFile, {encoding: 'utf8'});	  
	fs.writeFileSync(cfgFile,temp);
};

//数据库备份配置
var auto_backDB=exp.auto_backDB = function(){
	var cfgDir = '../../shells'
	var cfgFile = path.join(cfgDir, 'auto_backup_db.sh'),
		templateFile = path.join(cfgDir, 'auto_backup_db.sh.bak');
		
	var temp = fs.readFileSync(templateFile, {encoding: 'utf8'});
	temp = temp.replace(/{group}/g,configs.portGroup);	
	temp = temp.replace(/{mysqlUser}/g,configs.mysql.user);	
	temp = temp.replace(/{mysqlPassword}/g,configs.mysql.password);	
	fs.writeFileSync(cfgFile,temp);
};

server_sh();
update_sh();
auto_backDB();
console.log("other Configuration completed");