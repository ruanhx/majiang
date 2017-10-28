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

    },

    addChild: function(){
        var prepare = this.node.getChildByName('prepare');
        if(prepare.childrenCount>=12){
            return;
        }
        var newNode = cc.instantiate(this.playerPrefab);
        var playerName = newNode.getChildByName('name');
        playerName.getComponent(cc.Label).string = '这个这个';
        
        prepare.addChild(newNode);
    },

    setReady: function(){
        
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        
    },
});
