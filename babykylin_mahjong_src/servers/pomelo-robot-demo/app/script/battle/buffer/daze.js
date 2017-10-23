/**
 * Created by kilua on 14-8-14.
 */

var util = require('util');

var Buffer = require('./buffer');

var Daze = function(owner, user, skill, tick){
    Buffer.call(this, owner, user, skill, tick);
};

util.inherits(Daze, Buffer);

module.exports = Daze;