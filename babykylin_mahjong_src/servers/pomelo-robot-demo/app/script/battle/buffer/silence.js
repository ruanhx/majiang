/**
 * Created by kilua on 14-9-2.
 */

var util = require('util');

var Buffer = require('./buffer');

var Silence = function(owner, user, skill, tick){
    Buffer.call(this, owner, user, skill, tick);
};

util.inherits(Silence, Buffer);

var pro = Silence.prototype;

module.exports = Silence;