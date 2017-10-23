/**
 * Created by tony on 2016/10/3.
 * 吃鸡获得体力
 */

var util = require('util');
var mUtils = require('../../../util/utils');
var _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename);

var Activity = require('../playerActivity'),
    playerActionLog = require('../../../dao/playerActionLogDao'),
    dropUtils = require('../../area/dropUtils'),
    flow = require('../../../consts/flow'),
    dataApi = require('../../../util/dataApi');

var HeroCollect = function (manager, player, actData) {
    Activity.call(this, manager, player, actData);
    this.collectRecordDict = {};
    player.on("onActHeroCollect",this.updateProgress.bind(this));
};

util.inherits(HeroCollect, Activity);

var pro = HeroCollect.prototype;

pro.getDetailInfo = function () {
    return { collects: this.getCollectList()};
};

pro.needInitialize = function () {
    return false;
};

pro.init = function () {
    return false;
};

pro.getDetailData = function () {
    return {collectRecordDict: this.collectRecordDict};
};
pro.loadDetail = function (detail) {
    var self = this;
    self.collectRecordDict =  detail.collectRecordDict || {};
};
pro.getCollectList = function () {
    var self = this;
    var collectList = _.values(dataApi.ActivityHeroCollect.all());
    var infoList = [];
    var collectStatus ;
    _.each(collectList,function(collect){
        collectStatus = self.collectRecordDict[collect.id] || {};
        infoList.push({
            id:collect.id,
            name:collect.name,
            heroIds: collect.heroIds,
            dropId:collect.dropId,
            progress:collectStatus.progress||[],
            isDrew : collectStatus.isDrew||0
        });
    });
    return infoList;
};


/*
* 重置
* */
pro.reset = function()
{
    this.collectRecordDict = {};
    this.vewTick = 0;
    this.pubTick = 0;
    this.refreshRedSpot();
    this.save();
};

/**
 * 有没有未领取的奖励
 * @param collectId
 * @returns {boolean}
 */
pro.haveGot = function(collectId){
    var self = this;
    if(!self.collectRecordDict[collectId])
        return false;
    if(self.isFinishByCollectId(collectId) && !self.isDrewByCollectId(collectId)){
        return true;
    }
    return false;
}

/**
 * 是否完成
 * @param collectId
 * @returns {boolean}
 */
pro.isFinishByCollectId = function(collectId){
    var collectRecord = this.collectRecordDict[collectId];
    if(!collectRecord)  return false;
    var activityHeroCollect = dataApi.ActivityHeroCollect.findById(collectId);
    if(!activityHeroCollect)  return false;
    return activityHeroCollect.heroIds.length === collectRecord.progress.length;
}

/**
 *
 * @param collectId
 * @returns {boolean}
 */
pro.isDrewByCollectId = function(collectId){
    var collectRecord = this.collectRecordDict[collectId];
    if(!collectRecord)  return false;
    return collectRecord.isDrew === 1
}

/**
 *
 * @param collectId
 * @returns {*}
 */
pro.applyAwards = function (collectId) {
    var collectRecord = this.collectRecordDict[collectId];
    if (!collectRecord) {
        logger.warn('applyAwards not collectRecord info found!collectId = %s', collectId);
        return null;
    }
    var activityHeroCollect = dataApi.ActivityHeroCollect.findById(collectId);
    if(!activityHeroCollect){
        logger.warn('applyAwards not activityHeroCollect info found!collectId = %s', collectId);
        return null;
    }

    collectRecord.isDrew = 1;
    this.save();
    var items = dropUtils.getDropItems(activityHeroCollect.dropId);
    var drops = this.player.applyDrops(items,null,flow.ITEM_FLOW.ACTIVITY_HERO_COLLECT);
    playerActionLog.logDrawActivityAwards(this.player, this.id, activityHeroCollect.dropId);
    return drops;
};

pro.haveAwardsToDraw = function () {
    var b = false;
    var self = this;
    var collectList = _.values(dataApi.ActivityHeroCollect.all());
    var record;
    for(var i=0 ; i<collectList.length; i++){
        record = collectList[i];
        if(self.haveGot(record.id)){
            b = true;
            break;
        }
    }
    return b;
}

function CollectRecord(args){
    args = args||{};
    this.id = args.id||0;
    this.progress = args.progress || [];
    this.isDrew = args.isDrew || 0;
}

pro.updateProgress = function(heroId,historyHeroId){
    var self = this;
    var collectList = _.values(dataApi.ActivityHeroCollect.all());
    var isNew = false;
    function oneUpdate(_heroId){
        _.each(collectList,function(collect){
            if(_.indexOf(collect.heroIds,_heroId) !== -1){
                if(!self.collectRecordDict[collect.id]){
                    self.collectRecordDict[collect.id] = new CollectRecord({id:collect.id,progress:[_heroId]});
                    isNew = true;
                }else{
                    if(-1===_.indexOf(self.collectRecordDict[collect.id].progress,_heroId)){
                        self.collectRecordDict[collect.id].progress.push(_heroId);
                        isNew = true;
                    }
                }
            }
        });
    }
    _.each(historyHeroId,function(_heroId){
        oneUpdate(_heroId);
    });
    if(isNew){
        self.refreshRedSpot();
        self.save();
    }
}

module.exports = HeroCollect;