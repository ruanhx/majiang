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
        this.beginBtn = this.node.getChildByName('beginBtn');
        this.shootButton = this.node.getChildByName('shootButton');
        this.dice1 = this.node.getChildByName('dice1');
        this.shoot = this.node.getChildByName('shootAni');
        this.readyBtn = this.node.getChildByName('ready');
        this.shootButton.active = false;
    },

    initPomelo: function(){
        var self = this;
        pomelo.on('room.addMember',function(data){
            cc.log("addMember: %j",data);
            self.addChild(data);
        });

        pomelo.on('room.dingGui',function(data){
            cc.log("dingGui: %j",data);
            self.playShoot(data.gui);
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
    onShootButton: function(){
        // var data = {
        //     id:cc.vv.userMgr.roomData
        // };
        // pomelo.request('area.roomHandler.test',data,function(data){

        // });
    },

    onBeginButton: function(){
        var self = this;
        pomelo.request('area.roomHandler.gameBegin',{id:cc.vv.userMgr.roomData},function(res){
            cc.log("onBeginButton: %j",res);
            if(res.code ==200){
                self.beginBtn.active = false;
            }
        })
    },

    playShoot: function(guis){
        var self = this;
        this.dice1.active = false;
        this.shoot.active = true;
        var anim = this.shoot.getComponent(cc.Animation);
        
        var animState = anim.play('shoot');
        
        // 设置动画循环次数为2次
        animState.repeatCount = 5;
        
        anim.on('finished', function(){
            self.shoot.active = false;
            self.dice1.active = true;
            cc.loader.loadRes("textures/zhuogui/"+guis[0]+".png", cc.SpriteFrame, function (err, spriteFrame) {
                self.dice1.getComponent(cc.Sprite).spriteFrame = spriteFrame;
            });
        },this);
        if(guis.length ==2){
            var shoot2 = this.node.getChildByName('shootAni2');
            shoot2.active = true;
            var dice2 = this.node.getChildByName('dice2');
            dice2.active = false;
            var anim2 = shoot2.getComponent(cc.Animation);
            anim2.on('finished', function(){
                shoot2.active = false;
                dice2.active = true;
                cc.loader.loadRes("textures/zhuogui/"+guis[1]+".png", cc.SpriteFrame, function (err, spriteFrame) {
                    dice2.getComponent(cc.Sprite).spriteFrame = spriteFrame;
                });
            },this);
            var animState2 = anim2.play('shoot');
            // 设置动画循环次数为2次
            animState2.repeatCount = 5;
        }
        
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
                self.readyBtn.active = false;
            }
        })
        
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        
    },
});
