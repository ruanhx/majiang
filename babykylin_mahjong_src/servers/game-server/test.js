/**
 * Created by Administrator on 2017/10/29.
 */
var _ = require('underscore');
this.member = [];
this.member.push({memberId:1,memberName:"111",isReady:false});
this.member.push({memberId:2,memberName:"222",isReady:false});
this.member.push({memberId:3,memberName:"333",isReady:false});
var player = _.find(this.member,function (num) {
    return num.memberId = 1;
});
console.error("####%j",this.member);
player.isReady = true;
console.error("####%j",this.member);