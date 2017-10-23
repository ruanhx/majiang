/**
 * Created by lishaoshen on 2015/09/26.
 */

var pomelo = require('pomelo'),
    logger = require('pomelo-logger').getLogger(__filename);

var Code = require('../../../../shared/code'),
    playerDao = require('../../../dao/playerDao'),
    consts = require('../../../consts/consts'),
    report = require('../../../util/stateReport'),
    dataApi = require('../../../util/dataApi');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

Handler.prototype.createPlayer = function (msg, session, next) {
    var MAC = session.get('MAC'), name = msg.name, pwd = msg.pwd, app = this.app;
    var deviceId = session.get('deviceId'),
        rawUid = session.get('rawUid'),
        platform = session.get('platform');
    session.set('playerName', name);
    playerDao.getPlayerByName(name, function (err, player) {
        if (err) {
            logger.error('fail to invoke getPlayerByName for ' + err.stack);
            return next(null, {code: Code.DB_ERROR, error: err});
        }
        else {
            if (player) {
                console.log('player name exist');
                return next(null, {code: Code.CONNECTOR.FA_PLAYER_IS_EXIST});
            }
        }
        playerDao.createPlayer(MAC, name, pwd, function (err, playerId) {
            if (err) {
                logger.error('[register] fail to invoke createPlayer for ' + err.stack);
                return next(null, {code: Code.DB_ERROR, error: err});
            } else {
                // report.pushUserInfo(session.get('rawUid'));
                session.bind(playerId);
                session.set('playerId', playerId);
                session.pushAll(function () {
                    app.set('onlineCnt', app.get('onlineCnt') + 1);
                    next(null, {code: Code.OK})
                });
                // report.gainAward(session.get('MAC'),function (err,res) {
                //     var result = res.body;
                //     var mailId = dataUtils.getOptionValue("Sys_RechargeCompensateMailId",132);
                //     var rate = dataUtils.getOptionValue("Sys_RechargeCompensateRate",100);
                //     if(result.code==200){
                //         sendMail(playerId,mailId,result.money*rate,JSON.stringify([{type:consts.MAIL_PARAM_TYPE.TRUE_VALUE,value:result.money},{type:consts.MAIL_PARAM_TYPE.TRUE_VALUE,value:result.money*rate}]));
                //     }
                //     // logger.debug("######### %j",res);
                //
                // });
                //尝试发送邮件

                // var addressIp = session.__session__.__socket__.remoteAddress.ip.split("::ffff:");
                // var ip = 0;
                // if (addressIp.length>1){
                //     ip = addressIp[1];
                // }
            }
        });
    });
};

// function sendMail(playerId, mailId,count, infoParams) {
//     var sysMail = dataApi.SysEamil.findById(mailId);
//     //logger.debug("@@@@@ sysMail：%j",sysMail);
//     if (sysMail) {
//         //发送邮件
//         var mail = {title: sysMail.title, info: sysMail.text, sender: sysMail.name, infoParams: infoParams};
//         var _count = count ? count : 1;
//         var capacity = dataUtils.getOptionValue('mailUnReadExpired', 7);
//         // _.each(mail, function (entry) {
//         // 计算掉落
//         // 掉落按次序分组
//         var drops =[];
//         var drop = {};
//         drop.dropType = 4;
//         drop.itemId = 1;
//         drop.parameterId =  0;
//         // 随机数量
//         drop.count = count;
//
//         drops.push(drop);
//         var items = JSON.stringify(drops);
//
//         if (mail.life == null) {
//             mail.life = capacity * 24 * 60 * 60; // 7天
//         }
//
//         mail.addTime = Date.now();
//         mail.delTime = Date.now() + mail.life * 1000;
//         mail.playerId = playerId;
//         // });
//         pomelo.app.rpc.world.mailRemote.CreateMailByCustom("*", playerId, mail,items, function () {
//         });
//     }
// };