/**
 * Created by Administrator on 2016/3/10 0010.
 */

var util = require('util');

var _ = require('underscore');

var utils = require('../utils'),
    IndexData = require('../jsonTable');

var Chapter = function (data) {
    IndexData.call(this, data);
};

util.inherits(Chapter, IndexData);

var pro = Chapter.prototype;

pro.rowParser = function (row) {
    row.barriers = utils.parseParams(row.barriers, '#');
    return row;
};

pro.getPrimaryKey = function () {
    return 'id';
};

pro.getLastBarrier = function (chapterId) {
    var chapterData = this.findById(chapterId);
    if (chapterData) {
        return _.last(chapterData.barriers) || 0;
    }
    return 0;
};

pro.getFirstChapter = function () {
    var allChapterDict = this.all(),
        firstChapterData = _.min(allChapterDict, function (chapterData) {
            return chapterData.id;
        });
    return firstChapterData.id;
};

/*
 *   根据章节及星级条件id，获取所需星数
 * */
pro.getReqStarsByChapterIdAndCondId = function (chapterId, condId) {
    var chapterData = this.findById(chapterId);
    return chapterData[util.format('star%d', condId)] || Number.POSITIVE_INFINITY;
};

/*
 *   根据章节及星级条件id，获取宝箱掉落
 * */
pro.getStarDropByChapterIdAndCondId = function (chapterId, condId) {
    var chapterData = this.findById(chapterId);
    return chapterData[util.format('drop%d', condId)] || 0;
};

pro.getPreChapters = function (chapterId) {
    if (this.getFirstChapter() === chapterId) {
        return [];
    }
    var chapterData = this.findById(chapterId);
    if (chapterData && chapterData.preChapter) {
        return [chapterData.preChapter].concat(this.getPreChapters(chapterData.preChapter));
    }
    return [];
};

module.exports = function (data) {
    return new Chapter(data);
};