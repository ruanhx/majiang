/**
 * Created by Administrator on 2016/3/10 0010.
 */

var _ = require('underscore');

var dataApi = require('../../util/dataApi');

var Chapter = function (player, opts) {
    opts = opts || {};
    this.player = player;
    this.id = opts.chapterId;
    this.drawFlag = opts.drawFlag;
};
Chapter.prototype.clearChapter = function(){
    delete this.player;
    delete this.id;
    delete this.drawFlag;
}
/*
 *   章节星级宝箱是否已领取
 *   @param  {Number}    星级条件id
 * * */
Chapter.prototype.isDrewByCondId = function (starCondId) {
    return this.drawFlag & Math.pow(2, starCondId - 1);
};

Chapter.prototype.getData = function () {
    return {
        chapterId: this.id,
        playerId: this.player.id,
        drawFlag: this.drawFlag
    };
};

Chapter.prototype.getClientInfo = function () {
    return {
        chapterId: this.id,
        drawFlag: this.drawFlag
    };
};

Chapter.prototype.save = function () {
    this.player.emit('unlockChapter.save', this.getData())
};

Chapter.prototype.setFlag = function (newFlag) {
    if (newFlag !== this.drawFlag) {
        this.drawFlag = newFlag;
        this.save();
        this.refresh();
    }
};

Chapter.prototype.setDrewByCondId = function (starCondId) {
    this.setFlag(this.drawFlag | Math.pow(2, starCondId - 1));
};

Chapter.prototype.refresh = function () {
    this.player.pushMsg('chapter.unlock', this.getClientInfo());
};

var Manager = function (player) {
    this.player = player;
};

var pro = Manager.prototype;
pro.clearUnlockChapterMgr = function(){
    delete this.player;

    for(var key in this.chaptersById){
        var chapter = this.chaptersById[key];
        chapter.clearChapter();
        delete this.chaptersById[key];
    }
    delete this.chaptersById;
}

pro.load = function (chapterRecs) {
    var chaptersById = this.chaptersById = {},
        player = this.player;
    chapterRecs = chapterRecs || [];
    chapterRecs.forEach(function (chapterRec) {
        chaptersById[chapterRec.chapterId] = new Chapter(player, chapterRec);
    });
    //console.info('load cnt = %s', _.size(this.chaptersById));
    if (_.size(this.chaptersById) === 0) {
        // 自动解锁第一章节
        this.unlock(dataApi.Chapter.getFirstChapter());
    }
};

pro.getClientInfo = function () {
    var infoList = [];
    _.each(this.chaptersById, function (chapter) {
        infoList.push(chapter.getClientInfo());
    });
    return infoList;
};

/*
 *   章节是否已解锁
 * */
pro.isUnlocked = function (chapterId) {
    return !!this.chaptersById[chapterId];
};

/*
 *   添加已解锁章节
 * */
pro.add = function (chapterId) {
    if (!this.chaptersById[chapterId]) {
        var chapter = new Chapter(this.player, {chapterId: chapterId, drawFlag: 0});
        this.chaptersById[chapterId] = chapter;
        chapter.save();
        chapter.refresh();
        return true;
    }
    return false;
};
/*
 *   解锁章节
 * */
pro.unlock = function (chapterId) {
    if (!this.isUnlocked(chapterId)) {
        return this.add(chapterId);
    }
    return false;
};

pro.setDrew = function (chapterId, condId) {
    var chapterRec = this.chaptersById[chapterId];
    if (chapterRec) {
        chapterRec.setDrewByCondId(condId);
    }
};

pro.isDrew = function (chapterId, condId) {
    var chapterRec = this.chaptersById[chapterId];
    if (chapterRec) {
        return chapterRec.isDrewByCondId(condId);
    }
    return false;
};

module.exports = Manager;