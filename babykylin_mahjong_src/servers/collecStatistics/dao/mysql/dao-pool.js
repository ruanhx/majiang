var _poolModule = require('generic-pool');
var mysqlConfig = require('../../config/mysql');

var env = process.env.NODE_ENV || 'development';
if (mysqlConfig[env]) {
    mysqlConfig = mysqlConfig[env];
}

function decrypt(cyphertext) {
    return new Buffer(cyphertext, 'base64').toString();
}
/*
 * Create mysql connection pool.
 */
var createMysqlPool = function () {
    return _poolModule.Pool({
        name: 'mysql',
        create: function (callback) {
            var mysql = require('mysql');
            var client = mysql.createConnection({
                host: mysqlConfig.GameUser.host,
                user: mysqlConfig.GameUser.user,
                password: decrypt(mysqlConfig.GameUser.password),
                database: mysqlConfig.GameUser.database
            });
            callback(null, client);
        },
        destroy: function (client) {
            client.end();
        },
        max: 10,
        idleTimeoutMillis: 30000,
        log: false
    });
};

exports.createMysqlPool = createMysqlPool;
