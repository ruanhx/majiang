/**
 * Created by max on 2017/7/8.
 */

var util = require('util'),
    pomelo = require('pomelo');

var _ = require('underscore');

var Activity = require('./activity'),
    starRankingList = require('../../world/rankList/starRankingList'),
    dataApi = require('../../../util/dataApi');

var barrierScoreRank = function (manager, actData) {
    Activity.call(this, manager, actData);
};

util.inherits(barrierScoreRank, Activity);

var pro = barrierScoreRank.prototype;


pro.reset = function () {
    pomelo.app.rpc.world.rankListRemote.sendBarrierScoreAward("*", {}, function () {

    });
};

// pro.onClose = function () {
//     starRankingList.getModle().dispatchAwards();
//     if (this.isOpenByOpFlags()) {
//         // �����Ӫ��ʶ����Ӫ��ʶδ�رգ����ʱ�����ʱ
//         if (this.haveAwardsToDraw()) {
//             //���н�������ȡ������б�����ʧ�����������״̬�²�ˢ�£���ͬʱ������ֱ�ӷ�����ң������ߵ��������ʱ���裩
//             this.applyAllAvailableAwards();
//             this.manager.remove(this);
//         } else {
//             //���޽�������ȡ�������б�����ʧ
//             this.manager.remove(this);
//         }
//     } else {
//         // �ʱ�䵽��ʱ�򣬶�Ӧ��־֮ǰ�ѱ��رգ�ֱ��ɾ���
//         this.manager.remove(this);
//     }
// };

module.exports = barrierScoreRank;