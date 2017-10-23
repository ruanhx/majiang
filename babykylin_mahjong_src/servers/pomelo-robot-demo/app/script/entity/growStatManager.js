/**
 * Created by kilua on 2015-01-07.
 */

var _ = require('underscore');

var GrowStat = function(growDict){
    this.growDict = growDict || {};
};

GrowStat.prototype.add = function(other){
    var self = this;
    _.each(other, function(addPropDict) {
        _.each(addPropDict, function (addVals, addProp) {
            self.growDict[addProp] = self.growDict[addProp] || {coe: 0, val: 0};
            self.growDict[addProp].coe = self.growDict[addProp].coe + addVals.coe;
            self.growDict[addProp].val = self.growDict[addProp].val + addVals.val;
        });
    });
};

GrowStat.prototype.remove = function(other){
    var self = this;
    _.each(other, function(addPropDict) {
        _.each(addPropDict, function (addVals, addProp) {
            self.growDict[addProp].coe = self.growDict[addProp].coe - addVals.coe;
            self.growDict[addProp].val = self.growDict[addProp].val - addVals.val;
        });
    });
};

GrowStat.prototype.getVal = function(prop){
    if(this.growDict[prop]) {
        return this.growDict[prop].val;
    }
    return 0;
};

GrowStat.prototype.getCoe = function(prop){
    if(this.growDict[prop]){
        return this.growDict[prop].coe;
    }
    return 0;
};

GrowStat.prototype.clear = function(){
    this.growDict = {};
};

GrowStat.prototype.toJSON = function(){
    return this.growDict;
};

var GrowStatManager = function(){
    this.statsByName = {};
    this.statsByName.gift = new GrowStat();
    this.statsByName.equip = new GrowStat();
};

GrowStatManager.prototype.add = function(name, other){
    var statObj = this.statsByName[name];
    if(statObj){
        statObj.add(other);
    }
};

GrowStatManager.prototype.remove = function(name, other){
    var statObj = this.statsByName[name];
    if(statObj){
        statObj.remove(other);
    }
};

GrowStatManager.prototype.get = function(orgVal, prop){
    var sumVal = _.reduce(this.statsByName, function(memo, statObj){
            return (memo + statObj.getVal(prop));
        }, orgVal),
        sumCoe = _.reduce(this.statsByName, function(memo, statObj){
            return (memo + statObj.getCoe(prop));
        }, 1);
    return (sumVal * sumCoe);
};

GrowStatManager.prototype.toJSON = function(){
    var dict = {};
    _.each(this.statsByName, function(statObj, name){
        dict[name] = statObj.toJSON();
    });
    return dict;
};

module.exports = GrowStatManager;