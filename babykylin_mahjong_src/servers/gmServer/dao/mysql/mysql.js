/**
 * Created with JetBrains WebStorm.
 * User: WIN 7
 * Date: 13-3-22
 * Time: 下午12:05
 * To change this template use File | Settings | File Templates.
 */

// mysql CRUD
var sqlClient = module.exports;

//var _pool;

var NND = function(){

};

var pro = NND.prototype;

/*
 * Init sql connection pool
 * @param {Object} dbConfig The database config.
 */
pro.init = function(/*app, */dbConfig){
    this._pool = require('./dao-pool').createMysqlPool(dbConfig/*app.get('mysql').GameUser*/);
};

/**
 * Execute sql statement
 * @param {String} sql Statement The sql need to execute.
 * @param {Object} args The args for the sql.
 * @param {function} cb Callback function.
 *
 */
pro.query = function(sql, args, cb){
    var self = this;
    self._pool.acquire(function(err, client) {
        if (!!err) {
            console.error('[query ERROR] '+err.stack);
            return;
        }
        client.query(sql, args, function(err, res) {
            self._pool.release(client);
            cb(err, res);
        });
    });
};

/**
 * Close connection pool.
 */
pro.shutdown = function(){
    this._pool.destroyAllNow();
};

/**
 * init database
 */
sqlClient.init = function(/*app, */dbConfig) {
    //if(!_pool) {
        var dbClient = new NND();
        dbClient.init(dbConfig);
        //sqlClient.insert = NND.query;
        //sqlClient.update = NND.query;
        //sqlClient.remove = NND.query;
        //sqlClient.query = NND.query;
    //}
    return dbClient;
};

///**
// * shutdown database
// */
//sqlClient.shutdown = function(app) {
//    NND.shutdown(app);
//};
