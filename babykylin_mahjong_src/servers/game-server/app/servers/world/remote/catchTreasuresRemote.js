/**
 * Created by kilua on 2016/7/23 0023.
 */

var logger = require('pomelo-logger').getLogger(__filename);

var world = require('../../../domain/world/world'),
    Code = require('../../../../shared/code'),
    Consts=require('../../../consts/consts'),
    playerManager = require('../../../domain/world/playerManager'),
    catchRankingList = require('../../../domain/world/rankList/catchRankingList');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;


/*
 *   更新排行榜
 * */
pro.updateCatchRankingList = function (args, cb) {
    logger.debug('updateCatchRankingList playerId = %s, occasionId = %s', args.playerId);
    catchRankingList.getCatchRankingList().update({id: args.playerId, playerId: args.playerId, score: args.score,rankType:Consts.RANKING_TYPE.CATCH});
    //logger.debug('~~updateCatchRankingList = %j', catchRankingList.getCatchRankingList());
    var res = catchRankingList.getCatchRankingList().findById(args.playerId);
    return cb(res);
};
