/**
 * Created by rhx on 2017/9/18.
 */

var pomelo = require('pomelo');
var itemLogDao = require('../../dao/itemLogDao');

var itemLog = function () {

};
var pro  = itemLog.prototype;

pro.insterItemLog = function (dec, cb) {
    var res = {};
    itemLogDao.save(dec, cb);
    return cb(res);
};

pro.insterEquipLog = function () {
    
}

var _instance = null;

module.exports.getInstance = function () {
    if(!_instance){
        _instance = new itemLog();
    }
    return _instance;
};