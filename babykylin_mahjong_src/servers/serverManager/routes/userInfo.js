/**
 * Created with JetBrains WebStorm.
 * User: kilua
 * Date: 13-9-25
 * Time: 下午5:02
 * To change this template use File | Settings | File Templates.
 */

var dbClient = require('../dao/mysql/mysql')
    , userDao = require('../dao/userDao'),
    rechargeDao = require('../dao/rechargeDao'),
    rechargeReward = require('./rechargeReward');

exports.pushUserInfo = function(req, res){
    var user = req.body, MAC = user.MAC, serverName = user.serverName;
    if(!user || !MAC || !serverName){
        res.send({code: 500});
        return;
    }
    userDao.pushUserInfo(dbClient, user, function(err, success){
        if(err){
            res.send({code: 501});
        }else{
            if(success){
                res.send({code: 200});
            }else{
                res.send({code: 501});
            }
        }
    });
};

exports.gainAward = function (req, res) {
    var user = req.body, MAC = user.MAC;
    if(!user || !MAC){
        console.info("gainAward error !MAC");
        res.send({code: 500});
        return;
    }
    var record =rechargeReward.getInstance().getRechargeInfo(MAC);
    // 是否充值过
    if(!record){
        console.info("gainAward error record error");
        res.send({code: 500});
        return;
    }
    // 是否已经领取
    if(record.hasDraw){
        console.info("gainAward error hasDraw");
        res.send({code: 504});
        return;
    }

    rechargeDao.drawReward(dbClient,{},function (err,result) {
        if(err){
            res.send({code: 500});
            return;
        }
        res.send({code:200,money:record.money,diamond:record.diamond});
    });
    return;
};