/**
 * Created by tony on 2017/2/15.
 */

var util = require('util');

var _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename);

var Activity = require('../playerActivity'),
    dataApi = require('../../../util/dataApi'),
    dropUtils = require('../../area/dropUtils'),
    CondDetail = require('../../../domain/activity/condDetail'),
    utils = require('../../../util/utils'),
    Consts = require('../../../consts/consts'),
    flow = require('../../../consts/flow');

var InvitCfg = function (manager, player, actData) {
    Activity.call(this, manager, player, actData);
    this.InvitDict = {};

    var self = this;
    // 邀请码列表
    var initData = dataApi.InvitCfg.all();
    _.each(initData, function (param) {
        var condDetail = new CondDetail(self, param.id, param.dropId);
        var param1s = utils.parseParams(param.param1, '#');
        if ( _.size(param1s) == 2)
            condDetail.max = param1s[1];

        if (_.size(param1s) == 1)
            condDetail.max = param1s[0];
        self.condDict[condDetail.id] = condDetail;
    });

};

util.inherits(InvitCfg, Activity);

var pro = InvitCfg.prototype;

pro.applyAllAvailableAwards = function () {
    var self = this;
    _.each(self.InvitDict, function (invitStatus, id) {
        if (self.isFinishById(id) && !self.isDrewByInvitId(id)) {
            self.applyAwards(id, self.getDropsById(id));
        }
    });
};

pro.needInitialize = function () {
    return _.size(this.InvitDict) <= 0;
};
pro.reset = function () {
    //
};
/*
 *   更新进度，并保存
 * */
pro.progress = function (newProgress) {
    var changed = false;
    _.each(this.InvitDict, function (invitStatus) {
        if (newProgress > invitStatus.progress) {
            invitStatus.progress = newProgress;
            changed = true;
        }
    });
    if (changed) {
        this.save();
        this.refreshRedSpot();
    }
};

//数据库的数据
pro.loadDetail = function (saveData) {
    saveData = saveData || {};
    var self = this,
        details = saveData.InvitDict || [];
    details.forEach(function (detail) {
        var condDetail = self.condDict[detail.id];
        if (condDetail) {
            condDetail.load(detail);
        }
    });

};

pro.getDetailData = function () {
    var temp = [];
   _.each(this.condDict , function (condDetail) {
       temp.push(condDetail.getData());
   }) ;
    return {InvitDict: temp};
};

pro.getDetailInfo = function () {
    return {InvitCfg: this.getInvitList()};
};

pro.isFinishById = function (id) {
    var status = this.InvitDict[id];
    return (status && (status.progress >= id)) ? 1 : 0;
};

pro.haveAwardsToDraw = function () {
    var self = this,
        typeId = self.getTypeId(),
        condData = dataApi.InvitCfg.findById(typeId);
    if (!condData) {
        return false;
    }
    return _.some(condData.condParam, function (condParam) {
        return (self.isFinishById(condParam) && !self.isDrewById(condParam));
    });
};


pro.getDropIdById = function (id) {
    var data = dataApi.InvitCfg.findById(id);
    if (!data) {
        logger.warn('getDropIdByInvitId ActivityInvit id = %s not found!', this.getTypeId());
        return false;
    }
    return data.dropId;
};

pro.getDropsById = function (id) {
    var dropId = this.getDropIdById(id);
    if (dropId) {
        return dropUtils.getDropItems(dropId);
    } else {
        return [];
    }
};

pro.applyAwards = function (id, drops) {
    var invitStatus = this.InvitDict[id];
    if (!invitStatus) {
        logger.warn('applyAwards not invitCfg info found!id = %s', id);
        return null;
    }
    invitStatus.isDrew = 1;
    this.save();
    //this.pushNew();
    drops=   this.player.applyDrops(drops,null,flow.ITEM_FLOW.ACTIVITY);
    return drops;
};

/**
 * 是否已经领取
 * */
pro.isDrewById = function (id) {
    var status = this.InvitDict[id];
    return status ? status.isDrew : 0;
};


/*
* 获取描述信息
* **/
pro.getDetail = function (invitData) {
    if( !!this.player.language ){
        if(!invitData){
            logger.error('invitData Name is null');
            return '';
        }
        var getDetail =invitData[('getDetail_text_'+ this.player.language)];
        if(!!getDetail){
            return getDetail;
        }
    }
    return invitData.getDetail_text_en;
};

pro.getInvitList = function () {
    var self = this,
        typeId = self.getTypeId(),
        InvitData = dataApi.InvitCfg.all();
        invits = [];
    if (!InvitData) {
        return invits;
    }
    _.each(InvitData,function (data) {
        var invitCfg = {};

        invits.push(invitCfg);
        // 表信息
        invitCfg.id = data.id;
        var condDetail = self.condDict[invitCfg.id];

        invitCfg.rankId = data.rankId;
        invitCfg.rewardType = data.rewardType;
        invitCfg.conditionType = data.conditionType;
        invitCfg.dropId = data.dropId;
        invitCfg.param1 = data.param1;
        invitCfg.param2 = data.param2;
        invitCfg.getDetail = self.getDetail(data);
        invitCfg.isDrew = condDetail.getDrew();
        invitCfg.count = condDetail.getCount();
    });
    return invits;
};

/**
 * 邀请码表id是否存在
 * condId:为邀请码表的id
 * */
pro.getCondDetailById = function (condId) {
    return this.condDict[condId];
};
module.exports = InvitCfg;
