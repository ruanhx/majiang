/**
 * Created by kilua on 2016/7/5 0005.
 */

var dropUtils = require('../area/dropUtils');

var CondDetail = function (activity, condParam, dropId) {
    this.activity = activity;
    this.id = condParam;
    this.count = 0;
    this.max = condParam;
    this.dropId = dropId;
    this.initAwards();
};

CondDetail.prototype.clearCondDetail = function(){
    delete this.activity;
    delete this.id;
    delete this.count;
    delete this.max;
    delete this.dropId;
}

CondDetail.prototype.initAwards = function () {
    this.drops = dropUtils.getDropItems(this.dropId);
    this.isDrew = 0;
};
/*
* 获取奖励
* */
CondDetail.prototype.getAward = function () {
    if(!!this.drops){
        return this.drops;
    }
    logger.error('CondDetail.prototype.getAward  drops: ',JSON.stringify(this.drops) );
    return [];
};

CondDetail.prototype.finished = function () {
    return (this.count >= this.max);
};

CondDetail.prototype.everDrew = function () {
    return (this.isDrew === 1);
};

CondDetail.prototype.getDrew = function () {
    return this.isDrew;
};

CondDetail.prototype.setDrew = function () {
    this.isDrew = 1;
    this.activity.save();
    //this.activity.pushNew(this.id);
};
CondDetail.prototype.getCount = function () {
    return this.count;
};
CondDetail.prototype.setCount = function (cnt, batchMode, addAfterFinished) {
    if (!addAfterFinished && this.finished()) {
        // 满了不继续记录，以提高性能
        return false;
    }
    this.count = cnt;
    if (!batchMode) {
        this.activity.save();
        //this.activity.pushNew(this.id);
    }
    return true;
};

CondDetail.prototype.init = function (progress) {
    this.count = progress;
};

CondDetail.prototype.load = function (saveData) {
    this.count = saveData.count;
    this.isDrew = saveData.isDrew;
};

CondDetail.prototype.getClientInfo = function () {
    return {condParam: this.id, count: this.count, isDrew: this.isDrew, drops: this.drops};
};

CondDetail.prototype.getData = function () {
    return {id: this.id, count: this.count, isDrew: this.isDrew};
};


/*
 *   是否有奖励可领取
 * */
CondDetail.prototype.haveAwardsToDraw = function () {
    return (this.finished() && !this.everDrew());
};

module.exports = CondDetail;
