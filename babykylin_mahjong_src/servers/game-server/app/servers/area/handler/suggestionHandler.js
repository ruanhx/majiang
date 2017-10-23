/**
 * Created by kilua on 2016/5/24 0024.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    dataUtils = require('../../../util/dataUtils'),
    suggestionDao = require('../../../dao/suggestionDao');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

function checkCd(player) {
    if (!player.lastCommitSuggestionTick) {
        player.lastCommitSuggestionTick = Date.now();
        return true;
    }
    if (Date.now() - player.lastCommitSuggestionTick < 1000) {
        return false;
    }
    player.lastCommitSuggestionTick = Date.now();
    return true;
}
/*
 *   提交吐槽内容
 * */
pro.commit = function (msg, session, next) {
    logger.debug('commit playerId = %s, content = %s', session.get('playerId'), msg.content);
    var player = area.getPlayer(session.get('playerId')),
        content = msg.content,
        maxLen = dataUtils.getOptionValue('Sys_SuggestTextNum', 200);
    if (!checkCd(player)) {
        logger.warn('commit in cd...');
        return next(null, {code: Code.FAIL});
    }
    if (content.length > maxLen) {
        // 截断处理
        content = content.substr(0, maxLen);
    }
    // 计算当前最高猎魔人等级
    suggestionDao.add(player.id, player.getHeroMaxLV(), content, function (err, success) {
        if (err) {
            return next(null, {code: Code.DB_ERROR});
        }
        return next(null, {code: success ? Code.OK : Code.FAIL});
    });
};