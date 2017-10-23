/**
 * Created by kilua on 14-8-8.
 */


var Buffer = function(id, skillId, val, effects){
    this.id = id;
    this.skillId = skillId;
    this.value = val || 0;
    this.effects = effects || [];
};

Buffer.prototype.getData = function(){
    return {
        id: this.id,
        skillId: this.skillId,
        value: this.value,
        effects: this.effects
    };
};

module.exports = Buffer;