/**
 * Created by kilua on 2015-10-09.
 */

var crypto = require('crypto');

var exp = module.exports = {};

exp.encrypt = function(plainText){
    var md5Encoder = crypto.createHash('md5');
    md5Encoder.update(plainText);
    return md5Encoder.digest('hex');
};

exp.isSuperGM = function(user){
    return (user.privilege.toUpperCase() === 'S');
};

var PRIVILEGES = {
    C: 1,
    B: 2,
    A: 3,
    S: 4
};
function cmpPrivilege(a, b){
    return PRIVILEGES[a.toUpperCase()] - PRIVILEGES[b.toUpperCase()];
}

exp.haveEnoughPrivilege = function(curPrivilege, expPrivilege){
    return cmpPrivilege(curPrivilege, expPrivilege) >= 0;
};