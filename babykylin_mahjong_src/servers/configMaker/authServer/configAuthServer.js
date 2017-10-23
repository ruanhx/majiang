/**
 * Created by tony on 2015-10-03.
 */
var fs = require('fs'),
    path = require('path'),
	_ = require('underscore'),
	passwordEncoder = require('./../passwordEncoder');



var portUtil = require('./../portUtil'),
	configs = require('./../configs'),
	portGroup = configs.portGroup;
	
var exp = module.exports = {};

var configure = function()
{
	//配置文件路径
	var cfgDir = './../../authServer/config/';	
    configurePort( path.join(cfgDir, 'config.json'), path.join(cfgDir, 'config.json.bak') );
    configureMySql(  path.join(cfgDir, 'mysql.json') ,  path.join(cfgDir, 'mysql.json.bak'));
	
	//创建数据库表
	var cfgDirSchema = cfgDir+'schema/';
	shMysql( path.join(cfgDirSchema, 'createTable.sh') ,  path.join(cfgDirSchema, 'createTable.sh.bak') );
	console.log('authServer Configuration completed');
};

var configurePort = exp.configurePort = function(cfgFile, templateFile){
    var temp = JSON.parse(fs.readFileSync(templateFile, {encoding: 'utf8'}));
    temp.port = portUtil.getPort(temp.port, portGroup);
    fs.writeFileSync(cfgFile, JSON.stringify(temp));
};

var configureMySql = exp.configureMySql = function(cfgFile,templateFile){
    var temp = JSON.parse(fs.readFileSync(templateFile, {encoding: 'utf8'}));
    _.each(temp, function(modeConfig){
        modeConfig.host = configs.ip;
        modeConfig.port =parseInt( portUtil.getPort(modeConfig.port, portGroup) );
        modeConfig.user = configs.mysql.user;
		modeConfig.password = configs.mysql.password;
        modeConfig.database = (configs.authServer.database+portGroup);
    });
    fs.writeFileSync(cfgFile, JSON.stringify(temp));
};

//修改创建数据库使用的账号和密码
var shMysql= exp.configureMySql = function(cfgFile,templateFile)
{
	var temp = fs.readFileSync(templateFile, {encoding: 'utf8'}); 
	temp = temp.replace(/user/g,configs.rootMysql.user);
	temp = temp.replace(/password/g,configs.rootMysql.password);
	temp = temp.replace(/databaseName/g,(configs.authServer.database+portGroup));  
    fs.writeFileSync(cfgFile, temp );
}

configure();