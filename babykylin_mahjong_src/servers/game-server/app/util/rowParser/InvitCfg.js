/**
 * Created by tony on 2017/2/15.
 */
var util = require('util');

var IndexData = require('../jsonTable');

var InvitCfg = function (data) {
    IndexData.call(this, data);
};

util.inherits(InvitCfg, IndexData);

var pro = InvitCfg.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

module.exports = function (data) {
    return new InvitCfg(data);
};