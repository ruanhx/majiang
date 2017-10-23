/**
 * Created by cxy on 2015-06-08.
 */

var pomelo = require('pomelo'),
    logger = require('pomelo-logger').getLogger(__filename);

function sendMailByUsers(targetUser, mail, res){
    var targetList = targetUser.split('#');
    if(targetList.length > 0){
        var detail = {
            userList: targetList,
            mail: [mail]
        };
        pomelo.app.rpc.world.mailRemote.CreateMailByUser.toServer('*', detail, function(err, failUsers)
        {
            if (null !== failUsers && failUsers.length > 0)
                res.send('Failed:' + JSON.stringify(failUsers));
            else
                res.send("Ok");
        });
    }else{
        res.send('Ok');
    }
}

module.exports = function (app, http) {
    http.get('/sendMail', function (req, res) {
        var values = req.query,
            targetName = values['targetName'],
            targetID = values['targetID'],
            sender = values['sender'],
            title = values['title'],
            life = values['life'],
            drop = values['drop'],
            info = values['info'],
            greater = values['greater'],
            less = values['less'],
            targetUser = values['targetUser'];
            serverMail = values['serverMail'];
//        console.log('/sendMail query = %j', values);
        // 换行转换
        var list = info.split("/n");
        info = list.join("\n");
        if (life.length == 0)
        {
            life = null;
        }
        if(serverMail ==1){
            var detail = {
                mail: {sender: sender, title: title, info: info, drop: drop, life: life,type:1}
            };
            pomelo.app.rpc.world.mailRemote.creatServerMail.toServer('*', detail, function(err, rsp)
            {
                res.send('Ok');
            });
            // logger.debug("@@@@@@@@@ 发送成功");
            // res.send('Ok');
        }
        else if ((greater != null && less != null) && (greater.length != 0 || less.length != 0))
        {
            var detail = {
                up: less,
                low: greater,
                mail: [{sender: sender, title: title, info: info, drop: drop, life: life}]
            };

            pomelo.app.rpc.world.mailRemote.CreateMailByLvLimit.toServer('*', detail, function(err, rsp)
            {
                res.send(!!rsp ? rsp : 'fail');
            });
        }
        else if (targetID != null && targetID.length != 0)
        {
            var targetList = targetID.split('#');
            // TODO:多封邮件
            var detail = {
                idList: targetList,
                mail: {sender: sender, title: title, info: info, drop: drop, life: life,type:1}
            };

            pomelo.app.rpc.world.mailRemote.CreateMailByPlayerID.toServer('*', detail, function(err, rsp)
            {
                res.send('Ok');
            });
        }
        else if (targetName != null && targetName.length != 0)
        {
            // TODO:多封邮件
            var targetList = targetName.split('#');
            var detail = {
                nameList: targetList,
                mail: {sender: sender, title: title, info: info, drop: drop, life: life,type:1}
            };
            pomelo.app.rpc.world.mailRemote.CreateMailByPlayerName.toServer('*', detail, function(err, rsp)
            {
                if (null != rsp && null != rsp.length && rsp.length > 0)
                    res.send('Failed:' + JSON.stringify(rsp));
                else
                    res.send("Ok");
            });
        } else if(targetUser !== null){
            sendMailByUsers(targetUser, {sender: sender, title: title, info: info, drop: drop, life: life,type:1}, res);
        }
        else
        {
            res.send('Failed: error parser');
        }
    });
};