/**
 * Created by kilua on 2014-12-23.
 */

var util = require('util');

var _ = require('underscore');

var Item = require('./item'),
    utils = require('../utils'),
    dataApi = require('../../data/dataApi');

var Equip = function(opts){
    Item.call(this, opts);
    this.cardGroup = opts.cardGroup || 0;
    this.level = opts.level || 1;
};

util.inherits(Equip, Item);

var GROW_PROP_NAMES = ['growPow', 'growIQ', 'growAgi', 'growAtk', 'growHP', 'growDef', 'growDuck', 'growCrit',
    'growDuckPro', 'growCritPro'];
Equip.prototype.getGrowProps = function(){
    var self = this,
        growProps = {},
        quaAddLVData = dataApi.equipQuaAddLV.findById(self.itemData.quality),
        quaAddLV = 0;
    if(quaAddLVData){
        quaAddLV = quaAddLVData.addLV || 0;
    }
    _.each(this.itemData, function(colData, colName){
        if(_.indexOf(GROW_PROP_NAMES, colName) !== -1){
            // 过滤出增幅属性
            var prop = growProps[colName] = utils.clone(colData);
            //装备基础增加属性+装备自身基础固定值属性*装备升级系数*（装备等级-1）
            prop.val *= 1 + self.itemData.levelCoe * (self.level + quaAddLV - 1);
        }
    });
    console.log('getGrowProps itemData = %j, growProps = %j, level = %s, levelCoe = %s', this.itemData, growProps,
        self.level, self.itemData.levelCoe);
    return growProps;
};

module.exports = Equip;