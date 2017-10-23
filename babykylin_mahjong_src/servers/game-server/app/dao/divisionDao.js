/**
 * Created by lishaoshen on 2015/11/1.
 */

var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var utils = require('../util/utils');

var dao = module.exports;




dao.removeAll = function () {
    var sql = 'DELETE FROM division WHERE 1';
    pomelo.app.get('dbclient').query(sql, [], function (err, res) {
        if (err) {
            logger.error('removeAll division err = %s', err.stack);
        }
    });
}

dao.removeByDivition = function(divitionId){

}

dao.findByDivition = function(divitionId){

}

dao.findAll = function(callBack){

    var sql = 'SELECT * FROM division ',
        args = [];

    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('findAll err = %s', err.stack);
            utils.invokeCallback(callBack, err.message);
        } else {
            res = res || [];
            utils.invokeCallback(callBack, null, res);
        }
    });
}

dao.add = function(records){

    if(!records || !(records instanceof Array)){
        logger.error('db add division records err ');
        return;
    }
    if(records.length<1){
        //没数据就不做任何多余处理
        return;
    }

    var sql = 'INSERT INTO division(divisionId,playerId,name,heroId,hPower,hScore,divScore,isRobot) VALUES ' ;
    var args = [];
    records.forEach(function(rc){
        sql += "( ?, ?, ?, ?, ?, ?, ?,?),";
        args.push(rc.divisionId);
        args.push(rc.playerId);
        args.push(rc.name);
        args.push(rc.heroId);
        args.push(rc.hPower);
        args.push(rc.hScore);
        args.push(rc.divScore);
        args.push(rc.isRobot);
    });
    sql=sql.substring(0,sql.length-1);
    pomelo.app.get('dbclient').query(sql, args, function (err, res) {
        if (err) {
            logger.error('db add err = %s, division = %j', err.stack, records);
        }
    });
}