cc.Class({
    extends: cc.Component,

    properties: {
        playerPrefab:{
            default:null,
            type:cc.Prefab,
        },
    },

    // use this for initialization
    onLoad: function () {
        this.initRoomInfo();
        this.initPomelo();
        this.memberList = {};
    },

    initPomelo: function(){
        var self = this;
        pomelo.on('room.addMember',function(data){
            self.addChild(data);
        });
    },


    initRoomInfo: function () {
        var self = this;
        pomelo.request('area.roomHandler.getRoomInfo',{id:cc.vv.userMgr.roomData},function(res){
            cc.log("initRoomInfo: %j",res);
            res.info.member.forEach(function(data) {
                self.addChild(data);
            }, this);
        })
    },

    addChild: function(data){
        var prepare = this.node.getChildByName('prepare');
        if(prepare.childrenCount>=12){
            return;
        }
        var newNode = cc.instantiate(this.playerPrefab);
        var playerName = newNode.getChildByName('name');
        playerName.getComponent(cc.Label).string = data.memberName;
        if(data.memberId == cc.vv.userMgr.userId){
            var self = newNode.getChildByName('self');
            self.active = true;
        }
        if(data.isReady){
            var ready = newNode.getChildByName('ready');
            ready.active = true;
        }
        this.memberList[data.memberId] = newNode;
        prepare.addChild(newNode);
    },

    onButtonReady: function(){
        var self = this;
        pomelo.request('area.roomHandler.setReady',{id:cc.vv.userMgr.roomData},function(res){
            if(res.code ==200){
                var mySelf =  self.memberList[cc.vv.userMgr.userId];
                var ready = mySelf.getChildByName('ready');
                ready.active = true;
            }
        })
        
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        
    },
});
