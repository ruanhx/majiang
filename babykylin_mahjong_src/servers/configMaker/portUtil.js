/**
 * Created by kilua on 2015-10-05.
 */

var _ = require('underscore');

var exp = module.exports = {};

exp.getPort = function(defPort, portGroup){
    if(_.isNumber(defPort)){
        return (defPort - 3000 + portGroup * 1000);
    }
    var portNum = parseInt(defPort.replace('++', ''));
    // 模版文件的端口是3000+
    return defPort.replace(portNum, (portNum - 3000 + portGroup * 1000));
};