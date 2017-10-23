/**
 * Created by ljq on 2017/9/12.
 */
var dbClient = require('../dao/mysql/mysql'),
    logDao = require('../dao/mysql4Log/logDao');

exports.pushLog = function(req, res) {
    var info = req.body;
    function rsCallBack(err,rs){
        if(!err){
            res.send({code: 200,rs:rs});
        }else{
            res.send({code: 500});
        }
    }
    var doAction = logDao[info.action];
    if(!doAction){
        res.send({code: 404});
        return;
    }
    doAction(dbClient,info.record,rsCallBack);

}