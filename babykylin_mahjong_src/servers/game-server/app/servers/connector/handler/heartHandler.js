/**
 * Created by employee11 on 2016/3/1.
 */

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var pro = Handler.prototype;

pro.clientHeart = function (msg, session, next) {
    next(null);
};

pro.syncClientTime = function (msg, session, next) {
    next(null, {time: Date.now()});
};
