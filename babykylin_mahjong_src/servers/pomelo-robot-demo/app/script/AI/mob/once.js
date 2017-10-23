/**
 * Created with JetBrains WebStorm.
 * User: kilua
 * Date: 13-10-17
 * Time: 下午1:52
 * To change this template use File | Settings | File Templates.
 */

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