/**
 * Created with JetBrains WebStorm.
 * User: kilua
 * Date: 13-10-15
 * Time: 下午2:03
 * To change this template use File | Settings | File Templates.
 */

var util = require('util');

var _ = require('underscore'),
    logger = require('log4js').getLogger(__filename);

var Entity = require('./entity'),
    skill = require('../battle/skill'),
    Consts = require('../consts'),
    dataApi = require('../../data/dataApi'),
    BufferManager = require('../battle/buffer/bufferManager'),
    SkillManager = require('../battle/skillManager'),
    utils = require('../utils/utils'),
    GrowStatManager = require('./growStatManager');

function onAddBuf(buff){
    if(buff.skill.type === Consts.SKILL_TYPE.ADD_PROP){
        // 属性加减 buff
        buff.addProps();
    }
}

function onRemoveBuf(buff){
    if(buff.skill.type === Consts.SKILL_TYPE.ADD_PROP){
        // 属性变更BUF，在移除BUF的时候，须恢复BUF携带者的相关属性
        buff.clearProps();
    }
}

var Character = function(opts){
    Entity.call(this, opts);
    this.rndManager = opts.rndManager;
    this.loadSvrData(opts);
    this.loadPropData(opts);
    this.addTotal = new GrowStatManager();          // 装备和天赋的属性加成管理器
    this.init();
    this.pomelo = opts.pomelo;
    this.buffMgr = new BufferManager(this);
    this.on('addBuf', onAddBuf);
    this.on('removeBuf', onRemoveBuf);
};

util.inherits(Character, Entity);

var pro = Character.prototype;

/*
 *   设置AI控制器
 * */
pro.setController = function(controller){
    this.controller = controller;
};

pro.checkRebirth = function(){
    var i, buff,
        rebirth = false,
        rebirthBuffs = this.buffMgr.getBuffsByType(Consts.SKILL_TYPE.REBIRTH);
    for(i = 0; i < rebirthBuffs.length; ++i){
        buff = rebirthBuffs[i];
        if(buff.mayRebirth()){
            rebirth = true;
            break;
        }
    }
    logger.debug('checkRebirth entityId = %s, rebirth = %s', this.entityId, rebirth);
    if(rebirth){
        this.rebirth(buff.getRebirthHp());
    }
    return rebirth;
};

pro.setLastAttacker = function(attacker){
    // 最近一个对自身使用普通伤害和负面buff技能的对象
    this.lastAttacker = attacker;
};

pro.getValK = function(){
    var props = dataApi.playerProperties.findBy('Lv', this.level);
    if(props && props.length > 0){
        return props[0].valK;
    }
    return 0;
};

pro.getDecHurtPercent = function(k){
    var d = this.getDef();
    k = k || this.getValK();
    if(d + k * 0.75 <= 1){
        d = -1 * k * 0.75 + 1;
    }
    return Math.min(d / (d + k), 0.7);
};

pro.getAllSkills = function(){
    return this.skillMgr.allSkills;
};
/*
 *  根据种族，由力量、敏捷、智力计算攻击力
 * */
pro._getAtk = function(){
    switch(this.race){
        case Consts.RACE.HUMAN:
            //人族：攻击=int（（力量*0.5+智力*2+敏捷*0.5）* 攻击系数 ）
            return (this.getPow() * 0.5 + this.getIQ() * 2 + this.getAgi() * 0.5) * this.atkRatio;
        case Consts.RACE.DEMON:
            //魔族：攻击=int（（力量*2+智力*0.5+敏捷*0.5）* 攻击系数 ）
            return(this.getPow() * 2 + this.getIQ() * 0.5 + this.getAgi() * 0.5) * this.atkRatio;
        case Consts.RACE.FAIRY:
            //精灵：攻击=int（（力量*0.5+智力*0.5+敏捷*2）* 攻击系数 ）
            return (this.getPow() * 0.5 + this.getIQ() * 0.5 + this.getAgi() * 2) * this.atkRatio;
        case Consts.RACE.NONE:
            //无种族：攻击=int（（力量*1+智力*1+敏捷*1）* 攻击系数 ）
            return (this.getPow() + this.getIQ() + this.getAgi()) * this.atkRatio;
        default:
            return 0;
    }
};

/*
 *   由敏捷计算防御力
 * */
pro._getDef = function(){
    //防御=int（（敏捷*1）* 防御系数 ）
    return Math.floor(this.getAgi() * this.defRatio);
};

/*
*   获取受击标准值
* */
pro.getHitStdVal = function(){
    var rows = dataApi.criLevel.findBy('lv', this.level);
    if(rows.length === 1){
        return rows[0].staVal;
    }
    logger.error('getHitStdVal 0 or more than 1 row found for level %s!', this.level);
    return 0;
};

/*
*   获取闪避
* */
pro._getDuck = function(){
    //闪避=int（（智力*1+敏捷*0.2）* 闪避系数 ）
    return Math.floor((this.getIQ() + this.getAgi() * 0.2) * this.duckRatio);
};

/*
*   获取闪避对照值
* */
pro.getDuckCmp = function(){
    var duck = this.getDuck(),
        zone = dataApi.criLevel.findZoneBy('staEva', duck),
        low, high;
    if(zone.length <= 0){
        logger.error('getDuckCmp criLevel empty!');
        return 0;
    }
    low = zone[0];
    high = zone[1];
    if(low.staEva === high.staEva){
        return low.compare;
    }
    return ((duck - low.staEva)/(high.staEva - low.staEva) * (high.compare2 - low.compare2) + low.compare2);
};

/*
*   获取闪避率
* */
pro._getDuckPro = function(hitStdVal){
    hitStdVal = hitStdVal || this.getHitStdVal();
    if(hitStdVal === 0){
        // 出错了，让它无限闪避
        return 1;
    }
    var duckCmp = this.getDuckCmp();
    return Math.min(duckCmp / (duckCmp + hitStdVal), 0.7);
};

/*
*   获取是否闪避
* */
pro.isDuck = function(hitStdVal){
    return (this.rndManager.getActorRndFloat(this.entityId, 'duckPro') < this.getDuckPro(hitStdVal)) ? 1 : 0;
};
/*
 *   获取暴击
 * */
pro._getCrit = function(){
    //暴击=int（（力量*0.2+智力*1）* 暴击系数 ）
    return Math.floor((this.getPow() * 0.2 + this.getIQ()) * this.critRatio);
};

/*
*   获取暴击对照值
* */
pro.getCritCmp = function(){
    var crit = this.getCrit(),
        zone = dataApi.criLevel.findZoneBy('staCri', crit),
        low, high;
    if(zone.length <= 0){
        logger.error('getCritCmp criLevel empty!');
        return 0;
    }
    low = zone[0];
    high = zone[1];
    if(low.staCri === high.staCri){
        return low.compare;
    }
    return ((crit - low.staCri)/(high.staCri - low.staCri) * (high.compare - low.compare) + low.compare);
};

/*
 *   获取能力等级
 * */
pro.getAbilityLV = function(){
    return this.initAbilityLV + this.level;
};

pro.getLevelAbilityData = function(abilityLV){
    var levelDatas = dataApi.cardLevelProperty.findBy('Lv', abilityLV);

    if(!levelDatas || levelDatas.length !== 1){
        logger.error('getLevelAbilityData Lv = %s not found!', abilityLV);
        return null;
    }
    return levelDatas[0];
};

pro.getQualityCoe = function(quality){
    var qualityCoes = dataApi.qualityCoe.findBy('Qua', quality);
    if(!qualityCoes || qualityCoes.length !== 1){
        logger.error('getQualityCoe Qua = %s not found!', quality);
        return;
    }
    return qualityCoes[0].coe;
};

/*
*   初始化力、智、敏等基础属性
* */
pro.initBaseProps = function(){
    // 子类实现
};

/*
 *   初始化力量、敏捷、智力
 * */
pro.init = function(){
    //从卡牌标准等级能力表中获得对应的力量、智力、敏捷，然后乘以卡牌的品质系数得到卡牌属性值。（即计算出力量*卡牌品质系数、智力*卡牌品质系数、敏捷值*卡牌品质系数）
    this.initBaseProps();
    this.clearGrowProps();
    // 此时还没有任何 buff
    this.baseMaxHP = this.getMaxHP();
    this.baseAtk = this.getAtk();
    this.baseDef = this.getDef();
    this.baseDuck = this.getDuck();
    this.baseDuckPro = this.getDuckPro();
    this.baseCrit = this.getCrit();
};

pro.clearGrowProps = function(){
    this.growPow = 0;
    this.growIQ = 0;
    this.growAgi = 0;
    this.growHP = 0;
    this.growAtk = 0;
    this.growDef = 0;
    this.growDuck = 0;
    this.growDuckPro = 0;
    this.growCrit = 0;

    // 清除天赋增加的属性
    this.addTotal.statsByName.gift.clear();
};

pro.getPow = function(){
    return this.addTotal.get(this.pow, 'growPow') + this.growPow;
};

pro.getIQ = function(){
    return this.addTotal.get(this.IQ, 'growIQ') + this.growIQ;
};

pro.getAgi = function(){
    return this.addTotal.get(this.agi, 'growAgi') + this.growAgi;
};

pro._getMaxHP = function(){
//    无种族：血量=int（（力量*24+敏捷*12）* 生命系数  ）
//    人族：血量=int（（力量*25.2+敏捷*10.8）* 生命系数  ）
//    魔族：血量=int（（力量*21.6+敏捷*14.4）* 生命系数  ）
//    精灵：血量=int（（力量*23.4+敏捷*12.6）* 生命系数  ）
    switch(this.race){
        case Consts.RACE.NONE:
            return (this.getPow() * 8 + this.getAgi() * 4) * this.hpRatio;
        case Consts.RACE.HUMAN:
            return (this.getPow() * 8.4 + this.getAgi() * 3.6) * this.hpRatio;
        case Consts.RACE.DEMON:
            return (this.getPow() * 7.2 + this.getAgi() * 4.8) * this.hpRatio;
        case Consts.RACE.FAIRY:
            return (this.getPow() * 7.8 + this.getAgi() * 4.2) * this.hpRatio;
    }
};

pro.getMaxHP = function(){
    return Math.floor(this.addTotal.get(this._getMaxHP(), 'growHP') + this.growHP);
};

pro.getAtk = function(){
    return Math.floor(this.addTotal.get(this._getAtk(), 'growAtk') + this.growAtk);
};

pro.getDef = function(){
    return this.addTotal.get(this._getDef(), 'growDef') + this.growDef;
};

pro.getDuck = function(){
    return this.addTotal.get(this._getDuck(), 'growDuck') + this.growDuck;
};

pro.getDuckPro = function(hitStdVal){
    return this.addTotal.get(this._getDuckPro(hitStdVal), 'growDuckPro') + this.growDuckPro;
};

pro.getCrit = function(){
    return this.addTotal.get(this._getCrit(), 'growCrit') + this.growCrit;
};

pro.getCritPro = function(hitStdVal){
    var baseCritPro = Math.min(this.getCritCmp() / hitStdVal, 1);
    return this.addTotal.get(baseCritPro, 'growCritPro');
};

/*
 *   计算天赋加成的总固定值和百分比
 * */
pro.addGiftGrowProps = function(giftAdds){
    this.addTotal.add('gift', giftAdds);
};

/*
 *   计算天赋最大数量
 *   @param {Object} giftStat    gift stat data like {'1': ?, '2': ?}
 * */
pro.getGiftMax = function(giftStat){
    var maxGift = 0;
    this.gifts.forEach(function(gift){
        if(giftStat[gift] > maxGift){
            maxGift = giftStat[gift];
        }
    });
    return maxGift;
};

/*
 *   获取激活的天赋数据，并按升序排列
 *   @param {Object} giftStat    gift stat data like {'1': ?, '2': ?}
 *   @return {Array} a list of active gift data sort by 'reqCount' in ascending order.
 * */
pro.getActiveGifts = function(giftStat){
    var maxGift = this.getGiftMax(giftStat),
        giftDatas = dataApi.gift.findBy('cardGroupId', this.groupId),
        results = _.filter(giftDatas, function(giftData){
            return (giftData.reqCount <= maxGift);
        });
    return _.sortBy(results, function(elem){
        return elem.reqCount;
    });
};

pro.applyGiftGrowProps = function(giftStat){
    var activeGifts = this.getActiveGifts(giftStat);
    logger.debug('applyGiftGrowProps id = %s, giftStat = %j, activeGifts.length = %s', this.entityId, giftStat, activeGifts.length);
    // 没有天赋加成
    if(activeGifts.length <= 0){
        return;
    }
    this.addGiftGrowProps(activeGifts);
    // 须重算hp
    this.hp = this.getMaxHP();
};

pro.addEquipGrowProps = function(equipGrowProps){
    this.addTotal.add('equip', [equipGrowProps]);
    // 须重算hp
    var orgHP = this.hp;
    this.hp = this.getMaxHP();
    logger.debug('addEquipGrowProps entityId = %s, orgHP = %s, hp = %s', this.entityId, orgHP, this.hp);
};

pro.applyAllEquipProps = function(player){
    var pos, equipObj;
    for(pos = Consts.ARM_POS.MAGIC_BOOK; pos < Consts.ARM_POS.MAX; ++pos){
        if(!player.equipBag){
            logger.debug('applyAllEquipProps no equipBag');
            return;
        }
        equipObj = player.equipBag.getEquipByPos(this.groupId, pos);
        if(!equipObj){
            logger.debug('applyAllEquipProps no equip groupId = %s, pos = %s', this.groupId, pos);
            continue;
        }
        this.addEquipGrowProps(equipObj.getGrowProps());
    }
};
/*
*   加载策划表的属性数据
* */
pro.loadPropData = function(opts){
    this.initAbilityLV = opts.FLv;
    this.name = opts.Name;
    this.hpRatio = opts.Hp;
    this.atkRatio = opts.Atk;
    this.defRatio = opts.Def;
    this.critRatio = opts.Cri;
    this.duckRatio = opts.Eva;
    this.race = opts.race;
    this.quality = opts.Qua;
    this.npcType = opts.Type;
    this.groupId = opts.GroupID;                // 卡牌所属组ID
    this.gifts = utils.parseParams(opts.gifts);
};

/*
*   加载服务器端下发的数据
* */
pro.loadSvrData = function(opts) {
    this.dataId = opts.dataId;
    this.level = opts.level;
    this.hp = opts.hp;
    this.skillMgr = new SkillManager(this, opts.skills, this.rndManager, this.getQualityCoe(opts.Qua));
    this.pos = opts.pos;
    logger.debug('load random creators entityId = %s', this.entityId);
};

pro.getSkillByKind = function(kind){
    return this.skillMgr.getSkillByKind(kind);
};

pro.autoSelectSkill = function(tick){
    return this.skillMgr.autoSelect(tick);
};

pro.startAllSkillCD = function(tick){
    this.skillMgr.startAllCD(tick);
};

/*
*   上场前
* */
pro.beforeEnterField = function(tick){
    _.each(this.skillMgr.skillsByKind, function(mainSkill){
        // 光环技能，开场不开始CD，立即可以使用
        if(mainSkill.isAura()){
            return;
        }
        mainSkill.startCD(tick - Math.floor(mainSkill.restoreTime * 0.5));
    });
};

pro.isDead = function(){
    return (this.hp === 0);
};

pro.clear = function(){

};

pro.toJSON = function(){
    var parentInfo = Entity.prototype.toJSON.call(this),
        info = {
            dataId: this.dataId,
            type: this.type,
            level: this.level,
            hp: this.hp,
            maxHP: this.getMaxHP(),
            pos: this.pos,
            skills: this.skillMgr.toJSON()
        };
    return _.extend(parentInfo, info);
};

pro.setHp = function(hp){
    if(this.isDead()){
        return;
    }
    this.hp = Math.min(Math.max(hp, 0), this.getMaxHP());
    if(this.isDead()){
        this.emit('onDead', this);
    }
};

pro.rebirth = function(curHp){
    logger.debug('rebirth entityId = %s, curHp = %s', this.entityId, curHp);
    this.hp = Math.min(Math.max(curHp, 0), this.getMaxHP());
    this.buffMgr.clear();
};

pro.addBuf = function(buf, tick, act, cb){
    return this.buffMgr.addBuf(buf, tick, act, cb);
};

pro.processBufs = function(tick, act){
    if(this.isDead()){
        return [];
    }
    return this.buffMgr.process(tick, act);
};

pro.getBufferInfo = function(){
    return this.buffMgr.getInfo();
};

/*
 *   暴击加成百分比
 * */
pro.getCritIncPercent = function(){
    return this.buffMgr.getCritIncPercent();
};

pro.getGrowCritPro = function(critPro){
    return this.buffMgr.getGrowCritPro(critPro);
};

pro.getGrowHitPro = function(hitPro){
    return this.buffMgr.getGrowHitPro(hitPro);
};

pro.getDotFinalHurt = function(orgHurt){
    return this.buffMgr.getDotFinalHurt(orgHurt);
};

module.exports = Character;