/**
 * Created by kilua on 2015-05-26.
 */

var path = require('path'),
    fs = require('fs');

var express = require('express');

var HOST = '127.0.0.1',
    PORT = 3601;

module.exports = function(app, opts){
    opts = opts || {};
    return new ExpressProxy(app, opts);
};

function getHttpBase(app){
    return path.join(app.getBase(), 'app/servers', app.getServerType());
}

var ExpressProxy = function(app, opts){
    this.app = app;
    this.opts = opts;
    console.log('opts = %j', opts);
    this.exp = express();
    this.exp.set('views', getHttpBase(app) + '/views');
    this.exp.set('view engine', 'jade');
    this.exp.use(express.logger('dev'));
    // 设置路由
    this.loadRoutes();
};

var pro = ExpressProxy.prototype;

pro.name = '__ExpressProxy__';

pro.start = function(cb){
    var port = this.opts.port || PORT;
    this.exp.listen(port);
    console.log('start listen on port %s', port);
    process.nextTick(cb);
};

pro.afterStart = function(cb){
    process.nextTick(cb);
};

pro.stop = function(force, cb){
    process.nextTick(cb);
};

pro.loadRoutes = function(){
    var self = this,
        routesPath = path.join(getHttpBase(self.app), 'route');
    if(fs.existsSync(routesPath)){
        fs.readdirSync(routesPath).forEach(function(file) {
            if (/\.js$/.test(file) || /\.jse$/.test(file)) {
                var routePath = path.join(routesPath, file);
                // console.log(routePath);
                require(routePath)(self.app, self.exp);
            }
        });
    }
};

