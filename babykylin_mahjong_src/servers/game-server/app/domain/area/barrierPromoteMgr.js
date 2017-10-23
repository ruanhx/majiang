/**
 * Created by employee11 on 2016/2/1.
 */
var pomelo = require('pomelo'),
    _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename);

var consts = require('../../consts/consts'),
    Code = require('../../../shared/code'),
    dataUtils = require('../../util/dataUtils'),
    dataApi = require('../../util/dataApi'),
    dropUtils = require('../area/dropUtils');


var Manager = function (player) {
    this.player = player;
    this.dataVOMap = {};//key:chapterId
};

var pro = Manager.prototype;

module.exports = Manager;
pro.clearBarrierPromoteMgr = function(){
    delete this.player;

    for(var key in this.dataVOMap){
        delete this.dataVOMap[key];
    }
    delete this.dataVOMap;
}

function VO(data){
    data = data||{};
    this.playerId = data.playerId||0;
    this.chapterId = data.chapterId||0;
    this.barrierPromoteDropIds = data.barrierPromoteDropIds||[];
    this.barrierPromoteEndTick = data.barrierPromoteEndTick||0;
    this.drew = data.drew||0;
}


/**
 * 加载模块数据
 * @param dbDataList
 */
pro.load = function(dbDataList){
    var self= this;
    _.each(dbDataList||[],function(data){
        data.barrierPromoteDropIds = JSON.parse(data.barrierPromoteDropIds);
        if(self.player.id === data.playerId){
            self.dataVOMap[data.chapterId] = data;
        }
    });
}

pro.getClientInfo = function(){
    return _.values(this.dataVOMap);
}

pro.addPromote = function(chapterId,barrierPromoteDropIds){
    var self= this;
    if(self.dataVOMap[chapterId]) return;//已经存在就不理会
    self.dataVOMap[chapterId] = new VO({
        playerId : self.player.id,
        chapterId : chapterId,
        barrierPromoteDropIds : barrierPromoteDropIds,
        barrierPromoteEndTick : new Date().getTime()+dataUtils.getOptionValue("Custom_ShopLiveTime")*3600000,
        drew : 0
    });
    self.player.emit('saveBarrierPromote',self.dataVOMap[chapterId]);
    self.player.pushMsg('barrierPromote.update', self.dataVOMap[chapterId]);
}

pro.getPromote = function(chapterId){
    var self= this;
    return self.dataVOMap[chapterId];
}

pro.setDrew = function(chapterId,drew){
    var self= this;
    if(!self.dataVOMap[chapterId]) return;
    self.dataVOMap[chapterId].drew = drew;
    self.player.emit('saveBarrierPromote',self.dataVOMap[chapterId]);
    self.player.pushMsg('barrierPromote.update', self.dataVOMap[chapterId]);
}