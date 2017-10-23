/**
 * Created by kilua on 2016/6/24 0024.
 */

var util = require('util');

var IndexData = require('../jsonTable');

var HeroSkillLock = function (data) {
    IndexData.call(this, data);
};

util.inherits(HeroSkillLock, IndexData);

var pro = HeroSkillLock.prototype;

pro.rowParser = function (row) {
    return row;
};

pro.getPrimaryKey = function () {
    return 'type';
};

pro.getUnlockQua = function(type)
{
    var data = this.findById(type);
    if(!!data)
    {
        return data.unlockQua;
    }
    return 1;
}
module.exports = function (data) {
    return new HeroSkillLock(data);
};