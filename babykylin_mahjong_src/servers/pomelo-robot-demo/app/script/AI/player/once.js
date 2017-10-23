/**
 * Created with JetBrains WebStorm.
 * User: kilua
 * Date: 13-10-16
 * Time: 下午7:56
 * To change this template use File | Settings | File Templates.
 */

/*
*   按顺序检测技能攻击范围，一旦检测到有技能可以攻击到怪物，立即发动该技能
* */
var util = require('util');

var AIController = require('../AIController');

var Once = function(owner){
    AIController.call(this, owner);
};

util.inherits(Once, AIController);

var pro = Once.prototype;

pro.run = function(act, tick, pomelo){
    return this.checkUseSkills(act, tick, pomelo);
};

module.exports = Once;
