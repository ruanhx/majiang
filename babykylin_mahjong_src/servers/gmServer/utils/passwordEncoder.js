/**
 * Created by kilua on 2015-10-03.
 */

var exp = module.exports = {};

exp.encrypt = function(plainText){
    return new Buffer(plainText).toString('base64');
};

exp.decrypt = function(cyphertext){
    return new Buffer(cyphertext, 'base64').toString();
};