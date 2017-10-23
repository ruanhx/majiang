/**
 * Created by employee11 on 2016/3/1.
 */
var util = require('util');
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../utils'),
    IndexData = require('../jsonTable');

var dataApi = require('../dataApi');
var RoleAtkType = function (data) {
    IndexData.call(this, data);
};

util.inherits(RoleAtkType, IndexData);

var pro = RoleAtkType.prototype;



pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};


module.exports = function (data) {
    return new RoleAtkType(data);
};