/**
 * Created by kilua on 14-7-28.
 */

var _ = require('underscore');

var Buffer = require('./buffer');

var BufferManager = function(){
    this.bufs = {};
};

BufferManager.prototype.add = function(id, skillId, val, effects){
    var buf = this.bufs[id];
    if(buf){
        return buf;
    }
    return (this.bufs[id] = new Buffer(id, skillId, val, effects));
};

BufferManager.prototype.addBatch = function(bufs){
    var self = this;
    _.each(bufs, function(buf){
        self.add(buf.id, buf.skillId, buf.value);
    });
};

BufferManager.prototype.load = function(bufs){
    var self = this;
    bufs = bufs || [];
    self.bufs = {};
    _.each(bufs, function(buf){
        self.add(buf.id).load(buf);
    });
};

BufferManager.prototype.getData = function(){
    var bufs = [];
    _.each(this.bufs, function(buf){
        bufs.push(buf.getData());
    });
    return bufs;
};

module.exports = BufferManager;