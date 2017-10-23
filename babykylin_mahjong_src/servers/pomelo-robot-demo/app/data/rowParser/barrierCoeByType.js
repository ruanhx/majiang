/**
 * Created by kilua on 2015-01-02.
 */

var common = require('./common');

module.exports = function (row) {
    row.id = row.barrierType;
    return row;
};