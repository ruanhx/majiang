/**
 * Created by kilua on 2016/6/23 0023.
 * 公告类活动
 */

var util = require('util');

var _ = require('underscore');

var Activity = require('../playerActivity'),
    dataApi = require('../../../util/dataApi');

var Notice = function (manager, player, actData) {
    Activity.call(this, manager, player, actData);
};

util.inherits(Notice, Activity);

var pro = Notice.prototype;

pro.getDetailInfo = function () {
    var noticeDatas = dataApi.ActivityNotice.findByIndex({id: this.getTypeId()}),
        notices = [];
    if (!_.isArray(noticeDatas)) {
        // 由于findByIndex将单个结果给直接返回了，这里重新组织成数组
        noticeDatas = [noticeDatas];
    }
    noticeDatas.forEach(function (noticeData) {
        var noticeInfo = {};
        notices.push(noticeInfo);
        // 公告详细信息
        noticeInfo.type = noticeData.type;
        // 如果不是字符串,统一转成字符串
        noticeInfo.text = _.isString(noticeData.text) ? noticeData.text : (noticeData.text + '');
        noticeInfo.textSize = noticeData.textSize;
    });
    return {notices: notices};
};

module.exports = Notice;