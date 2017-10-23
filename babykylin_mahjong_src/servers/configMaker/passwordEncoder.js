/**
 * Created by kilua on 2015-10-03.
 */

module.exports.encrypt = function(plainText){
    return new Buffer(plainText).toString('base64');
};