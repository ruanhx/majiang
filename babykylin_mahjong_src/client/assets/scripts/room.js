var async = require('async');
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
        this.memberBySeat = {};
        this.guis = [];
        this.beginBtn = this.node.getChildByName('beginBtn');
        this.readyTitle = this.node.getChildByName('readyTitle');
        this.zhanGuiButton = this.node.getChildByName('zhanGuiButton');
        this.zhuoGuiButton = this.node.getChildByName('zhuoGuiButton');
        this.checkDrankBtn = this.node.getChildByName('checkDrankBtn');
        this.chooseButton = this.node.getChildByName('chooseButton');
        this.dice1 = this.node.getChildByName('dice1');
        this.dice2 = this.node.getChildByName('dice2');
        this.shoot = this.node.getChildByName('shootAni');
        this.readyBtn = this.node.getChildByName('ready');
        // this.zhanguiBtn = this.node.getChildByName('zhanguiBtn');
        this.guiText = this.node.getChildByName('gui');
        this.prepare = this.node.getChildByName('prepare');
        // this.zhanGuiButton.active = false;
    },

    initPomelo: function(){
        var self = this;

        pomelo.on('room.addMember',function(data){
            cc.log("addMember: %j",data);
            self.addChild(data);
        });

        pomelo.on('room.dingGui',function(data){
            cc.log("dingGui: %j",data);
            var values = _.values(self.memberList);
            _.each(values,function(num){
                var ready = num.getChildByName('ready');
                ready.active = false;
            });
            self.guis = data.gui;
            
            self.playShoot(data.gui,function(){
                var guiString = " " + data.gui[0];
                if(data.gui.length ==2){
                    guiString = guiString + "     " + data.gui[1];
                }
                self.guiText.getComponent(cc.Label).string = "本轮鬼:" + guiString;
                cc.log("zhanGuiButton.active");
                self.zhanGuiButton.active = true;
            });
        });

        pomelo.on('room.setReady',function(data){
            var mySelf =  self.memberList[data.playerId];
            var ready = mySelf.getChildByName('ready');
            if(data.isReady){
                ready.active = true;
                // self.readyBtn.active = false;
            }else{
                ready.active = false;
                // self.readyBtn.active = true;
            }
           
        });

        pomelo.on('room.zhangui',function(data){
            cc.log("zhangui: %j",data);
            
            var mySelf =  self.memberBySeat[data.seat];
            if(mySelf){
                var gui1 = mySelf.getChildByName('gui1');
                gui1.active = true;
                gui1.getComponent(cc.Label).string = data.craps[0];
                if(_.contains(self.guis,data.craps[0])){
                    gui1.color = new cc.Color(255, 0, 0);
                }
                if(data.craps.length ==2){
                    var gui2 = mySelf.getChildByName('gui2');
                    gui2.active = true;
                    gui2.getComponent(cc.Label).string = data.craps[1];
                    if(_.contains(self.guis,data.craps[1])){
                        gui2.color = new cc.Color(255, 0, 0);
                    }
                }
            }

        });

        pomelo.on('room.zhuogui',function(data){
            cc.log("zhuogui: %j",data);
            self.readyTitle.getComponent(cc.Label).string = "捉鬼开始~";
            if(self.index == data.trun){
                self.zhuoGuiButton.active = true;
            }else if(self.zhuoGuiButton.active == true){
                self.zhuoGuiButton.active = false;
            }
        });
        // 捉鬼
        pomelo.on('room.dranks',function(data){
            cc.log("room.dranks: %j",data);

            
            self.zhuoGuiButton.active = false;
            // 房主显示清酒按钮
            if(self.ownerId == cc.vv.userMgr.userId){
            self.checkDrankBtn.active = true;
            }
            var craps = data.craps;
            var dranks = data.dranks;
            self.playShoot(craps,function(){
                cc.log("room.dranks3: %j,%j",craps,dranks);
                self.zhanGuiButton.active = false;
                self.readyTitle.getComponent(cc.Label).string = "等待房主确认是否有欠酒~";
                var keys = _.keys(dranks);
                _.each(keys,function(key){
                    var player =  self.memberBySeat[key];
                    cc.log("room.dranks2:%j,%s,%j",self.memberBySeat,key,keys);
                    var drank = player.getChildByName('drank');
                    drank.active = true;
                    var drankLabel = drank.getChildByName('bei');
                    drankLabel.getComponent(cc.Label).string = dranks[key] + "杯";
                })
            });
        });
        // 结束
        pomelo.on('room.zhuoguiEnd',function(data){
            
            self.readyTitle.getComponent(cc.Label).string = "游戏结束，喝酒量统计~";
            var keys = _.keys(data.totalDranks);
            _.each(keys,function(key){
                var player =  self.memberBySeat[key];
                var drank = player.getChildByName('drank');
                drank.active = true;
                var drankLabel = drank.getChildByName('bei');
                drankLabel.getComponent(cc.Label).string = data.totalDranks[key] + "杯";
            })
        });

        // 对子
        pomelo.on('room.pair',function(data){
            self.zhuoGuiButton.active = false;
            self.playShoot(data.craps,function(){
                self.zhanGuiButton.active = false;
                self.readyTitle.getComponent(cc.Label).string = "指定一个人喝酒~";
                self.chooseButton.active = true;
            });
        })

    },


    initRoomInfo: function () {
        var self = this;
        pomelo.request('area.roomHandler.getRoomInfo',{id:cc.vv.userMgr.roomData},function(res){
            cc.log("initRoomInfo: %j",res);
            res.info.member.forEach(function(data) {
                self.addChild(data);
            }, this);
            self.ownerId = res.info.ownerId;
            if(res.info.ownerId == cc.vv.userMgr.userId){
                cc.log("res.ownerId: %s ,%s",res,cc.vv.userMgr.userId);
                self.beginBtn.active = true;
            }
        })
    },
    // 占鬼按钮
    onZhanGuiButton: function(){
        var self = this;
        pomelo.request('area.roomHandler.zhanGui',{id:cc.vv.userMgr.roomData,index:self.index},function(res){
            cc.log("onZhanGuiButton: %j",res);
            self.zhanGuiButton.active = false;
            self.dice2.active = false;
            self.dice1.active = false;
        })
    },
    // 指定玩家喝
    onChooseButton: function(){
        var self = this;
        pomelo.request('area.roomHandler.chooseDrank',{id:cc.vv.userMgr.roomData,index:self.choosePlayerId},function(res){
            cc.log("area.roomHandler.chooseDrank: %j",res);
            if(res.code == 105){
                cc.vv.alert.show("提示", "只能指定一个玩家");
            }
            if(res.code == 200){
                var values = _.values(self.memberList);
                _.each(values,function(num){
                    var otherChoose = num.getChildByName('choose');
                    if(otherChoose.active){
                       otherChoose.active = false;
                    }
                });
                self.chooseButton.active = false;
            }
            
        })
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
    //确认是否清酒
    onCheckDrankButton: function(){
        var self = this;
        pomelo.request('area.roomHandler.checkDrank',{id:cc.vv.userMgr.roomData},function(res){
            cc.log("checkDrank: %j",res);
            if(res.code == 200){
                self.checkDrankBtn.active = false;
                // 重置喝酒标识
            var values = _.values(self.memberList);
            _.each(values,function(num){
                var drank = num.getChildByName('drank');
                drank.active = false;
            });
            }
            
        })
    },

    onZhuoGuiButton: function(){
        var self = this;
        
        pomelo.request('area.roomHandler.zhuoGui',{id:cc.vv.userMgr.roomData,index:self.index},function(res){
            cc.log("zhuoGui: %j",res);
            if(res.code ==200){
                self.beginBtn.active = false;
            }
        })
    },

    playShoot: function(guis,cb){
        cc.log("playShoot###");
        var self = this;
        this.dice1.active = false;
        this.shoot.active = true;
        var anim = this.shoot.getComponent(cc.Animation);
        
        var animState = anim.play('shoot');
        
        // 设置动画循环次数为2次
        animState.repeatCount = 5;
        var onFinish = function(){
            self.shoot.active = false;
            self.dice1.active = true;
            cc.loader.loadRes("textures/zhuogui/"+guis[0]+".png", cc.SpriteFrame, function (err, spriteFrame) {
                self.dice1.getComponent(cc.Sprite).spriteFrame = spriteFrame;
                anim.off('finished',onFinish,self);
                cb();
            });
        }
        anim.on('finished', onFinish,this);
        // anim.off('finished',{},this);
        if(guis.length ==2){
            var shoot2 = this.node.getChildByName('shootAni2');
            shoot2.active = true;
            // var dice2 = this.node.getChildByName('dice2');
            self.dice2.active = false;
            var anim2 = shoot2.getComponent(cc.Animation);
            anim2.on('finished', function(){
                shoot2.active = false;
                self.dice2.active = true;
                cc.loader.loadRes("textures/zhuogui/"+guis[1], cc.SpriteFrame, function (err, spriteFrame) {
                    self.dice2.getComponent(cc.Sprite).spriteFrame = spriteFrame;
                });
            },this);
            var animState2 = anim2.play('shoot');
            // 设置动画循环次数为2次
            animState2.repeatCount = 5;
        }
        
    },

    onbuttonTest: function () {
        var self = this;
        var guis = [];
        guis.push(2);
        guis.push(3);
        async.series({
            one: function(callback){
                self.playShoot(guis,function(){
                    cc.log("onbuttonTest###");
                    callback(null,1);
                });
                // callback(null, 1);
            },
            two: function(callback){
                var guiString = " " + guis[0];
                if(guis.length ==2){
                    guiString = guiString + "     " + guis[1];
                }
                self.guiText.getComponent(cc.Label).string = "本轮鬼:" + guiString;
                
                self.zhanGuiButton.active = true;
                callback(null, 2);
            }
        },function(err, results) {
            console.log(results);
        });

    },

    onSort : function(){
        this.prepare.sortAllChildren();
    },

    addChild: function(data){
        if(this.prepare.childrenCount>=12){
            return;
        }
        var newNode = cc.instantiate(this.playerPrefab);
        var playerName = newNode.getChildByName('name');
        playerName.getComponent(cc.Label).string = data.memberName;
        if(data.memberId == cc.vv.userMgr.userId){
            var self = newNode.getChildByName('self');
            self.active = true;
            this.index = data.index;
            if(data.isReady){
                this.readyBtn.active = false;
            }
        }
        if(data.isReady){
            var ready = newNode.getChildByName('ready');
            ready.active = true;
        }
        var self = this;
        // newNode.setZOrder(this.index);
        // 点击事件
        newNode.on(cc.Node.EventType.TOUCH_END, function (event) {
             console.log('touch down');
             var values = _.values(self.memberList);
             _.each(values,function(num){
                 var otherChoose = num.getChildByName('choose');
                 if(otherChoose.active){
                    otherChoose.active = false;
                 }
             });
             var choose = newNode.getChildByName('choose');
             console.log('touch down index:%s',newNode.getLocalZOrder());
             self.choosePlayerId = newNode.getLocalZOrder();
             if(choose.active){
                choose.active = false;
             }else{
                choose.active = true;
             }
             
        }, this);
        this.memberList[data.memberId] = newNode;
        this.memberBySeat[data.index] = newNode;
        this.prepare.addChild(newNode,data.index);
    
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
