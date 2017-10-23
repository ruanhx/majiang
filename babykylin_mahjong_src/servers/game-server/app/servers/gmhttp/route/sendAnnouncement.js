/**
 * Created by kilua on 2015-05-26.
 */

var logger = require('pomelo-logger').getLogger(__filename),
    pomelo = require('pomelo');

var Consts = require('../../../consts/consts')/*,
 systemMsg = require('../../../domain/systemMsg')*/;

module.exports = function (app, http) {
    http.get('/sendAnnouncement', function (req, res) {
        var values = req.query,
            announcement = values['announcement'],
            sendCount = values['sendCount'],
            interval = values['interval'],
            priority = values['priority'],
            pos = values['pos'],
            sendTime = values['sendTime'];
        logger.debug('sendAnnouncement announcement = %s, sendCount = %s, interval = %s, priority = %s, pos = %s, sendTime = %s',
            announcement, sendCount, interval, priority, pos, sendTime);
        switch (pos) {
            case "0":
                pomelo.app.rpc.world.rollingRemote.rollingPush.toServer('*', {
                    info: {content: announcement},
                    type: 1
                }, function (err, res) {

                });
                pomelo.app.rpc.chat.chatRemote.sendSysMsg("*", {content: announcement}, function () {

                });
                break;
            case "1":
                pomelo.app.rpc.chat.chatRemote.sendSysMsg("*", {content: announcement}, function () {

                });
                break;
            case "2":
                pomelo.app.rpc.world.rollingRemote.rollingPush.toServer('*', {
                    info: {content: announcement},
                    type: 1
                }, function (err, res) {

                });
                break;
            default:
                logger.error("公告位置不对 pos:%s", pos);
                break;
        }
        return res.send({result: 'ok'});
    });

    http.get('/cancelAnnouncement', function (req, res) {
        var values = req.query,
            emitterId = values.emitterId,
            result;
        logger.debug('cancelAnnouncement emitterId = %s', emitterId);
        result = systemMsg.removeAnnouncementEmitter(Consts.CHAT_CHANNEL.GM, emitterId);
        return res.send(result ? 'ok' : 'fail');
    });

    http.get('/getAnnouncements', function (req, res) {
        logger.debug('getAnnouncements...');
        return res.send({result: 'ok', announcements: systemMsg.getGMAnnouncements(Consts.CHAT_CHANNEL.GM)});
    });
};