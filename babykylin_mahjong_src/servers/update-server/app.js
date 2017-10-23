var express = require('express'),
    config = require('./config') || {};

var app = express(),
    port = config.port || 3001,
    staticPath = __dirname + '/public';
process.title = 'Update Server';
app.configure(function () {
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
    app.set('view engine', 'jade');
    app.set('views', staticPath);
    app.set('view options', {layout: false});
    app.set('basepath', staticPath);
});

app.configure('development', function () {
    app.use(express.static(staticPath));
    app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
});

app.configure('production', function () {
    var oneYear = 31557600000;
    app.use(express.static(staticPath, {maxAge: oneYear}));
    app.use(express.errorHandler());
});

console.log("Web server has started listening on %s", port);

app.listen(port);
