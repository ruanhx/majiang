/**
 * Created by kilua on 2015-09-13.
 */

var fs = require('fs');

var express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    _ = require('underscore'),
    MySQLSessionStore;

    MySQLSessionStore = require('./libs/connect-mysql-session')(session);

var config = require('./config/config.json'),
    mysqlConf = require('./config/mysql.json'),
    passwordEncoder = require('./utils/passwordEncoder'),
    routes = require('./routes'),
    mysql = require('./dao/mysql/mysql'),
    CODE = require('./shared/code'),
    PRIVILEGE = require('./config/privilege.json'),
    GMAccountUtil = require('./utils/GMAccountUtil');

mysqlConf.password = passwordEncoder.decrypt(mysqlConf.password);

var app = module.exports = express(),
    dbClient = mysql.init(mysqlConf);

app.set('views', __dirname + '/views');
//app.set('view engine', 'jade');
//app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());            // 开启cookie
app.use(session({                   // 开启session
    resave: true,
    saveUninitialized: true,
    cookie: {maxAge: 1000 * 60 * 60 * 24},
    secret: config.session_secret,
    store: new MySQLSessionStore(mysqlConf.database, mysqlConf.user, mysqlConf.password, {host: mysqlConf.host, port: mysqlConf.port})
}));
process.title = 'GM Server';
app.use(function(req, res, next){
    req.dbClient = dbClient;
    res.locals.user = req.session.user;

    var err = req.session.error;
    delete req.session.error;
    res.locals.message = '';
    if(err){
        res.locals.message = '<div class="alert alert-waring">' + err + '</div>';
    }
    next();
});

var NO_LOGIN_URL = ['/', '/login', '/logout'];
app.use(function(req, res, next){
    var url = req.originalUrl;
    if(!_.contains(NO_LOGIN_URL, url) && !req.session.user){
        req.session.error = '请先登录';
        return res.send({code: CODE.NO_LOGIN});
        //return res.redirect('/login');
    }
    next();
});

// 统一检查权限
app.use(function(req, res, next){
    var url = req.originalUrl,
        expectPrivilege = PRIVILEGE[url];
    if(expectPrivilege){
        // 检查权限
        if(!GMAccountUtil.haveEnoughPrivilege(req.session.user.privilege, expectPrivilege)){
            return res.send({code: CODE.LACK_PRIVILEGE});
        }
    }
    next();
});

app.use('/', routes);

//// catch 404 and forward to error handler
//app.use(function(req, res, next){
//    var err = new Error('Not Found');
//    err.status = 404;
//    next(err);
//});
//
//if(app.get('env') == 'development'){
//    app.use(function(err, req, res, next){
//        res.status(err.status || 500);
//        res.render('error', {
//            message: err.message,
//            error: err
//        })
//    });
//}
//
//app.use(function(err, req, res, next){
//    res.status(err.status || 500);
//    res.render('error', {
//        message: err.message,
//        error: {}
//    });
//});

process.on('uncaughtException', function (err) {
    console.error(' Caught exception: ' + err.stack);
});

try{
    app.listen(config.port);
    console.log('Express server listening on port ' + config.port);
}catch (e){
    console.error('Error: ' + e.stack);
}