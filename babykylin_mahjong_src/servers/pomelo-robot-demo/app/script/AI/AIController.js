/**
 * Created with JetBrains WebStorm.
 * User: kilua
 * Date: 13-10-16
 * Time: 下午7:59
 * To change this template use File | Settings | File Templates.
 */

var log4js = require('log4js'),
    loggerForAct = log4js.getLogger('act'),
    _ = require('underscore');

var useSkill = require('../battle/useSkill'),
    cmds = require('../netHandler'),
    Consts = require('../consts');

var AIController = function(owner){
    this.owner = owner;
};

var pro = AIController.prototype;

pro.useSkills = function(skills, act, tick, pomelo){
    var self = this,
        recs = [];
    _.each(skills, function(skillObj){
        var report = useSkill.useMainSkill(self.owner, skillObj, act, tick);
        if(report && report.getActionCnt() > 0){
            // 提交本次执行动作的信息
            if(!Consts.BATCH_REPORT){
                cmds.useSkill(pomelo, report, function(data){
                    if(data.code !== 200){
                        loggerForAct.error('useSkills server response error skill.id = %s, code = %s!', skillObj.id, data.code);
                    }
                });
            }
            recs.push({useSkill: report.getData()});
        }
    });
    return recs;
};

pro.checkUseSkills = function(act, tick, pomelo){
    var hero = this.owner;
    if(hero.isDead()){
//        loggerForAct.debug('run player is dead!!!');
        return [];
    }
    if(hero.buffMgr.haveBufByType(Consts.SKILL_TYPE.DAZE)){
//        loggerForAct.debug('run dazing...');
        return [];
    }
    if(hero.buffMgr.haveBufByType(Consts.SKILL_TYPE.PETRIFY)){
//        loggerForAct.debug('run petrified...');
        return [];
    }
    // 选择技能.
    return this.useSkills(hero.autoSelectSkill(tick), act, tick, pomelo);
};

pro.run = function(act, tick, pomelo){

};

module.exports = AIController;