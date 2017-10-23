/**
 * Created by lishaoshen on 2015/10/9.
 */

var _ = require('underscore');

var loader = require('./loader');

var dataModules = loader.load(__dirname + '../../../game-server/config/data'),
    parsers = loader.load(__dirname + '/rowParser');


var exp = module.exports = {};
exp.modules = {};
_.each(dataModules, function (dataMod, name) {
    Object.defineProperty(exp, name, {
        get: (function (name) {
            return function () {
                var mod = this.modules[name];
                if (!mod && parsers[name]) {
                    mod = this.modules[name] = parsers[name](dataMod);
                }
                return mod;
            }
        })(name)
    });
});
