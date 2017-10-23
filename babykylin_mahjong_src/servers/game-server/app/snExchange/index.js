/**
 * Created by kilua on 2015-06-11.
 */

var exp = module.exports = {};

// load all third-party sn exchange modules
var fs = require('fs'),
    path = require('path'),
    util = require('util');

var _ = require('underscore');

var utils = require('../../mylib/utils/lib/utils');

exp.modules = {};
exp.enabled = {};

// 读取./lib/modules下所有js文件
var files = fs.readdirSync(__dirname + '/lib/modules').filter( function (file) {
    return (path.extname(file) === '.js' || path.extname(file) === '.jse');
});

// 获取所有模块名
var includeModules = files.map( function (fname) {
    return path.basename(fname, path.extname(fname));
});

console.log('includeModules = %j', includeModules);

// 将所有模块添加到导出表
for (var i = 0, l = includeModules.length; i < l; i++) {
    var name = includeModules[i];

    Object.defineProperty(exp, name, {
        get: (function (name) {
            return function () {
                var mod = this.modules[name] || (this.modules[name] = require('./lib/modules/' + name));
                this.enabled[name] = mod;
                return mod;
            }
        })(name)
    });
}

var config = require('../../config/sn.json');

var CODE = exp.CODE = {
    OK: 200,
    FAIL: 500
};
/*
*   统一回应码
* */
function convertCode(thirdPartyName, code, cb){
    var curConfig = config[thirdPartyName];
    if(!curConfig){
        return cb(new Error(util.format('no config for %s', thirdPartyName)));
    }
    if(code === curConfig.code.ok){
        return cb(null, CODE.OK);
    }
    return cb(null, CODE.FAIL);
}

var TYPE = exp.TYPE = {
    WORLD: 1,
    PLAYER: 2
};
/*
*   统一类型
* */
function convertType(thirdPartyName, type, cb){
    var curConfig = config[thirdPartyName];
    if(!curConfig){
        return cb(new Error(util.format('no config for %s', thirdPartyName)));
    }
    if(type === curConfig.type.player){
        return cb(null, TYPE.PLAYER);
    }
    return cb(null, TYPE.WORLD);
}

exp.query = function(thirdPartyName, sn, cb){
    // 判断是否有对应第三方模块
    //var curModule = this.modules[thirdPartyName];
    // 由于访问时才加载，这里通过modules访问不到
    if(_.indexOf(includeModules, thirdPartyName) === -1){
    //if(!curModule){
        return cb(util.format('no such module %s', thirdPartyName));
    }
    //// 判断模块是否启用
    //if(!this.enabled[thirdPartyName]){
    //    return cb(new Error(util.format('module %s disabled', thirdPartyName)));
    //}
    // 调用模块接口
    exp[thirdPartyName].query(sn, function(err, code, type, awardId){
        if(err){
            //console.error('query error %s, sn = %s', err.stack, thirdPartyName, sn);
            return utils.invokeCallback(cb, err.message);
        }
        convertCode(thirdPartyName, code, function(ex, resultCode){
            if(ex){
                console.error('convertCode error %s, thirdPartyName = %s, code = %s', ex.stack, thirdPartyName, code);
                return utils.invokeCallback(cb, ex.message);
            }
            convertType(thirdPartyName, type, function(error, resultType){
                if(error){
                    console.error('convertType error %s, thirdPartyName = %s, type = %s', error.stack, thirdPartyName, type);
                    return utils.invokeCallback(cb, error.message);
                }
                return utils.invokeCallback(cb, null, resultCode, resultType, awardId);
            });
        });
    });
};