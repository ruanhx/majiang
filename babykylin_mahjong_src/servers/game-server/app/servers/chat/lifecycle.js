/**
 * Created by kilua on 2016/7/21 0021.
 */

var Consts = require('../../consts/consts');


var exp = module.exports = {};

exp.beforeStartup = function(app, cb){
    cb();
};

exp.afterStartup = function(app, cb){
    cb();
};

exp.beforeShutdown = function(app, cb){
    cb();
};

exp.afterStartAll = function(app){

};