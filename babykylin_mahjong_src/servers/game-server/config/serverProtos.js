/**
 * Created by employee11 on 2016/1/7.
 */

module.exports = {
    // 通知组队战斗开始
    "endless.startBattle": {
        // 无需参数
    },
    // 广播加载进度给其他队员
    "endless.onLoading": {
        // 队员角色id
        "optional uInt32 playerId": 1,
        // 进度百分比
        "optional byte percent": 2,
        // 当前时间
        "optional uInt32 tick": 3
    },
    // 解散队伍
    "disbandTeam": {
        // 无需参数
    },
    // 通知加载关卡
    "onLoadBarrier": {
        // 无需参数
    },
    // 通知关卡超时
    "barrierTimeout": {
        // 无需参数
    },
    // 更新队伍成员信息
    "onUpdateTeam": {
        // 成员角色id
        "optional uInt32 id": 1,
        // 成员入口服务器id
        "optional uInt32 frontendId": 2,
        // 名字
        "optional string name": 3,
        // 当前出战猎魔人
        "optional Hero hero": 4
    },
    // 猎魔人
    "message Hero": {
        // 位置
        "optional uInt32 pos": 1,
        // 猎魔人id，策划表heroId
        "optional uInt32 heroId": 2,
        // 等级
        "optional byte curLevel": 3,
        // 经验
        "optional uInt32 curExperience": 4,
        // 品质
        "optional byte quality": 5,
        // 技能列表
        "repeated Skill skills": 6,
        // 是否新
        "optional uInt32 isNew": 7
    },
    // 技能
    "message Skill": {
        // id
        "optional uInt32 id": 1,
        // 等级
        "optional uInt32 lv": 2
    },
    // 同步猎魔人伤害
    "syncHeroHurt": {
        // 角色id
        "optional uInt32 playerId": 1,
        // 伤害值
        "optional uInt32 hurtValue": 2,
        // 开始时间
        "optional uInt32 startTick": 3
    },
    // 使用技能
    "useSkill": {
        // 角色id
        "optional uInt32 playerId": 1,
        // 技能类型
        "optional byte skillType": 2,
        // 开始时间
        "optional uInt32 startTick": 3
    },
    // 同步角色位置
    "syncPlayerPos": {
        // 角色id
        "optional uInt32 playerId": 1,
        // 方向
        "optional byte direction": 2,
        // 角度
        "optional directionAngle directionAngle": 3,
        // 位置
        "optional point point": 4,
        // 时间
        "optional uInt32 tick": 5
    },
    // 坐标
    "message point": {
        // x������
        "optional uInt32 x": 1,
        // y������
        "optional uInt32 y": 2,
        // z������
        "optional uInt32 z": 3
    },
    // 角度
    "message directionAngle": {
        // 无需参数
    },
    // 跳跃
    "playerJump": {
        // 角色id
        "optional uInt32 playerId": 1,
        // 跳跃类型
        "optional byte jumpType": 2
    },
    // 使用buffer
    "useBuffer": {
        // 角色Id
        "optional uInt32 playerId": 1,
        // 属性类型
        "optional byte propType": 2,
        // 时间
        "optional uInt32 tick": 3
    },
    // 更新角色属性
    "player.updateProp": {
        // 属性名
        "optional string prop": 1,
        // 属性值
        "optional uInt32 value": 2
    },
    // 猎魔人背包格子更新
    "heroBag.update": {
        // 猎魔人
        "optional Hero bagData": 1
    },
    // 删除猎魔人
    "heroBag.remove": {
        // 位置
        "optional byte pos": 1
    },
    // 宠物
    "message Pet": {
        // 位置
        "optional uInt32 pos": 1,
        // 宠物id，策划表roleId
        "optional uInt32 petId": 2,
        // 等级
        "optional byte lv": 3,
        // 经验
        "optional uInt32 exp": 4,
        // 品质
        "optional byte quality": 5
    },
    // 宠物背包格子更新
    "petBag.update": {
        // 宠物
        "optional Pet bagData": 1
    },
    // 删除宠物
    "petBag.remove": {
        // 位置
        "optional byte pos": 1
    },
    // 物品背包更新
    "itemBag.update": {
        // 位置
        "optional uInt32 pos": 1,
        // 物品id
        "optional uInt32 itemId": 2,
        // 数量
        "optional uInt32 itemCount": 3
    },
	// 碎片背包更新
    "fragItemBag.update": {
        // 位置
        "optional uInt32 pos": 1,
        // 物品id
        "optional uInt32 itemId": 2,
        // 数量
        "optional uInt32 itemCount": 3
    },
    // 章节解锁
    "chapter.unlock": {
        // 章节id
        "optional uInt32 chapterId": 1,
        // 领取星级宝箱的标志位，1、2、4分别表示第1、2、3个宝箱已领取
        "optional uInt32 drawFlag": 2
    },
    // 已通关关卡更新
    "passedBarrier.update": {
        // 关卡id
        "optional uInt32 barrierId": 1,
        // 星级
        "optional uInt32 star": 2,
        // 攻打次数
        "optional uInt32 dailyTimes": 3,
        // 重置次数
        "optional uInt32 resetTimes": 4
    },
    // 商品购买记录
    "message GoodsBuyRecord": {
        // 商品id
        "optional uInt32 goodsId": 1,
        // 今日已购买次数
        "optional uInt32 dailyCnt": 2
    },
    // 刷新商店商品购买次数
    "playerShop.refreshBuyCount": {
        // 商品购买记录列表
        "repeated GoodsBuyRecord records": 1
    },
    // 商品表或商店表更新时通知客户端刷新
    "playerShop.refresh": {
        // 无参数
    },
    // 优惠商店物品信息
    "message DiscountShopItem": {
        // 商品id
        "optional uInt32 id": 1,
        // 商品类型
        "optional uInt32 type": 2,
        // 商品类型参数
        "optional uInt32 typeId": 3,
        // 每组数量
        "optional uInt32 unit": 4,
        // 购买次数限制
        "optional int32 max": 5,
        // 已购买次数
        "optional uInt32 buyCnt": 6,
        // 价格类型
        "optional uInt32 priceType": 7,
        // 购买价格
        "optional uInt32 price": 8,
        // 促销图片id
        "optional uInt32 pic": 9,
        // 原价
        "optional uInt32 priceOld": 10
    },
    // 活动内容
    "message ActivityDetail": {
        // 优惠商店商品列表
        "repeated DiscountShopItem items": 1
    },
    "activity.new": {
        // 活动id
        "optional uInt32 id": 1,
        // 活动名字
        "optional uInt32 name": 2,
        // 是否显示红点
        "optional uInt32 showRedSpot": 3,
        // 活动类型
        "optional uInt32 type": 4,
        // 活动说明
        "optional uInt32 desc": 5,
        // 活动内容
        "optional ActivityDetail detail": 6,
        // 剩余时间，单位毫秒
        "optional uInt32 leftTime": 7
    },
    // 推送活动删除
    "activity.remove": {
        // 活动id
        "optional uInt32 id": 1
    },
    // 要求重新获取列表
    "activity.relist": {
    },
    // 推送红点刷新
    "activity.refreshRedSpot": {
        // 活动id
        "optional uInt32 id": 1,
        // 是否显示红点,1或0
        "optional uInt32 showRedSpot": 2
    },
    // 装备信息
    "message Equip": {
        // 装备在背包中的位置
        "optional uInt32 pos": 1,
        // 装备数据id
        "optional uInt32 dataId": 2,
        // 装备强化等级
        "optional uInt32 lv": 3,
        // 是否新
        "optional uInt32 isNew": 4

    },
    // 已装备格子刷新
    "armBag.refresh": {
        // 装备部位
        "optional uInt32 part": 1,
        // 装备信息
        "optional Equip equip": 2,
        // 装备精炼等级
        "optional uInt32 refineLV": 3,
        // 当前精炼值
        "optional uInt32 refineExp": 4,
        // 觉醒等级
        "optional uInt32 wakeUpLV": 5,
        // 强化等级
        "optional uInt32 strengthenLV": 6
    },
    // 总榜更新
    "scoreRankingList.update": {
        // 玩家id
        "optional uInt32 playerId": 1,
        // 得分
        "optional uInt32 score": 2,
        // 排名
        "optional uInt32 rank": 3,
        // 名字
        "optional string name": 4,
        // 头像id
        "optional uInt32 headPicId": 5,
        // 出战猎魔人id
        "optional uInt32 heroId": 6
    },
    // 周榜更新
    "weekScoreRankingList.update": {
        // 玩家id
        "optional uInt32 playerId": 1,
        // 得分
        "optional uInt32 score": 2,
        // 排名
        "optional uInt32 rank": 3,
        // 名字
        "optional string name": 4,
        // 头像id
        "optional uInt32 headPicId": 5,
        // 出战猎魔人id
        "optional uInt32 heroId": 6
    },
    // 段位榜更新
    "RankingList.update": {
        // 玩家id
        "optional uInt32 playerId": 1,
        // 得分
        "optional uInt32 score": 2,
        // 排名
        "optional uInt32 rank": 3,
        // 名字
        "optional string name": 4,
        // 头像id
        "optional uInt32 headPicId": 5,
        // 出战猎魔人id
        "optional uInt32 heroId": 6,
        // 排行榜类型
        "optional uInt32 type": 7
    },
    // 总榜奖励发放时，推送
    "scoreRankingList.award": {
        // 奖励排名
        "optional uInt32 rank": 1,
        // 是否已领取
        "optional uInt32 drew": 2
    },
    // 周榜奖励发放时，推送
    "weekScoreRankingList.award": {
        // 奖励排名
        "optional uInt32 rank": 1,
        // 是否已领取
        "optional uInt32 drew": 2
    },
    // 无尽加成刷新推送
    "endlessBuff.refresh": {
        // 加成数据id
        "optional uInt32 dataId": 1,
        // 已拥有个数
        "optional uInt32 cnt": 2,
        // 已拥有次数
        "optional uInt32 buyCnt": 3
    },
    // 无尽赛事记录推送
    "endlessOccasion.refresh": {
        // 赛事数据id
        "optional uInt32 occasionId": 1,
        // 今日已挑战次数
        "optional uInt32 dailyCnt": 2,
        // 连胜次数
        "optional uInt32 maxWin": 3,
        // 连败次数
        "optional uInt32 maxLose": 4,
        //购买次数
        "optional uInt32 dailyBuyCnt": 5,
        //赛事挑战次数
        "optional uInt32 totalCnt": 6,
    },
    // 觉醒背包更新
    "wakeUpBag.update": {
        // 位置
        "optional uInt32 pos": 1,
        // 物品id
        "optional uInt32 itemId": 2,
        // 数量
        "optional uInt32 itemCount": 3
    },
    // 装备背包移除装备
    "equipBag.remove": {
        // 位置
        "optional uInt32 pos": 1
    },
    // 装备背包更新
    "equipBag.update": {
        "optional Equip bagData": 1
    },
    // 无尽PVP匹配对手
    "message MatchPlayer": {
        // 角色ID，机器人无此字段
        "optional uInt32 playerId": 1,
        // 角色名字
        "optional string name": 2,
        // 当前出战猎魔人id
        "optional uInt32 fightHeroId": 3,
        // 当前出战宠物id
        "optional uInt32 fightPetId": 4,
        // 当前战力
        "optional uInt32 power": 5,
        // 得分加成
        "optional double scorePer": 6,
        // 玩家方是否会赢，对手机器人才有此字段
        "optional uInt32 result": 7,
        // 机器人预期输的话，将在此关卡退出
        "optional uInt32 failBattleId": 8,
        // 复活次数
        "optional uInt32 reviveCnt": 9,
        // 是否是机器人
        "optional uInt32 isRobot": 10,
        // 机器人姓氏
        "optional string familyName":11,
    },
    // 无尽PVP匹配成功
    "endless.matchSuccess": {
        "optional MatchPlayer target": 1,
        "optional uInt32 code": 2
    },

    // 掉落
    "message Drop": {
        // 掉落类型
        "optional uInt32 dropType": 1,
        // 掉落子类型或物品id
        "optional uInt32 itemId": 2,
        // 数量
        "optional uInt32 count": 3
    },
    // 无尽模式结算
    "endless.evaluate": {
        // 胜利或失败
        "optional uInt32 result": 1,
        // 对方得分
        "optional uInt32 otherScore": 2,
        // 参赛奖励
        "repeated Drop presentAwards": 3,
        // 获胜奖励
        "repeated Drop winAwards": 4,
        // 对方获胜奖励
        "repeated Drop otherWinAwards": 5,
        // 对方参赛奖励
        "repeated Drop otherPresentAwards": 6,
        // 无尽战斗id
        "optional string endlessId": 7
    },
    // 更新无尽PVP模式战斗中已复活次数
    "endless.updateReviveCnt": {
        "optional uInt32 reviveCnt": 1
    },
	 //充值表刷新
    "playerReacharge.refresh": {
         // 无参数
    },
	
	//任务成就信息
	"message MissionInfo": {
		//任务成就进度
		"optional uInt32 progress": 1,
		"optional uInt32 conditionType": 2 ,
		"optional uInt32 missionType": 3,
		"optional uInt32 groupType": 4,
		//已领取的成就记录（成就id）（数组）
		"repeated json drewList": 5
	},
	"Mission.reset":{
		//任务成就列表
		"optional MissionInfo missions": 1		
	},
	"Mission.refresh":{
		//任务成就列表
		"optional MissionInfo mission": 1		
	},

    //充值成功
	"order.tips":{
         //产品id
		"optional string productId": 1,
         //当前产品已经购买的次数 包含本次
		"optional uInt32 buyCnt": 2,
         //获得的游戏币
		"optional uInt32 getMoney": 3,
         //增送的游戏币
		"optional uInt32 getAwardMoney": 4	
	},
	// 推送邮箱更新
    "mail.new": {},
	
	 //推送碎片刷新
    "fragItemBag.update": {
        // 位置
        "optional uInt32 pos": 1,
        // 物品id
        "optional uInt32 itemId": 2,
        // 数量
        "optional uInt32 itemCount": 3
    },

    //小游戏次数更新推送
    "miniGameJoinCnt.update":{
        // 小游戏id
        "optional uInt32 gameId": 1,
        // 数量
        "optional uInt32 count": 2
    },
    //段位升级奖励推送
    "endless.divisionLevelUp":{
        "repeated Drop drops": 1,
    },

    "message rollingInfo": {
        //任务成就进度
        "optional string playerName": 1,
        "optional uInt32 content": 2 ,
        //参数  [{type:0,value:100,dropType:Consts.DROP_TYPE}] 0是真实值，1是程序字
        "repeated string value": 3,
    },
    //跑马灯推送
    "rollingInformation.push":{
        // 小游戏id
        "optional rollingInfo info": 1,
        // 类型 0 普通跑马灯 1 系统公告
        "optional uInt32 type": 1
    },
    // 玩家刷新值
    "playerRefresh.push":{
        // 玩家ID
        "optional uInt32 playerId": 1,
        // 助战随机boss次数
        "optional uInt32 assistRandBossCount": 2,
        // 玩家攻打自己的随机boss冷却时间
        "optional uInt32 playerRandBossCoolTime": 3,
        // 玩家助战随机boss冷却时间
        "optional uInt32 assistRandBossCoolTime": 4
    },

    //随机boss信息
    "message BarrierRandBossInfo": {
        //所在的关卡id
        "optional uInt32 barrierId": 1 ,
        //冷却时间点
        "optional uInt32 coolTime": 2 ,
        //创建时间
        "optional uInt32 createTime": 3,
        //剩余血
        "optional uInt32 currHp": 4,
        //已经攻打次数
        "optional uInt32 atkCnt": 5,
        //随机bossid
        "optional uInt32 randomBossId": 6,
        //玩家Id
        "optional uInt32 playerId": 7,
        //玩家名字
        "optional string playerName": 8,
        //胜利次数
        "optional uInt32 winCnt": 9,
        //是否分享过
        "optional uInt32 hasShare": 10,
    },

    //推送好友的随机boss
    "randBoss.push":{
        //随机boss信息
        "optional BarrierRandBossInfo barrierRandBoss": 1,
    },
    // 助战好友信息
    "message assistInfo": {
        // 玩家id
        "optional uInt32 playerId": 1,
        // 价格
        "optional uInt32 price": 2,
        // 角色名
        "optional string playername": 3,
        // 头像id
        "optional uInt32 headPicId": 4,
        // 出战猎魔人id,即数据id
        "optional uInt32 heroId": 5,
        // 战斗力
        "optional uInt32 highPower": 6,
    },
    //推送助战好友信息
    "assistFight.push":{
        //随机boss信息
        "optional assistInfo info": 1,
    },

    //训练模块信息
    "message TrainVO": {
        //训练值
        "optional uInt32 trainValue": 2 ,
        //免费加速次数
        "optional uInt32 freeCnt": 3,
        //免费加速次数
        "optional uInt32 costCnt": 4,
        //已经攻打次数
        "optional long lastSetValTime": 5,
        //下次免费的时间点
        "optional long nextFreeTime": 6,
        //点击剩余次数
        "optional uInt32 clickRemainCnt": 7,
        //点击冷却结束时间
        "optional long clickCoolEndTime": 8,
    },
    //推送训练模块信息
    "train.trainVO":{
        "optional TrainVO trainVO": 1,
    },
    // 首次购买英雄
    "buyHero.firstBuy":{
        "optional uInt32 configId": 1,
        "optional uInt32 buyCount": 2,
        "optional uInt32 hasDraw": 3
    },
    // 好友红点
    "friends.new":{
        "optional uInt32 type": 1,
    },

    // 段位更改推送
    "endless.divisionUpdate":{
        //段位
        "optional uInt32 divisionId": 1,
        //段位积分
        "optional uInt32 divScore": 2,
    },
    // 无尽挑战系统聊天推送信息
    "message endlessChatInfo":{

        // 无尽赛事数据id
        "optional uInt32 occasionId": 1,
        // 玩家战斗力
        "optional uInt32 power": 2,
        // 无尽挑战匹配状态 0还未有人应战 1已经有人应战
        "optional uInt32 status": 3,
        // 无尽挑战玩家Id
        "optional uInt32 endlessPlayerId": 4,
    },

    // 推送聊天消息
    "chat.push": {
        // 频道
        "optional uInt32 channel": 1,
        // 发送方角色ID
        "optional uInt32 senderId": 4,
        // 发送方昵称
        "optional string senderName": 5,
        // 聊天内容
        "optional string content": 6,
        // 时间
        "optional uInt32 time": 7,
        // 发送者段位
        "optional uInt32 senderDivision": 8,
        // 发送者卡
        "optional uInt32 senderCard": 10,
        // 发送头像
        "optional uInt32 senderHeadPicId": 10,
        // 消息类型 0普通消息  1无尽挑战消息
        "optional uInt32 type": 11,
        // 无尽挑战系统聊天推送信息
        "optional endlessChatInfo endlessInfo": 12,
    },
    // 无尽模式 应战
    "chat.acceptEndlessBattle":{
        // 无尽挑战玩家Id
        "optional uInt32 playerId": 1
    },

    //聊天频道限制参数
    "message ChannelInfo":{
        "optional uInt32 channel" : 0,//频道Id
        "optional long nextReset" : 0,//下次重置时间
        "optional uInt32 sendCount" : 0//时间内发送次数
    },
    //聊天每个限制参数
    "chat.playerData":{
        "repeated ChannelInfo info" : 0,//下次重置时间
    },
    //消息结构体
    "massage ChatMsg":{
        // 频道
        "optional uInt32 channel": 1,
        // 发送方角色ID
        "optional uInt32 senderId": 4,
        // 发送方昵称
        "optional string senderName": 5,
        // 聊天内容
        "optional string content": 6,
        // 时间
        "optional uInt32 time": 7,
        // 发送者段位
        "optional uInt32 senderDivision": 8,
        // 发送者卡
        "optional uInt32 senderCard": 10,

        // 消息类型 0普通消息  1无尽挑战消息
        "optional uInt32 type": 12,
        // 无尽赛事数据id
        "optional uInt32 occasionId": 13,
        // 玩家战斗力
        "optional uInt32 power": 14,
    },
    //消息列表
    "chat.msgList":{
        "repeated ChatMsg infoList" : 0
    },
    //无尽乱斗使用道具
    "endless.useItem":{
        //使用的道具ID
        "optional uInt32 itemId": 1,
    },

    // 关卡商店数据[dropid, priceOld，price，priceType]
    "message PromoteData": {
        // 掉落id
        "optional uInt32 dropId": 1,
        // 原价
        "optional uInt32 priceOld": 2,
        // 现价
        "optional uInt32 price": 3,
        // 货币类型
        "optional uInt32 priceType": 4
    },

    "barrierPromote.update":{
        // 章节id
        "optional uInt32 chapterId": 1,
        // 商店数据
        "repeated PromoteData barrierPromoteDropIds":2,
        // 到期时间
        "optional long barrierPromoteEndTick": 3,
        // 是否领取
        "optional uInt32 drew": 4,
    },
};
