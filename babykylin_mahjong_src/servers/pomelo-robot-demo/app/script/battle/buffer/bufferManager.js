/**
 * Created with JetBrains WebStorm.
 * User: kilua
 * Date: 13-10-7
 * Time: 下午1:30
 * To change this template use File | Settings | File Templates.
 */

var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var _ = require('underscore'),
    log4js = require('log4js'),
    logger = log4js.getLogger(__filename);

var Buffer = require('./buffer'),
    Consts = require('../../consts'),
    cmds = require('../../netHandler');

var BufferManager = function(owner){
    EventEmitter.call(this);

    this.owner = owner;
    this.bufs = {};
    this.bufListById = [];
};

util.inherits(BufferManager, EventEmitter);

var pro = BufferManager.prototype;

/*
 *   清除所有光环
 * */
pro.clearAuras = function(){
    var self = this;
    _.each(self.bufListById, function(buff){
        if(buff.isAura()){
            logger.debug('clearAuras buff.id = %s', buff.id);
            self.removeBuf(buff.id, true);
        }
    });
};
/*
 *   查找同源 buffer
 * */
pro.getSameBufferList = function(skillId, userEntityId){
    var results = [];
    _.each(this.bufs, function(buf){
        if(buf.same(skillId, userEntityId)){
            results.push(buf);
        }
    });
    return results;
};

pro.removeBuf = function(bufId, notNotifyServer){
    var self = this,
        buf = self.bufs[bufId];
    if(buf){
//        if(buf.isAura()){
//            console.error('removeBuf can not remove aura!skillId = %s', buf.skill.dataId);
//            return null;
//        }
        delete self.bufs[bufId];
        var i;
        for(i = this.bufListById.length - 1; i >= 0; --i){
            if(this.bufListById[i].id === buf.id){
                this.bufListById.splice(i, 1);
                break;
            }
        }
        // 触发事件
        this.owner.emit('removeBuf', buf);
        // 发送封包
        notNotifyServer = notNotifyServer || false;
        if(notNotifyServer){
            return null;
        }
        if(!Consts.BATCH_REPORT){
            cmds.removeBuffer(self.owner.pomelo, self.owner.entityId, [bufId], Date.now(), function(data){
                if(data.code === 200){
                    console.info('removeBuf ok!entityId = %s, buf.id = %s', self.owner.entityId, bufId);
                }else{
                    console.error('removeBuf error!code = %s, entityId = %s, buf.id = %s', data.code, self.owner.entityId,
                        bufId);
                }
            });
        }
        return {removeBuffer: {entityId: self.owner.entityId, bufIds: [bufId], clientTick: Date.now()}};
    }
};

pro.removeSameBufferList = function(skillId, userEntityId){
    var self = this,
        sameBuffs = self.getSameBufferList(skillId, userEntityId),
        rmBufIds = [];
    _.each(sameBuffs, function(buf){
        logger.debug('removeSameBufferList buf.id = %s, skillId = %s, userEntityId = %s', buf.id, skillId, userEntityId);
        self.removeBuf(buf.id, true);
        rmBufIds.push(buf.id);
    });
    return rmBufIds;
};

/*
*   根据技能ID删除光环
* */
pro.removeAuraBySkillId = function(skillId){
    var i, buff;
    for(i = 0; i < this.bufListById.length; ++i){
        buff = this.bufListById[i];
        if(buff.skill.id === skillId){
            logger.debug('removeAuraBySkillId buff.id = %s', buff.id);
            this.removeBuf(buff.id, true);
            break;
        }
    }
};

pro.addBuf = function(buf, tick, act, cb){
    var rmBufIds = [], msg;
    if(!buf.skill.noOverwrite){
        // 存在技能ID相同且同源buff，先删除
        rmBufIds = this.removeSameBufferList(buf.skill.id, buf.user.entityId);
    }
    this.bufs[buf.id] = buf;
    this.bufListById.push(buf);
    // 触发事件
    this.owner.emit('addBuf', buf);
    // 立即生效
    msg = buf.apply(true, tick, act);
    cb(rmBufIds, !!msg ? msg.bufferTakeEffect.effects : []);
};

pro.eachBuff = function(cb){
    _.each(this.bufListById, cb);
};

pro.getInfo = function(){
    var bufs = [];
    _.each(this.bufs, function(buf){
        bufs.push(buf.getInfo())
    });
    return bufs;
};

pro.clear = function(){
    var self = this;
    _.each(this.bufs, function(buf){
        self.removeBuf(buf.id, true);
    });
    this.bufs = {};
    this.bufListById = [];
};

pro.process = function(tick, act){
    var self = this, result = [], i, buf, takeEffectMsg, rmBuffMsg;
    if(self.owner.isDead()){
        return result;
    }
    // 注意: 由于可能在遍历过程中删除buff,这里采用逆序遍历
    for(i = self.bufListById.length - 1; i >= 0; --i){
        buf = self.bufListById[i];
        takeEffectMsg = buf.process(tick, act, self.owner.pomelo);
        if(takeEffectMsg){
            result.push(takeEffectMsg);
        }
        if(buf.isOver(tick)){
            rmBuffMsg = self.removeBuf(buf.id);
            if(rmBuffMsg){
                result.push(rmBuffMsg);
            }
        }
    }
    return result;
};

/*
*   检查是否有负面 buff
* */
pro.haveNegativeBuff = function(){
    var buffId, buff;
    for(buffId in this.bufs){
        buff = this.bufs[buffId];
        if(buff.isNegative()){
            return true;
        }
    }
    return false;
};

/*
*   追击最终伤害
* */
pro.getPursueFinalHurt = function(orgHurt){
    var addPer = 0, addVal = 0;
    _.each(this.bufs, function(buff){
        addPer += buff.getPursueAddPer();
        addVal += buff.getPursueAddVal();
    });
    logger.debug('getPursueFinalHurt orgHurt = %s, addPer = %s, addVal = %s', orgHurt, addPer, addVal);
    return -1 * Math.max(0, Math.floor(Math.abs(orgHurt) * (1 + addPer) + addVal));
};
/*
 *   检查身上是否有指定类型的BUF
 * */
pro.haveBufByType = function(type){
    var buffId, buff;
    for(buffId in this.bufs){
        buff = this.bufs[buffId];
        if(buff.getType() === type){
            return true;
        }
    }
    return false;
};

/*
 *   暴击加成百分比
 * */
pro.getCritIncPercent = function(){
    var total = 0;
    _.each(this.bufs, function(buff){
        total += buff.getCritIncPercent();
    });
    return total;
};

/*
 *   暴击率增减
 * */
pro.getGrowCritPro = function(critPro){
    var total = 0;
    _.each(this.bufs, function(buff){
        total += buff.getGrowCritPro(critPro);
    });
    return total;
};

/*
 *   命中率加成
 * */
pro.getGrowHitPro = function(hitPro){
    var total = 0;
    _.each(this.bufs, function(buff){
        total += buff.getGrowHitPro(hitPro);
    });
    return total;
};

pro.getBuffsByType = function(type){
    var result = [],
        i, buff;
    for(i = 0; i < this.bufListById.length; ++i){
        buff = this.bufListById[i];
        if(buff.getType() === type){
            result.push(buff);
        }
    }
    return result;
};

/*
 *   护盾抵消伤害
 *   @param {Number} orgHurt
 *   @return {Number} hurt left.
 * */
pro.reduce = function(orgHurt){
    var total = orgHurt, i, buff;
    for(i = 0; i < this.bufListById.length; ++i){
        buff = this.bufListById[i];
        total = buff.reduce(total);
        if(total <= 0){
            break;
        }
    }
    return total;
};

/*
*   计算DOT 加/减成后的伤害
* */
pro.getDotFinalHurt = function(orgHurt){
    var additionPer = 0,
        additionVal = 0;
    _.each(this.bufs, function(buff){
        additionPer += buff.getDotAdditionPer();
        additionVal += buff.getDotAdditionVal();
    });
    return -1 * Math.max(0, Math.floor(Math.abs(orgHurt) * (1 + additionPer) + additionVal));
};

/*
*   计算多倍伤害 buff 作用后的伤害
* */
pro.getMultiHurt = function(orgHurt){
    var addPer = 0,
        addVal = 0;
    _.each(this.bufs, function(buff){
        if(buff.mayMultiHurt()){
            addPer += buff.getAddPer();
            addVal += buff.getAddVal();
        }
    });
    logger.debug('getMultiHurt orgHurt = %s, addPer = %s, addVal = %s', orgHurt, addPer, addVal);
    return -1 * Math.max(0, Math.floor(Math.abs(orgHurt) * (1 + addPer) + addVal));
};

/*
*   多人斩增加属性
* */
pro.addMultiCutProps = function(hitCnt){
    _.each(this.bufs, function(buff){
        buff.addMultiCutProps(hitCnt);
    });
};

/*
 *   多人斩移除属性
 * */
pro.clearMultiCutProps = function(){
    _.each(this.bufs, function(buff){
        buff.clearMultiCutProps();
    });
};

/*
*   计算调整最终伤害 buff 作用后的最终伤害
* */
pro.getFinalHurt = function(orgHurt){
    var addPer = 0,
        addVal = 0;
    _.each(this.bufs, function(buff){
        addPer += buff.getAdjustAddPer();
        addVal += buff.getAdjustAddVal();
    });
    logger.debug('getFinalHurt orgHurt = %s, addPer = %s, addVal = %s', orgHurt, addPer, addVal);
    return -1 * Math.max(0, Math.floor(Math.abs(orgHurt) * (1 + addPer) + addVal));
};

/*
 *   反击
 * */
pro.counterStrike = function(us, enemies, curTick){
    var i, buff, effects = [];
    for(i = 0; i < this.bufListById.length; ++i){
        buff = this.bufListById[i];
        effects = effects.concat(buff.strike(us, enemies, curTick));
    }
    return effects;
};

module.exports = BufferManager;
