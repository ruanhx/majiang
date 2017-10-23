/**
 * Created by tony on 2016/9/8.
 */

var util = require('util'),
    pomelo = require('pomelo');

var _ = require('underscore');

var Activity = require('./activity'),
    starRankingList = require('../../world/rankList/starRankingList'),
    dataApi = require('../../../util/dataApi');

var starRank = function (manager, player, actData) {
    Activity.call(this, manager, player, actData);
};

util.inherits(starRank, Activity);

var pro = starRank.prototype;


pro.onClose = function () {
    var self = this;
    pomelo.app.rpc.world.rankListRemote.sendStarRankAward("*", {}, function () {
        if (self.isOpenByOpFlags()) {
            // �����Ӫ��ʶ����Ӫ��ʶδ�رգ����ʱ�����ʱ
            if (self.haveAwardsToDraw()) {
                //���н�������ȡ������б�����ʧ�����������״̬�²�ˢ�£���ͬʱ������ֱ�ӷ�����ң������ߵ��������ʱ���裩
                self.applyAllAvailableAwards();
                self.manager.remove(self);
            } else {
                //���޽�������ȡ�������б�����ʧ
                self.manager.remove(self);
            }
        } else {
            // �ʱ�䵽��ʱ�򣬶�Ӧ��־֮ǰ�ѱ��رգ�ֱ��ɾ���
            self.manager.remove(self);
        }
    });

};

module.exports = starRank;