/**
 * Created by tony on 2015-10-03.
 */
var fs = require('fs'),
    path = require('path'),
	_ = require('underscore'),
	passwordEncoder = require('./../passwordEncoder');


var portUtil = require('./../portUtil'),
	configs = require('./../configs'), 
	portGroup = parseInt(configs.portGroup),
	cfgDir = './../../update-server/';

var exp = module.exports = {};

var configureHttp = exp.configureHttp = function(cfgFile, templateFile){
    var temp = JSON.parse(fs.readFileSync(templateFile, {encoding: 'utf8'}));
    temp.port = portUtil.getPort(temp.port, portGroup);
    fs.writeFileSync(cfgFile, JSON.stringify(temp));
	console.log('update-server Configuration completed');
};

var configure = exp.configure = function(){
    configureHttp(path.join(cfgDir, 'config.json'), path.join(cfgDir, 'config.json.bak'));
};

exp.getNeedOpenPorts = function(cfgDir){
    var conf = JSON.parse(fs.readFileSync(path.join(cfgDir, 'config.json'), {encoding: 'utf8'}));
    return [parseInt(conf.port)];
};

configure();