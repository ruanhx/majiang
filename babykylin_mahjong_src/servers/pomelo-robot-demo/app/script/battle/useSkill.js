/**
 * Created with JetBrains WebStorm.
 * User: kilua
 * Date: 13-10-17
 * Time: 上午10:01
 * To change this template use File | Settings | File Templates.
 */

var util = require('util');

var log4js = require('log4js'),
    logger = log4js.getLogger(__filename),
    _ = require('underscore');

var Consts = require('../consts'),
    formula = require('../formula'),
    dataApi = require('../../data/dataApi'),
    utils = require('../../../mylib/utils/lib/utils'),
    Hit = require('./report/hit'),
    actionManager = require('./report/actionManager');

var useSkill = module.exports = {};

var raceAtkMap = {};
raceAtkMap[Consts.RACE.NONE] = '';
raceAtkMap[Consts.RACE.HUMAN] = 'humanAtk';
raceAtkMap[Consts.RACE.FAIRY] = 'fairyAtk';
raceAtkMap[Consts.RACE.DEMON] = 'demonAtk';
useSkill.getPlayerAtk = function(attacker, defender){
    if(attacker.type === Consts.ENTITY_TYPE.PLAYER){
        var propertyName = raceAtkMap[defender.race];
        if(!propertyName){
//            throw new Error(util.format('no mapped property name found!race = %s', defender.race));
            // 2013.10.15 吴冰说要容错
            logger.error('no mapped property name found!type = %s, dataId = %s, race = %s', defender.type
                , defender.dataId, defender.race);
            return 0;
        }
        return attacker[propertyName];
    }else{
        return 0;
    }
};

/*
 *   计算防御力
 * */
var raceDefMap = {};
raceDefMap[Consts.RACE.NONE] = '';
raceDefMap[Consts.RACE.HUMAN] = 'humanDef';
raceDefMap[Consts.RACE.FAIRY] = 'fairyDef';
raceDefMap[Consts.RACE.DEMON] = 'demonDef';
useSkill.getDefense = function(defender, attacker){
    if(defender.type === Consts.ENTITY_TYPE.PLAYER){
        var propName = raceDefMap[attacker.race];
        if(!propName){
//            throw new Error(util.format('no mapped property name found!race = %s', attacker.race));
            logger.error('no mapped property found!type = %s, dataId = %s, race = %s', attacker.type, attacker.dataId
                , attacker.race);
            // 2013.10.15 吴冰说要容错
            return 0;
        }
        return defender[propName];
    }else{
        return 0;   // 卡牌和怪物没有防御力
    }
};

/*
 *   卡牌(怪)和目标种族相克系数
 *   人类克精灵，精灵克恶魔，恶魔克人类；同族不相克；目标无种族不相克。
 * */
function getCardVSTargetRaceRestrictRatio(card, target){
    var targetRace = target.race || 0
        , cardRace = card.race || 0;
    // 卡牌种族属性必定不为0
    return Consts.RACE_RESTRICT_MAP[cardRace][targetRace] * Consts.RACE_RESTRICTION;
}

function getRaceAtk(attacker, card){
    if(attacker.type === Consts.ENTITY_TYPE.PLAYER){
        var propName = raceAtkMap[card.race];
        if(!propName){
            logger.error('getRaceAtk no mapped atk found!race = %s', card.race);
            return 0;
        }
        return attacker[propName];
    }else{
        return 0;
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function removeAttachBuffs(actionMgr, mainSkill, act){
    _.each(actionMgr.actions, function(action){
        var subSkill = mainSkill.getSkillById(action.skillId);
        if(subSkill && subSkill.isAttach()){
            _.each(action.hits, function(hit){
                if(hit.addBuf){
                    var target = act.getEntityById(hit.entityId);
                    if(target){
                        target.buffMgr.removeBuf(hit.addBuf.id, true/*屏蔽发包*/);
                    }
                }
            });
        }
    });
}

function selectTargets(mainSkill, user, us, enemies, curTick){
    // 先选择主技能的目标，因为子技能可能跟随主技能
    var targetsBySkillId = {};
    targetsBySkillId[mainSkill.id] = mainSkill.select(user, us, enemies, curTick).sort(function(a, b){ return (a.entityId - b.entityId); });
//    logger.debug('selectTargets user %j, us = %j, enemies = %j, mainSkill %s targets %j', user, us, enemies,
//        mainSkill.id, targetsBySkillId[mainSkill.id]);
    // 再选择子技能的目标
    _.each(mainSkill.chainSkills, function(subSkill){
        // 主技能已选择过，忽略
        if(subSkill.id === mainSkill.id){
            return;
        }
        targetsBySkillId[subSkill.id] = subSkill.select(user, us, enemies, curTick, targetsBySkillId[mainSkill.id],
            mainSkill.targetPrior).sort(function(a, b){ return (a.entityId - b.entityId); });
    });
    return targetsBySkillId;
}

useSkill.useMainSkill = function(user, mainSkill, act, tick){
    var actionMgr = actionManager.create(user.entityId, tick),
        us = act.getUs(user),
        enemies = act.getEnemies(user);
    actionMgr.skillId = mainSkill.id;
    actionMgr.bufs.addBatch(user.getBufferInfo());
    // 统一先选好目标
    var targetsBySkillId = selectTargets(mainSkill, user, us, enemies, tick);
    _.each(mainSkill.chainSkills, function(simpleSkill){
        // 和服务器端一样按 entityId 排序是为了产生的随机数，能和服务器端保持一致
//        var targets = simpleSkill.select(user, us, enemies).sort(function(a, b){ return a.entityId - b.entityId; });
        var targets = targetsBySkillId[simpleSkill.id];
        // 技能开始CD
        simpleSkill.startCD(tick);
        if(targets.length > 0){
            var action = actionMgr.addAction(simpleSkill.id);
            _.each(targets, function(target){
                if(target.isDead()){
                    return;
                }
                simpleSkill.kind.use(user);
                var hit = simpleSkill.useAtTarget(act, user, target, tick, targets.length);
                action.addHit(hit);
            });
        }else{
            logger.debug('useMainSkill skill %s no targets found!', simpleSkill.id);
        }
    });
    actionMgr.hp = user.hp;
    // 删除单次生效 buff
    removeAttachBuffs(actionMgr, mainSkill, act);
    return actionMgr;
};