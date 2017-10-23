/**
 * Created by tony on 2016/12/28.
 */
var util = require('util');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var TalkChannel = function (data) {
    IndexData.call(this, data);
};

util.inherits(TalkChannel, IndexData);

var pro = TalkChannel.prototype;

pro.rowParser = function (row) {
    row.numberMessage = utils.parseParams(row.numberMessage, '&');
    return row;
};

pro.getPrimaryKey = function () {
    return 'channelId';
};

module.exports = function (data) {
    return new TalkChannel(data);
};