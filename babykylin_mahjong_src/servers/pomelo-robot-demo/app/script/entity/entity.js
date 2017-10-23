/**
 * Created with JetBrains WebStorm.
 * User: kilua
 * Date: 13-10-15
 * Time: 下午1:49
 * To change this template use File | Settings | File Templates.
 */

var EventEmitter = require('events').EventEmitter,
    util = require('util');

var Entity = function(opts){
    EventEmitter.call(this);
    this.id = opts.id;
    this.entityId = opts.entityId;
    this.type = opts.type;
    this.areaId = opts.areaId;
};

util.inherits(Entity, EventEmitter);

var pro = Entity.prototype;

pro.clear = function(){
    this.entityId = 0;
    this.areaId = 0;
    this.type = 0;
};

pro.toJSON = function(){
    return {
        entityId: this.entityId,
        type: this.type,
        areaId: this.areaId
    };
};

module.exports = Entity;