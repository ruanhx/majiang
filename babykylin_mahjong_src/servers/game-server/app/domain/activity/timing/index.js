/**
 * Created by kilua on 2016/6/22 0022.
 */

var Consts = require('../../../consts/consts'),
    Weekly = require('./weekly'),
    Monthly = require('./monthly'),
    ServerDay = require('./serverDay'),
    SomeDate = require('./someDate'),
    Permanent = require('./permanent'),
    NewPlayer = require('./newPlayer'),
    BigSmallWeek = require('./bigSmallWeek');

module.exports.createTiming = function(activity){
    switch (activity.getOpenTimeType()){
        case Consts.ACTIVITY_OPEN_TYPE.PERIOD_DAY:
            return new Weekly(activity);
        case Consts.ACTIVITY_OPEN_TYPE.PERIOD_DATE:
            return new Monthly(activity);
        case Consts.ACTIVITY_OPEN_TYPE.SERVER_DAY:
            return new ServerDay(activity);
        case Consts.ACTIVITY_OPEN_TYPE.DATE:
            return new SomeDate(activity);
        case Consts.ACTIVITY_OPEN_TYPE.SMALL_WEEK:
        case Consts.ACTIVITY_OPEN_TYPE.BIG_WEEK:
            return new BigSmallWeek(activity);
        case Consts.ACTIVITY_OPEN_TYPE.PERMANENT:
            return new Permanent(activity);
        case Consts.ACTIVITY_OPEN_TYPE.NEW_PLAYER:
            return new NewPlayer(activity);
        default:
            return null;
    }
};
