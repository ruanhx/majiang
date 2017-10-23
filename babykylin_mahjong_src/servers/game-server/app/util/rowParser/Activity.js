/**
 * Created by kilua on 2016/7/5 0005.
 */

var util = require('util');

var IndexData = require('../jsonTable'),
    Consts = require('../../consts/consts'),
    common = require('../utils');

var Activity = function (data) {
    IndexData.call(this, data, [['actType']]);
};

util.inherits(Activity, IndexData);

var pro = Activity.prototype;

pro.rowParser = function (row) {
    var result;
    switch (row.openingTimeType) {
        case Consts.ACTIVITY_OPEN_TYPE.PERIOD_DAY:
            result = common.parseParams(row.openingTime, '#');
            if (result.length >= 2) {
                result[0] = result[0] % 7;
                row.openingTime = util.format('0 0 %s * * %s', result[1], result[0]);
            }
            break;
        case Consts.ACTIVITY_OPEN_TYPE.PERIOD_DATE:
            result = common.parseParams(row.openingTime, '#');
            if (result.length >= 2) {
                row.openingTime = util.format('0 0 %s %s * *', result[1], result[0]);
            }
            break;
        case Consts.ACTIVITY_OPEN_TYPE.SERVER_DAY:
            result = common.parseParams(row.openingTime, '#');
            if (result.length >= 2) {
                row.openingTime = {day: result[0], hour: result[1]};
            }
            break;
        case Consts.ACTIVITY_OPEN_TYPE.DATE:
            result = common.parseParams(row.openingTime, '#');
            if (result.length >= 4) {
                row.openingTime = new Date();
                row.openingTime.setFullYear(result[0], result[1] - 1, result[2]);
                row.openingTime.setHours(result[3], 0, 0, 0);
            } else {
                console.error('invalid openingTime %s', row.openingTime);
            }
            break;
        case Consts.ACTIVITY_OPEN_TYPE.SMALL_WEEK:
        case Consts.ACTIVITY_OPEN_TYPE.BIG_WEEK:
            result = common.parseParams(row.openingTime, '#');
            row.strOpeningTime = row.openingTime;
            if (result.length >= 2) {
                result[0] = result[0] % 7;
                row.openingTime = util.format('0 0 %s * * %s', result[1], result[0]);
            }
            break;
    }
    if(row.loginDay != -1){
        row.loginDay = common.parseParams(row.loginDay, '#');
    }
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

module.exports = function (data) {
    return new Activity(data);
};