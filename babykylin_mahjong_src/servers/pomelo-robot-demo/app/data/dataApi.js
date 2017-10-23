// system modules.
var util = require('util');

var _ = require('underscore');

// require json files
var modelConfig = require('./json/modelConfig'),
    cardProperty = require('./json/cardProperty'),
    cardLevelProperty = require('./json/cardLevelProperty'),
    qualityCoe = require('./json/qualityCoe'),
    skill = require('./json/skill'),
    dropIndex = require('./json/dropIndex'),
    dropTable = require('./json/dropTable'),
    utils = require('../../mylib/utils/lib/utils'),
    barrier = require('./json/barrier'),
    criLevel = require('./json/criLevel'),
    groupRefreshMob = require('./json/groupRefreshMob'),
    playerProperties = require('./json/playerProperties'),
    campConfig = require('./json/campConfig'),
    campConfigRowParser = require('./rowParser/campConfig'),
    gift = require('./json/gift'),
    giftRowParser = require('./rowParser/gift'),
    barrierCoeByType = require('./json/barrierCoeByType'),
    barrierCoeByTypeRowParser = require('./rowParser/barrierCoeByType'),
    equip = require('./json/equip'),
    equipRowParser = require('./rowParser/equip'),
    equipQuaAddLV = require('./json/equipQuaAddLV'),
    config = require('./json/config'),
    aRobotAct = require('./json/aRobotAct');

/**
 * Data model `new Data()`
 *
 * @param {Array} data
 *
 */
var Data = function(data, rowParser) {
    var fields = {};
    data[1].forEach(function(i, k) {
        fields[i] = k;
    });
    data.splice(0, 2);

    var result = [];
    rowParser = rowParser || _.identity;
    data.forEach(function(k) {
        result.push(rowParser(mapData(fields, k)));
    });

    this.data = result;
};

/**
 * map the array data to object
 *
 * @param {Object}  fields
 * @param {Array}   item
 * @return {Object} result
 * @api private
 */
var mapData = function(fields, item) {
  var obj = {};
  for (var k in fields) {
      if(fields.hasOwnProperty(k)) {
          obj[k] = item[fields[k]];
      }
  }
  return obj;
};

/**
 * find items by attribute
 *
 * @param {String} attr attribute name
 * @param {String|Number} value the value of the attribute
 * @return {Array} result
 * @api public
 */
Data.prototype.findBy = function(attr, value) {
  var result = [];
  //console.log(' findBy ' + attr + '  value:' + value + '  index: ' + index);
  this.data.forEach(function(k) {
    if (k[attr] === value) {
      k = utils.clone(k);
      result.push(k);
    }
  });
  return result;
};

/**
 * find item by id
 *
 * @param id
 * @return {Object}
 * @api public
 */
Data.prototype.findById = function(id) {
  var result;

  for (var i = 0, l = this.data.length; i < l; i ++) {
    if (this.data[i].id === id || this.data[i].ID === id) {
      result = utils.clone(this.data[i]);
      break;
    }
  }

  return result;
};

/**
 * find all item
 *
 * @return {array}
 * @api public
 */
Data.prototype.all = function() {
  return utils.clone(this.data);
};

/*
*   查找指定属性所在的区间
* */
Data.prototype.findZoneBy = function(attr, val){
    var i, row, result = [];

    function cloneArray(arr){
        var another = [];
        arr.forEach(function(elem){
            another.push(utils.clone(elem));
        });
        return another;
    }
    // 必须先排序，以提高效率
    if(!this.sorted){
        // 按待查属性升序排列
        this.data.sort(function(a, b){
            return (a[attr] - b[attr]);
        });
        this.sorted = true;
    }
    // 表没有数据
    if(this.data.length <= 0){
        return [];
    }
    // 只一行
    if(this.data.length === 1){
        return cloneArray([this.data[0], this.data[0]]);
    }
    // 2行及以上
    for(i = 0; i < this.data.length; ++i){
        row = this.data[i];
        if(Number(row[attr]) >= Number(val)){
            if(i > 0){
                result.push(this.data[i - 1]);
                result.push(row);
            }else{
                result.push(row);
                result.push(this.data[i + 1]);
            }
            return cloneArray(result);
        }
    }
    // 爆表的情况,取最后一行
    result.push(this.data[this.data.length - 1]);
    result.push(this.data[this.data.length - 1]);
    return cloneArray(result);
};

module.exports = {
    modelConfig: new Data(modelConfig),
    cardProperty: new Data(cardProperty),
    cardLevelProperty: new Data(cardLevelProperty),
    qualityCoe: new Data(qualityCoe),
    skill: new Data(skill),
    dropIndex: new Data(dropIndex),
    dropTable: new Data(dropTable),
    barrier: new Data(barrier),
    criLevel: new Data(criLevel),
    groupRefreshMob: new Data(groupRefreshMob),
    playerProperties: new Data(playerProperties),
    campConfig: new Data(campConfig, campConfigRowParser),
    gift: new Data(gift, giftRowParser),
    barrierCoeByType: new Data(barrierCoeByType, barrierCoeByTypeRowParser),
    equip: new Data(equip, equipRowParser),
    equipQuaAddLV: new Data(equipQuaAddLV),
    config: new Data(config),
    aRobotAct:new Data(aRobotAct)

};

//Data(talk);
