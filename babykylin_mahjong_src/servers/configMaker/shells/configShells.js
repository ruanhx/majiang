/**
 * Created by tony on 2015-10-03.
 */
var fs = require('fs'),
    path = require('path'),
	configs = require('./../configs'),
	_ = require('underscore'),
	portGroup = configs.portGroup;

var serverManagerConfig = require('../../serverManager/config/config'),	
	authServerConfig =	  require('../../authServer/config/config'),	
	update_serverConfig = require('../../update-server/config'),
	game_serverMaster =   require('../../game-server/config/master'),	
	game_serverServers =   require('../../game-server/config/servers');
	
var exp = module.exports = {};

 
var backup_db=exp.backup_db=function()
{
	var cfgDir = '../../shells'
	var cfgFile = path.join(cfgDir, 'backup_db.sh'),
		templateFile = path.join(cfgDir, 'backup_db.sh.bak');
		
	var temp = fs.readFileSync(templateFile, {encoding: 'utf8'});	  
	
	temp = temp.replace(/user/g,configs.rootMysql.user);
	temp = temp.replace(/password/g,configs.rootMysql.password);
	
	temp = temp.replace(/GameLog/g,configs.game_server.database.GameLog+portGroup);	
	temp = temp.replace(/GameUser/g,configs.game_server.database.GameUser+portGroup);
	temp = temp.replace(/GameStat/g,configs.game_server.database.GameStat+portGroup); 
	temp = temp.replace(/ServerManager/g,configs.serverManager.databaseName+portGroup);
	
	fs.writeFileSync(cfgFile,temp);
};

var resume_db=exp.resume_db=function()
{
	var cfgDir = '../../shells'
	var cfgFile = path.join(cfgDir, 'resume_db.sh'),
		templateFile = path.join(cfgDir, 'resume_db.sh.bak');
		
	var temp = fs.readFileSync(templateFile, {encoding: 'utf8'});	  
	
	temp = temp.replace(/user/g,configs.rootMysql.user);
	temp = temp.replace(/password/g,configs.rootMysql.password);
	
	temp = temp.replace(/GameLog/g,configs.game_server.database.GameLog+portGroup);	
	temp = temp.replace(/GameUser/g,configs.game_server.database.GameUser+portGroup);
	temp = temp.replace(/GameStat/g,configs.game_server.database.GameStat+portGroup); 
	temp = temp.replace(/ServerManager/g,configs.serverManager.databaseName+portGroup);
	
	fs.writeFileSync(cfgFile,temp);
};

backup_db(); 
resume_db();

var windows_backup_db=exp.windows_backup_db=function()
{
	var cfgDir = '../../shells'
	var cfgFile = path.join(cfgDir, 'windows_backup_db.sh')	,
	templateFile = path.join(cfgDir, 'backup_db.sh'); 
	var temp = fs.readFileSync(templateFile, {encoding: 'utf8'});	  
	temp = temp.replace('/usr/bin/mysqldump','mysqldump'); 
	temp = temp.replace('/usr/bin/mysql','mysql'); 
	fs.writeFileSync(cfgFile,temp);
}
var windows_resume_db=exp.windows_resume_db=function()
{
	var cfgDir = '../../shells'
	var cfgFile = path.join(cfgDir, 'windows_resume_db.sh')	,
	templateFile = path.join(cfgDir, 'resume_db.sh'); 
	var temp = fs.readFileSync(templateFile, {encoding: 'utf8'});	  
	temp = temp.replace('/usr/bin/mysqldump','mysqldump'); 
	temp = temp.replace('/usr/bin/mysql','mysql'); 
	fs.writeFileSync(cfgFile,temp);
}

windows_backup_db();
windows_resume_db();

console.log("shells Configuration completed");