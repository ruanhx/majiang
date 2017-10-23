/**
 * Created by
 */

var logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    dataApi = require('../../../util/dataApi'),
    dataUtils = require('../../../util/dataUtils'),
    dropUtils = require('../../../domain/area/dropUtils'),
    libUtils = require('../../../../mylib/utils/lib/utils'),
    CondDetail = require('../../../domain/activity/condDetail'),
    inviteDao = require('../../../dao/inviteDao'),
    inviteManager = require('../../../domain/area/inviteManager'),
    Consts = require('../../../consts/consts');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

//加入游戏
pro.joinGame = function(msg, session, next){
    var player =  area.getPlayer(session.get('playerId'));
    next(null,player.catchTreasureManager.joinGame());
}


//结束一次抓取
pro.overGame = function(msg, session, next){
    var player =  area.getPlayer(session.get('playerId'));
    var rs = player.catchTreasureManager.overGame(msg.treasureList,msg.score,msg.playCnt);
    if(rs.code == Code.OK){
        this.app.rpc.world.catchTreasuresRemote.updateCatchRankingList(session, {
            playerId: player.id,
            score: msg.score
        }, function (res) {
            if(res){
                player.emit("onActCTreasureRankChange",res.rank||0);
            }
        });
    }

    next(null,rs);
}

//购买抓取次数
pro.buyOnePlayCount = function(msg, session, next){
    var player =  area.getPlayer(session.get('playerId'));
    next(null,  player.catchTreasureManager.buyOnePlayCount());
}