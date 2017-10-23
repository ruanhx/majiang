/**
 * Created by kilua on 2016/7/17 0017.
 */

var util = require('util');

var _ = require('underscore');

var IndexData = require('../jsonTable'),
    utils = require('../utils');

var EndlessRankReward = function (data) {
    IndexData.call(this, data, [['id']]);
};

util.inherits(EndlessRankReward, IndexData);

var pro = EndlessRankReward.prototype;

pro.rowParser = function (row) {
    row.rank = utils.parseParams(row.rank, '#');
    // 解释-1，表示正无穷
    row.rank = _.map(row.rank, function (rank) {
        if (rank === -1) {
            return Number.POSITIVE_INFINITY;
        }
        return rank;
    });
    return row;
};

pro.getPrimaryKey = function () {
    return '';
};

/*
 *   根据排行榜类型和排名，查找对应奖励
 * */
pro.getDropIdByTypeAndRank = function (type, rank) {
    var typeRows = this.findByIndex({id: type}),
        awardData = _.find(typeRows, function (row) {
            return (rank >= row.rank[0] && rank <= row.rank[1]);
        });
    if (awardData) {
        return awardData.dropId;
    }
    return 0;
};

/*
 *   根据排行榜类型和排名，查找对应奖励邮件
 * */
pro.getMailIdByTypeAndRank = function (type, rank) {
    var typeRows = this.findByIndex({id: type}),
        awardData = _.find(typeRows, function (row) {
            return (rank >= row.rank[0] && rank <= row.rank[1]);
        });
    if (awardData) {
        return awardData.mailId;
    }
    return 0;
};

module.exports = function (data) {
    return new EndlessRankReward(data);
};