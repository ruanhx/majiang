/**
 * Created by employee11 on 2016/2/1.
 */
var pomelo = require('pomelo'),
    _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename);

var consts = require('../../consts/consts'),
    flow = require('../../consts/flow'),
    dataUtils = require('../../util/dataUtils'),
    dataApi = require('../../util/dataApi'),
    mailDao = require('../../dao/mailDao'),
    dropUtils = require('../area/dropUtils');


var Manager = function (player) {
    this.player = player;
};

var pro = Manager.prototype;

pro.clearMailPersonMgr = function(){
    delete this.player;
}

function MailVO(data){
    this.id = data.id||0;
    this.playerId = data.playerId||0;
    this.status = data.status||0;
    this.title = data.title||0;
    this.info = data.info||0;
    this.sender = data.sender||0;
    this.addTime = data.addTime||0;
    this.delTime = data.delTime||0;
    this.items = data.items||'[]';
    this.type = data.type||0;
    this.infoParams = data.infoParams||0;
    this.drops = JSON.parse(this.items);
}
pro.mailVOList = [];//邮件列表

module.exports = Manager;

function MailTitle(vo){
    this.id = vo.id;
    this.title = vo.title;
    this.addTime = vo.addTime;
    this.delTime = vo.delTime;
    this.status = vo.status;
    this.itemCnt = vo.drops ? vo.drops.length : 0;
    this.type = vo.type;
}

function getMailById(items, id) {
    var i;
    for (i = 0; i < items.length; ++i) {
        if (items[i].id === id) {
            return items[i];
        }
    }
    return null;
}


function getMailIndexById(items, id) {
    var i;
    for (i = 0; i < items.length; ++i) {
        if (items[i].id === id) {
            return i;
        }
    }
    return -1;
}

//修正缓存列表--删除不合适邮件
pro.correct = function(){
    var self = this;
    var retIds = [];//删除列表
    var capacity =dataUtils.getOptionValue('mailCapacity', 2);
    if(capacity<1)return;
    var tempMail;
    while(self.mailVOList.length>capacity){
        tempMail = self.mailVOList.pop();
        retIds.push(tempMail.id);
    }
    if(retIds.length!=0)
        this.player.emit("removeMail",retIds);
}

/**
 * 管理器加载数据
 * @param cb
 */
pro.load = function(dbMails){
    var self = this;
    self.mailVOList = [];//初始化
    self.mailVOList = dbMails;
    this.correct();
    //self.mailVOList = self.mailVOList.slice(0,capacity);
}

/**
 * 获取邮件标题列表
 * @param cb
 */
pro.getMailTitle = function(cb){
    var self = this;
    if(!self.mailVOList) {cb(false);return;}
    var mailTitleList = [];
    _.each(self.mailVOList,function(vo){
        mailTitleList.push(new MailTitle(vo));
    });
    cb(mailTitleList);
}

/**
 * 获取详细信息
 * @param mailId
 * @param cb
 */
pro.getMailDetail = function(mailId,cb){
    var self = this;
    if(!self.mailVOList) {cb(false);return;}
    var mail = getMailById(self.mailVOList,mailId);
    if (null == mail || Date.now() > mail.delTime) {
        cb(false);  // 邮件不存在, 或者已过期
        return;
    }

    if(mail.status == consts.MAIL_STATUS.READED || (mail.drops&& mail.drops.length>0)){
        var rsMail = JSON.parse(JSON.stringify(mail));
        if(rsMail.infoParams!="" && rsMail.infoParams!=null){
            rsMail.infoParams = JSON.parse(rsMail.infoParams);
        }else{
            rsMail.infoParams = [];
        }
        cb(true,rsMail);
        return;
    }

    var ReadExpired = dataUtils.getOptionValue('mailReadExpired', 3);
    ReadExpired = ReadExpired * 24 * 60 * 60 * 1000;
    if (mail.delTime - Date.now() > ReadExpired)
    {
        mail.delTime = Date.now() + ReadExpired;
    }
    mail.status = consts.MAIL_STATUS.READED;
    this.player.emit("saveMail",mail);
    //更新数据表 -- 要不要改成异步的
    //mailDao.updateStatus(pomelo.app.get('dbclient'), self.player.id, mail.status, mail.id, mail.delTime, function (err, isOK) {});
    var rsMail = JSON.parse(JSON.stringify(mail));
    if(rsMail.infoParams!="" && rsMail.infoParams!=null){
        rsMail.infoParams = JSON.parse(rsMail.infoParams);
    }else{
        rsMail.infoParams = [];
    }
    cb(true,rsMail);
}

/**
 * 领取单个邮件附件
 * @param mailId
 * @param cb
 */
pro.getMailItems = function(mailId,cb){
    var self = this;
    if(!self.mailVOList) {cb(false);return;}
    var mail = getMailById(self.mailVOList,mailId);
    if (null == mail || Date.now() > mail.delTime || mail.status == consts.MAIL_STATUS.READED) {
        cb(false);  // 邮件不存在, 或者已过期
        return;
    }

    var ReadExpired = dataUtils.getOptionValue('mailReadExpired', 3);
    ReadExpired = ReadExpired * 24 * 60 * 60 * 1000;

    if (mail.delTime - Date.now() > ReadExpired)
    {
        mail.delTime = Date.now() + ReadExpired;
    }
    mail.status = consts.MAIL_STATUS.READED;
    var awardDrops =  self.player.applyDrops( mail.drops,null,flow.ITEM_FLOW.MAIL_GAIN);
    this.player.emit("saveMail",mail);
    //更新数据表 -- 要不要改成异步的
    //mailDao.updateStatus(pomelo.app.get('dbclient'), self.player.id, consts.MAIL_STATUS.READED, mail.id, mail.delTime, function (err, isOK) {});
    cb(true,{drops: awardDrops, status: mail.status, id: mail.id, delTime: mail.delTime});
}

/**
 * 领取全部附件
 * @param cb
 */
pro.getAllMailItems = function(cb){
    var self = this;
    if(!self.mailVOList) {cb(false);return;}
    var ReadExpired = dataUtils.getOptionValue('mailReadExpired', 3);
    ReadExpired = ReadExpired * 24 * 60 * 60 * 1000;
    var   allDrops = [];
    _.each(self.mailVOList, function (mail) {
        var nowCheck = Date.now();
        if (null != mail
            && consts.MAIL_STATUS.READED != mail.status
            && mail.drops.length != 0
            && nowCheck <= mail.delTime) {
            _.each(mail.drops, function (entry) {
                allDrops.push(entry);
            });

            if (mail.delTime - Date.now() > ReadExpired)
                mail.delTime = Date.now() + ReadExpired;

            mail.status = consts.MAIL_STATUS.READED;
            //保存数据
            self.player.emit("saveMail",mail);
        }
    });
    var mailDrops = self.player.applyDrops(allDrops,null,flow.ITEM_FLOW.MAIL_GAIN);
    cb(true,mailDrops);
}
/**
 * 删除邮件
 * @param mailId
 * @param cb
 */
pro.removeMail = function(mailId,cb){
    var self = this;
    if(!self.mailVOList) {cb(false);return;}
    var index = getMailIndexById(self.mailVOList,mailId);

    if (-1 == index || Date.now() > self.mailVOList[index].delTime) {
        cb(false);
        return;
    }
    self.mailVOList.splice(index,1);
    //删除数据库
    this.player.emit("removeMail",{id:mailId});
    //mailDao.removeByMailId(pomelo.app.get('dbclient'), msg.id, function (err, isOK){});
    cb(true);
}

/**
 *删除已读邮件
 * @param cb
 */
pro.removeAllMail = function(cb){
    var self = this;
    if(!self.mailVOList) {cb(false);return;}
    var newList = [], retIds = [];
    _.each(self.mailVOList, function (mail) {
        if (consts.MAIL_STATUS.READED != mail.status) {
            newList.push(mail);
        }
        else {
            retIds.push(mail.id);
        }
    });
    self.mailVOList = newList;
    //删除数据
    if(retIds.length!=0)
        this.player.emit("removeMail",{id:retIds});
    cb(true,retIds);
}

/**
 * 插入新邮件 -- 不更新数据库
 * @param vo
 */
pro.addNewMail = function(vo){
    if(!vo){
        return false;
    }
    this.mailVOList.splice(0,0,new MailVO(vo));
    this.correct();
}

