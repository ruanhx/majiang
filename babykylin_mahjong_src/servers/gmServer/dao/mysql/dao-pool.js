/**
 * Created with JetBrains WebStorm.
 * User: WIN 7
 * Date: 13-3-22
 * Time: 上午11:52
 * To change this template use File | Settings | File Templates.
 */

var _poolModule = require('generic-pool');

/*
 * Create mysql connection pool.
 */
var createMysqlPool = function(mysqlConfig) {
    //var mysqlConfig = app.get('mysql');
    return _poolModule.Pool({
        name: 'mysql',
        create: function(callback) {
            var mysql = require('mysql');
            var client = mysql.createConnection({
                host: mysqlConfig.host,
                user: mysqlConfig.user,
                password: mysqlConfig.password,
                database: mysqlConfig.database,
                supportBigNumbers: true
            });
            callback(null, client);
        },
        destroy: function(client) {
            client.end();
        },
        max: 10,
        idleTimeoutMillis : 30000,
        log : false
    });
};

exports.createMysqlPool = createMysqlPool;

