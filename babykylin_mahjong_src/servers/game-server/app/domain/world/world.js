/**
 * Created by kilua on 2016/7/22 0022.
 */

var MatchQueue = require('./matchQueue'),
    dataUtils = require('../../util/dataUtils'),
    dataApi = require('../../util/dataApi'),
    Consts = require('../../consts/consts');

var exp = module.exports;

var endlessMatchQueuesById;

function initPairOccasionMatchQueues() {
    endlessMatchQueuesById = {};
    var pairOccasionDatas = dataApi.EndlessType.findByIndex({type: Consts.ENDLESS_MODE.PAIR});
    pairOccasionDatas.forEach(function (pairOccasionData) {
        var matchQueue = new MatchQueue({
            occasionId: pairOccasionData.id,
            timeout: dataUtils.getOptionValue('Endless_MatchTime02', 10) * 1000,
            sectionTimeouts: [dataUtils.getOptionValue('Endless_MatchTime01', 5) * 1000],
            sectionPercents: [dataUtils.getEndlessMatchRange('Endless_MatchPower01'), dataUtils.getEndlessMatchRange('Endless_MatchPower02')]
        });
        endlessMatchQueuesById[matchQueue.id] = matchQueue;
        console.info('initPairOccasionMatchQueues occasion.id = %s', matchQueue.id);
    });
}
exp.init = function () {
    // initPairOccasionMatchQueues();
};

exp.getEndlessMatchQueueByOccasionId = function (occasionId) {
    return endlessMatchQueuesById[occasionId];
};
