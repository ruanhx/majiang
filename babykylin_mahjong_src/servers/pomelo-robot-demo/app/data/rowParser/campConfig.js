/**
 * Created by kilua on 2015-01-08.
 */

var common = require('./common');

module.exports = function (row) {
    row.BarrID = common.parseParams(row.BarrID);
    return row;
};