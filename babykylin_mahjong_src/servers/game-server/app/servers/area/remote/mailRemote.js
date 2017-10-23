/**
 * Created by cxy on 2015-05-26.
 */

var pomelo = require('pomelo'),
    area = require('../../../domain/area/area'),
    logger = require('pomelo-logger').getLogger(__filename),
    dataUtils = require('../../../util/dataUtils'),
    mailDao = require('../../../dao/mailDao'),
    _ = require('underscore');

var Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;
function RemoveByTimeSort(finalList, dirtyList, deleteList, capacity) {
    dirtyList.sort(function (a, b) {
        if (a.delTime < b.delTime)
            return false;
        return true;
    });

    _.each(dirtyList, function (entry) {
        if (finalList.length < capacity)
            finalList.push(entry);
        else
            deleteList.push(entry);
    });
}

function getMailById(items, id) {
    var i;
    for (i = 0; i < items.length; ++i) {
        if (items[i].id === id) {
            return items[i];
        }
    }
    return null;
}

pro.newMail = function (playerId,mailVO, next) {
    var player = area.getPlayer(playerId);

    if (!!player) {
        player.mailPersonMgr.addNewMail(mailVO);
        // 须从数据库加载
        player.pushMsg('mail.new', {});
    }

    return next(null);
};
