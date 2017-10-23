/**
 * Created by kilua on 2016/7/18 0018.
 */

var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore'),
    pomelo = require('pomelo');

var dataApi = require('../../util/dataApi'),
    dropUtils = require('../../domain/area/dropUtils'),
    Consts = require('../../consts/consts');

var Buff = function (dbBuff) {
    EventEmitter.call(this);

    dbBuff = dbBuff || {};
    this.dataId = dbBuff.dataId;
    this.playerId = dbBuff.playerId;
    this.cnt = dbBuff.cnt;
    this.buyCnt = dbBuff.buyCnt;
    this.bindData();
};

util.inherits(Buff, EventEmitter);
Buff.prototype.clearBuff = function () {
    delete this.dataId;
    delete this.playerId;
    delete this.cnt;
    delete this.buyCnt;
    if(!!this.data){
        delete this.data;
    }
    this.removeAllListeners();
}

Buff.prototype.bindData = function () {
    this.data = dataApi.EndlessBuff.findById(this.dataId);
    if (!this.data) {
        logger.error('bindData id = %s not found in [EndlessBuff]', this.dataId);
    }
};


Buff.prototype.getEffectType = function () {
    if (this.data) {
        return this.data.effectType;
    }
    return 0;
};

Buff.prototype.getEffectVal = function () {
    if (this.data) {
        return (this.cnt > 0 && this.data.effectNum) || 0;
    }
    return 0;
};

Buff.prototype.getData = function () {
    return {dataId: this.dataId, playerId: this.playerId, cnt: this.cnt, buyCnt: this.buyCnt};
};

Buff.prototype.setCnt = function (newCnt) {
    if (newCnt !== this.cnt) {
        this.cnt = newCnt;
        this.emit('save', this.getData());
        this.refresh();
    }
};

Buff.prototype.getCnt = function () {
    return this.cnt;
};

Buff.prototype.setBuyCnt = function (newCnt) {
    if (newCnt !== this.buyCnt) {
        this.buyCnt = newCnt;
        this.emit('save', this.getData());
        this.refresh();
    }
};

Buff.prototype.getClientInfo = function () {
    return {dataId: this.dataId, cnt: this.cnt, buyCnt: this.buyCnt};
};

Buff.prototype.refresh = function () {
    this.emit('refresh', this.getClientInfo());
};

var BuffManager = function (player) {
    this.player = player;
    this.buffsById = {};
    //是否可以获得英雄
    this.isCanGetHero = this.player.isCanAddDailyEndlessHero();
};

var pro = BuffManager.prototype;

pro.clearBuffManager = function(){
    delete this.player;
    delete this.isCanGetHero;

    for(var key in this.buffsById){
        var buff = this.buffsById[key];
        buff.clearBuff();
        delete this.buffsById[key];
    }
    delete this.buffsById;

}

pro.create = function (dbBuff) {
    var buff = new Buff(dbBuff),
        self = this;
    buff.on('save', function (buffData) {
        self.player.emit('endlessBuff.save', buffData);
    });
    buff.on('refresh', function (buffInfo) {
        self.player.pushMsg('endlessBuff.refresh', buffInfo);
    });
    return buff;
};


/*
 * 无尽战前标记是否可以获得英雄
 * */
pro.setIsCanGetHero = function ( is ) {
    this.isCanGetHero = is;
};

/*
 * 是否可以获得英雄
 * */
pro.getIsCanGetHero = function () {
    return this.isCanGetHero;
};

/*
*  获取无尽奖励
* */
pro.getAward = function ( dropId ,num ) {
    num = num || 1;
    var drops = dropUtils.getDropItems(dropId);
    var isCanGetHero = this.getIsCanGetHero();
    //已到当日获得英雄上线
    if( !isCanGetHero ){
        //删除英雄
        drops = _.filter(  drops , function ( tmpData  ) {
            return tmpData.dropType != Consts.DROP_TYPE.HERO;
        });
    }else{
        var temDrops  = _.filter(  drops , function ( tmpData  ) {
            return tmpData.dropType == Consts.DROP_TYPE.HERO;
        });
        if(!!temDrops) {
            var tmpAllCnt = 0;
            _.each(temDrops,function (tmp) {
                tmpAllCnt+= tmp.count;
            });
            this.player.addDailyEndlessHeroCnt(tmpAllCnt);// * num );
        }
    }
    return drops;
};

pro.add = function (dataId) {
    var buff = this.getById(dataId);
    if (!buff) {
        buff = this.buffsById[dataId] = this.create({dataId: dataId, playerId: this.player.id, cnt: 1, buyCnt: 1});
        buff.emit('save', buff.getData());
        buff.refresh();
    } else {
        //logger.debug('### add dataId = %s, cnt = %s', dataId, buff.cnt);
        buff.setCnt(buff.cnt + 1);
        buff.setBuyCnt(buff.buyCnt + 1);
    }
    return buff;
};

//奖励无尽buff (比如引导)
pro.addAward = function (dataId,cnt) {
    var buff = this.getById(dataId);
    cnt = cnt || 1;
    if (!buff) {
        buff = this.buffsById[dataId] = this.create({dataId: dataId, playerId: this.player.id, cnt: cnt, buyCnt: 0});
        buff.emit('save', buff.getData());
        buff.refresh();
    } else {
        buff.setCnt(buff.cnt + cnt);
    }
    return buff;
};

pro.load = function (dbBuffList) {
    dbBuffList = dbBuffList || [];
    this.buffsById = {};
    var self = this;
    dbBuffList.forEach(function (dbBuff) {
        self.buffsById[dbBuff.dataId] = self.create(dbBuff);
    });
    logger.debug('load cnt = %s', _.size(this.buffsById));
};

pro.getClientInfo = function () {
    return _.map(this.buffsById, function (buff) {
        return buff.getClientInfo();
    });
};

pro.getById = function (dataId) {
    return this.buffsById[dataId];
};

pro.getCntById = function (dataId) {
    if(!!this.buffsById[dataId]){
        return this.buffsById[dataId].getCnt();
    }
    return 0;
}
pro.resetBuyCnt = function () {
    _.each(this.buffsById, function (buff) {
        buff.setBuyCnt(0);
    });
    this.player.set('endlessBuffBuyCntResetTick', Date.now());
};

pro.processOfflineReset = function () {
    if (!this.player.endlessBuffBuyCntResetTick) {
        // 首次
        this.resetBuyCnt();
    } else {
        var trigger = pomelo.app.get('cronManager').getTriggerById(Consts.AREA_CRON.RESET_ENDLESS),
            nextExecuteTime = trigger.nextExcuteTime(this.player.endlessBuffBuyCntResetTick);
        logger.debug('processOfflineReset endlessBuffBuyCntResetTick = %s', new Date(this.player.endlessBuffBuyCntResetTick).toString());
        if (nextExecuteTime < Date.now()) {
            this.resetBuyCnt();
        }
    }
};

pro.getItemPrice = function (itemData) {
    var buff = this.getById(itemData.id);
    return itemData.moneyNum[Math.min(buff ? buff.buyCnt : 0, itemData.moneyNum.length - 1)];
};

/*
 *   获取下发的加成购买项目信息
 * */
pro.getShopItem = function (itemData) {
    var buff = this.getById(itemData.id),
        buffInfo = {};
    buffInfo.dataId = itemData.id;
    if (buff) {
        buffInfo.cnt = buff.cnt;
        buffInfo.buyCnt = buff.buyCnt;
    } else {
        buffInfo.cnt = 0;
        buffInfo.buyCnt = 0;
    }
    // 计算当前购买价格
    buffInfo.moneyNum = this.getItemPrice(itemData);
    return buffInfo;
};

pro.decreaseAll = function () {
    var isHaveEffectType5Cnt = _.find(this.buffsById,function (buff) {
        return ( buff.getEffectType() == 5 && buff.getCnt() > 0 );
    });

    var effectBuffIds = [];
    _.each(this.buffsById, function (buff) {
        if (buff.cnt > 0) {
            var tempType= buff.getEffectType();
            if( ( tempType== 6 && isHaveEffectType5Cnt == undefined) ||
                  tempType != 6 ){
                buff.setCnt(buff.cnt - 1);
                effectBuffIds.push(buff.dataId);
            }
        }
    });
    return effectBuffIds;
};

/*
 *   获取指定类型的加成效果总值，同类型的buff效果是叠加的
 * */
pro.getEffectTotalByEffectType = function (effType) {
    return _.reduce(this.buffsById, function (memo, buff) {
        if (buff.getEffectType() === effType) {
            return memo + buff.getEffectVal();
        }
        return memo;
    }, 0);
};

pro.getEffectBuffIds = function () {
    var effectBuffIds = [];
    _.each(this.buffsById, function (buff) {
        if (buff.cnt > 0) {
            effectBuffIds.push(buff.dataId);
        }
    });
    return effectBuffIds;
};

module.exports.create = function (player) {
    return new BuffManager(player);
};