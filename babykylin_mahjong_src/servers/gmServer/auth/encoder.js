/**
 * Created by kilua on 2015-10-08.
 */

var crypto = require('crypto');

var exp = module.exports = {};

exp.encrypt = function(plainText, secret){
    var cipher = crypto.createCipher('aes192', secret),
        encText = cipher.update(plainText, 'utf8', 'hex');
    encText += cipher.final('hex');
    return encText;
};

exp.decrypt = function(encText, secret){
    var decipher = crypto.createCipher('aes192', secret),
        plainText = decipher.update(encText, 'hex', 'utf8');
    plainText += decipher.final('utf8');
    return plainText;
};