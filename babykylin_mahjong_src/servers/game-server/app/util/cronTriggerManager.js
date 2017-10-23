/**
 * Created by employee11 on 2015/12/12.
 */
var cronTrigger = require('../domain/area/cronTrigger');

var exp = module.exports = {};

function loadCronTriggers(app){
    var crons = app.get('crons'),
        cronsList, i, cron, trigger,
        triggers = {};
    if(!!crons){
        cronsList = crons[app.serverType];
        //console.log(cronsList);
        if(!!cronsList){
            for(i = 0; i < cronsList.length; ++i){
                cron = cronsList[i];
                trigger = cronTrigger.createTrigger(cron.time);
                trigger.args = cron.args;
                triggers[cron.id] = trigger;
            }
        }
    }
    return triggers;
}

var CronTriggerManager = function(app){
    this.app = app;
    this.triggers = loadCronTriggers(app);
};

CronTriggerManager.prototype.getTriggerById = function(cronId){
    if(!!this.triggers){
        return this.triggers[cronId];
    }
    return null;
};

exp.int = function(app){
    return new CronTriggerManager(app);
};
