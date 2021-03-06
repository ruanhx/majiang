cc.Class({
    extends: cc.Component,
    properties: {
        account:null,
	    userId:null,
		userName:null,
		lv:0,
		exp:0,
		coins:0,
		gems:0,
		sign:0,
        ip:"",
        sex:0,
        roomData:null,
        
        oldRoomId:null,
    },
    
    guestAuth:function(){
        var account = cc.args["account"];
        if(account == null){
            account = cc.sys.localStorage.getItem("account");
        }
        
        if(account == null){
            account = Date.now();
            cc.sys.localStorage.setItem("account",account);
        }
        this.account = account;
        this.login();
        // cc.vv.http.sendRequest("/guest",{account:account},this.onAuth);
    },
    
    onAuth:function(ret){
        var self = cc.vv.userMgr;
        if(ret.errcode !== 0){
            console.log(ret.errmsg);
        }
        else{
            self.account = ret.account;
            self.sign = ret.sign;
            cc.vv.http.url = "http://" + cc.vv.SI.hall;
            self.login();

        }   
    },
    
    login:function(){
        var self = this;
        var onLogin = function(ret){
            // if(ret.code != 200){
            //     console.log(ret.errmsg);
            // }
            // else{
                // cc.vv.pomeloNet.login("127.0.0.1",3014,self.account,"123456", function (ret) {
                //     cc.log('login ret:', ret);
                // });

                if(!ret||!ret.userid){
                    //jump to register user info.
                    cc.director.loadScene("createrole");
                }
                else{
                    console.log(ret);
                    self.account = ret.account;
        			self.userId = ret.userid;
        			self.userName = ret.playername;
        			// self.lv = ret.lv;
        			// self.exp = ret.exp;
        			self.coins = ret.coins;
        			self.gems = ret.gems;
                    self.roomData = ret.roomId;
                    self.sex = ret.sex;
                    self.ip = ret.ip;
                    // cc.vv.net.login("127.0.0.1",3014,self.account,"123456", function (ret) {
                    //     cc.log('login ret:', ret);
                    // });
        			cc.director.loadScene("hall");
                }
            // }
        };
        cc.vv.wc.show("正在登录游戏");
        // cc.vv.http.sendRequest("/login",{account:this.account,sign:this.sign},onLogin);
        this.pomeloLogin(this.account,onLogin);
    },
    
    pomeloLogin:function(account,cb){
        // 启动网络连接  
        var acc = account;
        var pwd = "123456";
        // var url = "139.199.179.171";
        var url = "127.0.0.1";
        var port = 3014;
        var self = this;
        pomelo.init({
            host : url,
            port : port
        }, function () {
            var route = 'gate.gateHandler.queryEntry';
            pomelo.request(route, {uid:acc}, function (data) {
                cc.log("####%j",data);
                if(data.code==200){
                    pomelo.init({
                        host : data.host,
                        port : data.port
                    }, function () {
                    var route = 'connector.entryHandler.entry';
                    pomelo.request(route, {MAC:acc,password:"123456"}, function (data) {
                        cc.log("connector:%j",data);
                        if(data.code ==200){
                            pomelo.request('area.playerHandler.enterScene',{},function(result){
                                cc.log("###enterScene#%j",result);
                                cb(result.curPlayer);
                            })
                        }else{
                            cb(data);
                        }
                        
                    })
                })
                }
                
            });
            pomelo.on("player.updateProp", function (data) {
                console.log("player.updateProp %j", data);
                if(data.prop == 'roomId'){
                    self.roomData = data.value;
                }
                if(data.prop == 'gem'){
                    self.gems = data.value;
                }
            });
        });
     },



    create:function(name){
        var self = this;
        var onCreate = function(ret){
            if(ret.code !== 200){
                console.log(ret.errmsg);
            }
            else{
                self.login();
            }
        };
        
        var data = {
            account:this.account,
            pwd:"123456",
            name:name
        };
        // cc.vv.http.sendRequest("/create_user",data,onCreate);    
        pomelo.request("connector.roleHandler.createPlayer",data,onCreate);
    },
    
    enterRoom:function(roomId,callback){
        var self = this;
        var onEnter = function(ret){
            if(ret.code != 200){
                console.log("######enterRoom error : %s",ret.code);
                if(ret.code == 104){
                    cc.vv.alert.show("提示", "房间已满!");
                }
            }
            else{
                cc.vv.userMgr.roomData = roomId;
                cc.vv.wc.hide();
                if(callback != null){
                    callback(ret);
                }
                console.log("######enterRoom");
                cc.director.loadScene("prepare");
                // cc.vv.gameNetMgr.connectGameServer(ret);
            }
        };
        
        var data = {
            playerId:cc.vv.userMgr.userId,
            sign:cc.vv.userMgr.sign,
            id:roomId,
            playerName:cc.vv.userMgr.userName
        };
        cc.vv.wc.show("正在进入房间 " + data);
        // cc.vv.http.sendRequest("/enter_private_room",data,onEnter);
        pomelo.request('area.roomHandler.enterRoom',data,onEnter);
    },
    getHistoryList:function(callback){
        var self = this;
        var onGet = function(ret){
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                console.log(ret.history);
                if(callback != null){
                    callback(ret.history);
                }
            }
        };
        
        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
        };
        cc.vv.http.sendRequest("/get_history_list",data,onGet);
    },
    getGamesOfRoom:function(uuid,callback){
        var self = this;
        var onGet = function(ret){
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                console.log(ret.data);
                callback(ret.data);
            }
        };
        
        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            uuid:uuid,
        };
        cc.vv.http.sendRequest("/get_games_of_room",data,onGet);
    },
    
    getDetailOfGame:function(uuid,index,callback){
        var self = this;
        var onGet = function(ret){
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                console.log(ret.data);
                callback(ret.data);
            }       
        };
        
        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            uuid:uuid,
            index:index,
        };
        cc.vv.http.sendRequest("/get_detail_of_game",data,onGet);
    }
});
