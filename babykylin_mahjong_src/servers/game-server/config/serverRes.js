/**
 * Created by employee11 on 2016/1/7.
 */

module.exports = {
    // 查询入口
    "gate.gateHandler.queryEntry": {
        "optional short code": 1,
        // 入口服务器id
        "optional string host": 2,
        // 入口服务器端口
        "optional uInt32 port": 3
    },
    // 登录
    "connector.entryHandler.entry": {
        "optional short code": 1
    },
    // 创角
    "connector.roleHandler.createPlayer": {
        "optional short code": 1
    },
    // 心跳
    "connector.heartHandler.clientHeart": {
        // 无需参数
    },
    // 同步时间给客户端
    "connector.heartHandler.syncClientTime": {
        // 服务器当前时间
        "optional long time": 1
    },
    // 装备信息
    "message Equip": {
        // 装备在背包中的位置
        "optional uInt32 pos": 1,
        // 装备数据id
        "optional uInt32 dataId": 2,
        // 装备强化等级
        "optional uInt32 lv": 3,
		// 装备品质
        "optional uInt32 quality": 4,
        // 是否新
        "optional uInt32 isNew": 5
    },
    // 装备格子信息
    "message ArmSlot": {
        // 装备在背包中的位置
        "optional uInt32 part": 1,
        // 精炼等级
        "optional uInt32 refineLV": 2,
        // 精炼经验
        "optional uInt32 refineExp": 3,
        // 装备信息
        "optional Equip equip": 4,
        // 觉醒等级，0-59
        "optional uInt32 wakeUpLV": 5,
        // 强化等级
        "optional uInt32 strengthenLV": 6
    },
    // 无尽加成信息
    "message EndlessBuff": {
        // 加成项数据id
        "optional uInt32 dataId": 1,
        // 已拥有数量
        "optional uInt32 cnt": 2,
        // 已购买次数
        "optional uInt32 buyCnt": 3
    },
    // 无尽赛事记录
    "message EndlessOccasion": {
        // 赛事数据id
        "optional uInt32 occasionId": 1,
        // 已挑战次数
        "optional uInt32 dailyCnt": 2,
        // 已购买次数
        "optional uInt32 dailyBuyCnt": 3
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

    "message BarrierPromote":{
        // 章节id
        "optional uInt32 chapterId": 1,
        // 商店数据
        "repeated PromoteData barrierPromoteDropIds":2,
        // 到期时间
        "optional long barrierPromoteEndTick": 3,
        // 是否领取
        "optional uInt32 drew": 4,
    },
	//已经购买英雄数据configId":101,"hasDraw"
	"message HasBuyHero": {
        // 已经购买的id，角色表的id
        "optional uInt32 configId": 1,
        // 是否已经领取奖励 1=已经领取，0=未领取
        "optional uInt32 hasDraw": 2,
        // 购买次数
        "optional uInt32 buyCount": 3
    },
	
    // 角色初始化数据
    "message PlayerInitData": {
        // 名字
        "optional string playerName": 1, 
        // 等级
        "optional uInt32 roleLevel": 2,
        // 头像id
        "optional byte headPicId": 3,
        // 当前经验
        "optional uInt32 exp": 4,
        // vip等级
        "optional uInt32 VIPLevel": 5,
        // 当前体力
        "optional uInt32 energy": 6,
        // 最大体力
        "optional uInt32 maxEnergy": 7,
        // 金币
        "optional uInt32 goldCnt": 8,
        // 钻石
        "optional uInt32 diamondCnt": 9,
        // 总充值金额
        "optional uInt32 totalRechargeNum": 10,
        // 最后一次发放体力时间
        "optional long dispatchEnergyTime": 11,
        // 购买体力次数
        "optional byte buyEnergyCnt": 12,
        // 已通关列表
        "repeated PassedBarrier passedBarrierMap": 13,
        // 当前出战猎魔人
        "optional Hero curHero": 14,
        // 当前出战宠物
        "optional Pet curPet": 15,
        // 已解锁章节列表
        "repeated unlockChapter unlockChapters": 16,
        // 背包物品列表
        "repeated Item itemBag": 17,
        // 猎魔人列表
        "repeated Hero heroBag": 18,
        // 宠物列表
        "repeated Pet petBag": 19,
        // 已购买猎魔人的id列表，HeroAttribute表的id字段
        "repeated HasBuyHero hasBuyHeroIds": 20,
        // 装备仓库，已按格子顺序排列。这个是获得装备时放入的背包，不是已装备装备的背包。已装备的装备已过滤掉(可能导致格子不连续)，不会出现在这里
        "repeated Equip equipBag": 21,
        // 已装备装备
        "repeated ArmSlot armBag": 22,
        // 剩余免费精炼次数
        "optional uInt32 dailyFreeRefine": 23,
        // 剩余钻石精炼次数
        "optional uInt32 dailyDiamondRefine": 24,
        // 竞技点
        "optional uInt32 comPoint": 25,
        // 熔炼值
        "optional uInt32 meltPoint": 26,
        // 无尽加成信息
        "repeated EndlessBuff endlessBuffs": 27,
        // 无尽赛事记录
        "repeated EndlessOccasion endlessOccasions": 28,
        // 觉醒材料
        "repeated Item wakeUpBag": 29,
        // 洗练石
        "optional uInt32 washPoint": 30,
        // 历史最高得分
        "optional uInt32 highScore": 31,
        // 本周最高得分
        "optional uInt32 weekHighScore": 32,
        // 装备成就数据列表
        "repeated EquipAchievedItem equipAchievedList": 33,
		//任务成就数据列表
		"repeated MissionInfo missionList": 34,
		//玩家id
		 "optional uInt32 playerId": 35,
        //当前出战的兄弟英雄
        "optional string currBrotherHeroPoss": 36,
		//每日无尽产出英雄数量
        "optional uInt32 dailyEndlessBoxToHeroCnt": 37,
		"optional uInt32 rechargeTotal": 38, 
		"optional uInt32 fristRechargeAwardTime": 39, 
		//修改名字次数
		"optional uInt32 setNameCnt": 40,
		//邀请码id		
		"optional uInt32 inviteId": 41, 
		//已邀请人数
		"optional uInt32 inviteCount": 42, 
		//我的邀请码
		"optional uInt32 inviteCode": 43, 
		//无尽历史最高波次
		"optional uInt32 endlessSingleOldWave": 44, 
		//随机boss信息
		"optional BarrierRandBossInfo barrierRandBoss": 45, 
		//* 随机商店的关闭时间 ：为0没有随机商店 、大于当前时间 表示商店已经关闭
		"optional uInt32 randomShopCloseTime": 46, 	
		//随机商店刷新券
		"optional uInt32 randRefreshCoin": 47,
		//挑战券		
		"optional uInt32 challengeTicket": 48	,
		// 碎片列表
        "repeated Item fragBag": 49,
		//10 青铜币
		"repeated uInt32 bronzeCoin": 50,
		 //11 白银币
		"repeated uInt32 silverCoin": 51,
		 //12 黄金币
		"repeated uInt32 goldCoin": 52, 
		 //单抽次数
		"repeated uInt32 snatchSingleCnt": 53,
        //周卡结束时间
        "repeated uInt32 weekCardEndTick": 54,
        //月卡结束时间
        "repeated uInt32 monthCardEndTick": 55,
        //永卡结束时间
        "repeated uInt32 foreverCardEndTick": 56,
        //周卡领取福利时间
        "repeated uInt32 weekCardWelfareTick": 57,
        //月卡领取福利时间
        "repeated uInt32 monthCardWelfareTick": 58,
        //永久卡领取福利时间
        "repeated uInt32 foreverCardWelfareTick": 59,
        //关卡推销
        "repeated BarrierPromote barrierPromoteList": 60,
        // //关卡进度推销的掉落id
        // "repeated PromoteData barrierPromoteDropIds": 60,
        // //关卡推销结算时间
        // "repeated uInt32 barrierPromoteEndTick": 61,
        //创建角色时间
        "optional uInt32 createTime": 61,
		//玩家已经获得过的英雄 角色表中的heroId
        "repeated uInt32 heroHistorys": 62,
		//无尽历史最高关卡
		"optional uInt32 endlessSingleHighBarr": 63,
        //免费夺宝冷却结束时间
        "optional uInt32 freeSnatchSingeEndTick": 64,
        //金币试炼挑战次数
        "optional uInt32 dailyActGoldChallenge": 65,
        //经验试炼挑战次数
        "optional uInt32 dailyActExpChallenge": 66,
        //道具试炼挑战次数
        "optional uInt32 dailyActItemChallenge": 67,
        //抓宝排行分数
        "optional uInt32 catchHighScore": 68,
        //抓宝钥匙
        "optional uInt32 catchKey": 69,
        //武装核心
        "optional uInt32 heroCore": 70,
        //抓宝历史最高
        "optional uInt32 catchHighScoreHistotry": 71,
        //抓宝参与次数
        "optional string miniGameJoinCnt": 72,
        //抓宝参与次数
        "optional string canFetchFirstBuy": 73,
        //活动副本
        "repeated ActEctypeDetail activityEctype":74,
        //特殊活动表
        "repeated S7Activity s7Activity":75,
        //登录天数
        "optional uInt32 logonDayCnt":76
    },

    //7天活动表
    "message S7Activity":{
        //id
        "optional uInt32 id": 0,
        //天数分页文字
        "optional string dayText": 0,
        //活动分页名称
        "optional string name": 0,
        //当天的活动ID组
        "optional string activityId": 0,
        //活动ID对应的显示类型
        "optional string showType": 0
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
	
	//任务成就信息
	"message MissionInfo": {
		//任务成就进度
		"optional uInt32 progress": 1 ,
		"optional uInt32 conditionType": 2 ,
		"optional uInt32 missionType": 3,
		"optional uInt32 groupType": 4,
		//已领取的成就记录（成就id）（数组）
		"repeated json drewList": 5
	},
	
    // 装备洗练成就
    "message EquipAchievedItem": {
        //  
        "optional uInt32 id": 1,
        //  
        "optional uInt32 type": 2,
        //  
        "optional uInt32 value": 3
    },

    // 背包物品
    "message Item": {
        // 位置
        "optional uInt32 pos": 1,
        // 物品id，即策划表id
        "optional uInt32 itemId": 2,
        // 物品数量
        "optional uInt32 itemCount": 3
    },
    // 猎魔人
    "message Hero": {
        // 位置
        "optional uInt32 pos": 1,
        // 猎魔人id，策划表的heroId
        "optional uInt32 heroId": 2,
        // 当前等级
        "optional byte curLevel": 3,
        // 当前经验
        "optional uInt32 curExperience": 4,
        // 当前品质
        "optional byte quality": 5,
        // 技能列表
        "repeated Skill skills": 6,
        // 猎魔人id，即策划表id
        "optional uInt32 dataId": 7,
        // 是否新
        "optional uInt32 isNew": 5
    },
    // 技能
    "message Skill": {
        // id
        "optional uInt32 id": 1,
        // 等级
        "optional uInt32 lv": 2
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
    // 已通关关卡
    "message PassedBarrier": {
        // 关卡id
        "optional uInt32 barrierId": 1,
        // 星级
        "optional byte star": 2,
        // 今日攻打次数
        "optional byte dailyTimes": 3,
        // 今日重置次数
        "optional byte resetTimes": 4
    },
    // 已解锁章节
    "message unlockChapter": {
        // 章节id
        "optional uInt32 chapterId": 1,
        // 领取星级宝箱标志位1、2、4分别表示已领取第1、2、3个星级宝箱
        "optional uInt32 drawFlag": 2
    },
    // 进入场景
    "area.playerHandler.enterScene": {
        "optional short code": 1,
        // 角色初始数据
        "optional PlayerInitData curPlayer": 2
    },
	
	// 角色取名字
    "area.playerHandler.createPlayerName": {
         "optional short code": 1,
    },
	// 攻打随机boss
    "area.playerHandler.atkRandBoss": { 
		"optional short code": 1,
    },
	// 退出随机boss
    "area.playerHandler.exitRandBoss": { 
		"optional short code": 1,	
		// 掉落列表
        "repeated Drop drops": 2,
		// drops掉落的倍数
		"repeated short dropsCnt": 2,
		//杀死奖励
        "repeated Drop dieDrops": 2,
		//随机boss信息
		"optional BarrierRandBossInfo barrierRandBoss": 3, 
    },	
    // 设置出战猎魔人
    "area.playerHandler.setCurFightHero": {
        "optional short code": 1,
        // 出战猎魔人信息
        "optional Hero curHero": 2
    },
    // 设置出战猎魔人2
    "area.playerHandler.setCurFightHeroBrother": {
        "optional short code": 1,
    },
    // 购买体力
    "area.playerHandler.buyEnergy": {
        "optional short code": 1,
        // 原价
        "optional uInt32 cost": 2,
		// 折扣
        "optional uInt32 discount": 3
    },
    // 购买关卡次数
    "area.playerHandler.resetBarrierAtkCnt": {
        "optional short code": 1,
        // 关卡id
        "optional uInt32 barrierId": 2,
        // 刷新已攻打次数
        "optional short dailyTimes": 3,
        // 刷新已购买次数
        "optional uInt32 resetTimes": 4,
        // 花费，用于飘字
        "optional uInt32 cost": 4
    },
    // 关卡信息
    "message Barrier": {
        // 关卡id
        "optional uInt32 id": 1,
        // 开战时间
        "optional long startTick": 2,
        // 已购买时间次数
        "optional uInt32 buyTimeCount": 3
    },
    // 创建关卡
    "area.playerHandler.createBarrier": {
        "optional short code": 1,
        // 关卡信息
        "optional Barrier barrier": 2,
		// 掉落列表
        "repeated Drop drops": 3,
		// 活动掉落翻倍
        "optional uInt32 activityDropDouble": 4,
        // 最佳通关时间
        "optional uInt32 bestPassTime": 5
    },
    // 退出关卡
    "area.playerHandler.exitBarrier": {
        "optional short code": 1,
        // 掉落列表
        "repeated Drop drops": 2,
		// 活动掉落翻倍
        "optional uInt32 activityDropDouble": 3	,
		//随机boss信息
		"optional BarrierRandBossInfo barrierRandBoss": 4, 		
    },
    // 自动组队
    "area.playerHandler.autoCreateTeam": {
        "optional short code": 1,
        // 队伍信息
        "optional teamInfo team": 2
    },
    // 队伍信息
    "message teamInfo": {
        // 队伍id
        "optional uInt32 teamId": 1,
        // 关卡id
        "optional uInt32 barrierId": 2,
        // 成员人数
        "optional byte playerNum": 3,
        // 成员信息
        "repeated playerData playerDataArray": 4
    },
    // 队伍成员信息
    "message playerData": {
        // 队员角色id
        "optional uInt32 playerId": 1,
        // 入口服务器id
        "optional uInt32 frontendId": 2,
        // 名字
        "optional string name": 3,
        // 出战猎魔人
        "optional Hero hero": 4
    },
    // 取消自动组队
    "area.playerHandler.cancelAutoCreateTeam": {
        "optional short code": 1
    },
    // 使用技能
    "area.teamBattleHandler.useSkill": {
        "optional short code": 1
    },
    // 购买猎魔人
    "area.heroHandler.buyHero": {
        "optional uInt32 code": 1,
        // 花费
        "optional uInt32 cost": 2,
        // 猎魔人id回传
        "optional uInt32 heroId": 3,
        // 位置
        "optional uInt32 pos": 4
    }, 
	//角色-聚变
    "area.heroHandler.compose": {
        "optional uInt32 code": 1,
		//获得猎魔人
        "optional Hero hero": 2,
    },
	//角色-拆分
    "area.heroHandler.splittingUp": {
        "optional uInt32 code": 1,
		//获得猎魔人列表
        "optional Hero heroList": 2,
    }, 
	// 解锁英雄
    "area.heroHandler.openHeroLock": {
         "optional uInt32 code": 1,
    },
    // 升级猎魔人技能
    "area.heroHandler.levelUpSkill": {
        "optional uInt32 code": 1,
        // 花费
        "optional uInt32 cost": 2,
        // 提升等级
        "optional uInt32 addLV": 3
    },
    // 升级猎魔人
    "area.heroHandler.levelUp": {
        "optional uInt32 code": 1,
        // 花费
        "optional uInt32 cost": 2,
        // 如果code=3012时生效。
        "optional Item lackItem": 3
		
    },
    // 突破猎魔人
    "area.heroHandler.breakThrough": {
        "optional uInt32 code": 1,
        // 花费
        "optional UseItem cost": 2,
        // 返还武装核心
        "optional uInt32 totalHeroCore": 3,
        // 突破后的猎魔人id
        "optional uInt32 heroId": 4
    },
    // 购买宠物
    "area.petHandler.buyPet": {
        "optional uInt32 code": 1,
        // 花费
        "optional uInt32 costDiamond": 2,
        // 位置
        "optional uInt32 pos": 3
    },
    // 宠物升级
    "area.petHandler.petUpgrade": {
        "optional uInt32 code": 1,
        // 花费
        "optional uInt32 costGold": 2
    },
    // 宠物突破
    "area.petHandler.petBreakthrough": {
        "optional uInt32 code": 1,
        // 花费
        "optional UseItem costGold": 2
    },
    // 解锁章节
    "area.playerHandler.unlockChapter": {
        "optional uInt32 code": 1,
        // 花费
        "optional uInt32 cost": 2
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
    // 扫荡
    "area.playerHandler.wipe": {
        "optional uInt32 code": 1,
        // 掉落列表
        "repeated Drop drops": 2,
		// 活动关卡奖励翻倍
		"repeated uInt32 activityDropDouble": 3,
		//随机boss信息
		"optional BarrierRandBossInfo barrierRandBoss": 4, 
    },
    // 购买扫荡券
    "area.playerHandler.buyWipeTicket": {
        "optional uInt32 code": 1,
        // 花费
        "optional uInt32 cost": 2 
    },
    // 领取章节星级宝箱
    "area.playerHandler.drawChapterStarAwards": {
        "optional uInt32 code": 1,
        // 掉落列表
        "repeated Drop drops": 2
    },
    // 复活猎魔人
    "area.heroHandler.revive": {
        "optional uInt32 code": 1,
        // 花费
        "optional uInt32 cost": 2
    },
    // 购买时间
    "area.playerHandler.buyTime": {
        "optional uInt32 code": 1,
        // 花费
        "optional uInt32 cost": 2,
        // 已购买次数刷新
        "optional uInt32 buyTimeCount": 3
    },
    // 添加物品，GM命令
    "area.gmHandler.addItem": {
        "optional uInt32 code": 1
    },
    // 添加猎魔人，GM命令
    "area.gmHandler.addHero": {
        "optional uInt32 code": 1
    },
    // 设置猎魔人等级，GM命令
    "area.gmHandler.setHeroLV": {
        "optional uInt32 code": 1
    },
    // 添加宠物，GM命令
    "area.gmHandler.addPet": {
        "optional uInt32 code": 1
    },
    // 设置宠物等级，GM命令
    "area.gmHandler.setPetLV": {
        "optional uInt32 code": 1
    },
    // 设置钻石，GM命令
    "area.gmHandler.setDiamond": {
        "optional uInt32 code": 1
    },
    // 设置金币，GM命令
    "area.gmHandler.setGold": {
        "optional uInt32 code": 1
    },
    // 设置体力，GM命令
    "area.gmHandler.setSpirit": {
        "optional uInt32 code": 1
    },
    // 清空背包，GM命令
    "area.gmHandler.cleanItemBag": {
        "optional uInt32 code": 1
    },
    // 清空猎魔人背包，GM命令
    "area.gmHandler.cleanHeroBag": {
        "optional uInt32 code": 1
    },
    // 清空宠物背包，GM命令
    "area.gmHandler.cleanPetBag": {
        "optional uInt32 code": 1
    },
    // 设置指定关卡极其所有前置关卡3星通关，GM命令
    "area.gmHandler.clearCustom": {
        "optional uInt32 code": 1
    },
    // 设置指定关卡以指定星数通关，GM命令
    "area.gmHandler.clearCustomNow": {
        "optional uInt32 code": 1
    },
    // 出售物品
    "area.itemHandler.sell": {
        "optional uInt32 code": 1,
        // 获得金钱
        "optional uInt32 money": 2
    },
	// 物品开宝箱
    "area.itemHandler.openBox": { 
         "optional uInt32 code": 1, 
		// 宝箱奖励
        "repeated Box awards": 2   
    },
	
    // 保存客户端数据
    "area.clientSaveHandler.save": {
        "optional uInt32 code": 1
    },
    // 读取客户端保存数据
    "area.clientSaveHandler.load": {
        "optional uInt32 code": 1,
        // 客户端保存数据
        "optional string saveData": 2
    },
    // 报告引导完成，下方奖励
    "area.guideHandler.finish": {
        "optional uInt32 code": 1,
        // 引导id
        "optional uInt32 guideId": 2,
        // 奖励列表
        "repeated Drop drops": 3
    },
    // 提交建议
    "area.suggestionHandler.commit": {
        "optional uInt32 code": 1
    },
    // 商品信息
    "message Goods": {
        // 商品id
        "optional uInt32 id": 1,
        // 商品类型
        "optional uInt32 type": 2,
        // 商品类型参数
        "optional uInt32 typeId": 3,
        // 单词购买数量
        "optional uInt32 unit": 4,
        // 单日购买次数限制，-1为无限制
        "optional int32 dailyMax": 5,
        // 今日已购买次数
        "optional uInt32 dailyCnt": 6,
        // 购买所需货币类型
        "optional uInt32 priceType": 7,
        // 单次购买价格
        "optional uInt32 price": 8,
        // 促销图片id
        "optional uInt32 pic": 9
    },
    // 商店页面信息
    "message ShopPage": {
        "optional uInt32 id": 1,
        // 分页名字的id
        "optional uInt32 name": 2,
        // 显示货币栏列表
        "repeated uInt32 moneyShow": 3,
        // 商品列表，已排序
        "repeated Goods goods": 4
    },
    // 获取出售商品信息
    "area.shopHandler.getPageList": {
        "optional uInt32 code": 1,
        // 商店页面列表
        "repeated ShopPage pages": 2
    },
    // 购买商店商品
    "area.shopHandler.buy": {
        "optional uInt32 code": 1
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
    // 活动条件奖励信息
    "message Condition": {
        // 条件id
        "optional uInt32 id": 1,
        // 条件类型
        "optional uInt32 type": 2,
        // 条件参数
        "optional uInt32 param": 3,
        // 当前进度
        "optional uInt32 current": 4,
        // 条件图标
        "optional int32 icon": 5,
        // 奖励列表
        "repeated Drop drops": 6,
        // 是否领取过,1或0
        "optional uInt32 isDrew": 7,
        // 附加条件参数
        "optional uInt32 param01": 8,
        // 下一阶完成的预提示ID
        "optional uInt32 tipsId": 8,
        // 前往的按钮文字
        "optional uInt32 btntext": 8,
        // 前往的目标界面id
        "optional uInt32 formId": 8,
    },
    // 活动公告
    "message Notice": {
        // 公告类型
        "optional uInt32 type": 1,
        // 公告内容或图片id
        "optional string text": 2,
        // 字体大小
        "optional uInt32 textSize": 3
    },
    // 活动内容
    "message ActivityDetail": {
        // 优惠商店商品列表
        "repeated DiscountShopItem items": 1,
        // 条件信息列表
        "repeated Condition conditions": 2,
        // 公告列表
        "repeated Notice notices": 3,
        // 公告列表
        "repeated HeroCollect collects": 4
    }, 
    // 活动吃鸡信息
    "message ActivetyStrength": { 
        // 活动ActivetyStrength表id
		"optional uInt32 id": 1,
        // 开启时间
        "optional uInt32 openingTime": 2,
        // 持续时长
        "optional uInt32 lastTime": 3,
        // 获得的体力数
        "optional uInt32 strength": 4,
        // 获得货币的概率
        "optional uInt32 probability": 5,
        // 可能获得的钻石数
        "optional uInt32 diamond": 6,
		// 购买记录
		"optional uInt32 buyTime": 7
    },
    // 活动收集英雄
    "message HeroCollect": {
        //活动ActivityHeroCollect表id
        "optional uInt32 id": 1,
        // 名字
        "optional string name": 2,
        // 收集要求的角色ID组
        "repeated uInt32 heroIds": 3,
        // 掉落
        "optional uInt32 dropId": 3,
        // 进度 已经获得的
        "repeated uInt32 progress": 4,
        // 领取情况
        "optional uInt32 isDrew": 5,

    },
    // 活动信息
    "message Activity": {
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
        //"optional ActivityDetail detail": 6,
        // 活动关闭时间，单位毫秒
        "optional uInt32 closeTick": 7,
        // 活动第一次查看时间，为0则需要发area.activityHandler.viewDetail,否则不需要发
        "optional uInt32 vewTick": 8,
        //显示类型
        "optional uInt32 showType": 9
    },
	
    // 获取活动列表
    "area.activityHandler.list": {
        "optional uInt32 code": 1,
        // 活动列表
        "repeated Activity activities": 2
    },
    // 删除活动
    "activity.remove": {
        // 活动id
        "optional uInt32 id": 1
    },
    // 点击查看活动详情，与红点有关
    "area.activityHandler.viewDetail": {
        "optional uInt32 code": 1,
        //活动详情
        "optional ActivityDetail detailInfo":2
    },
    // 购买优惠商店商品
    "area.activityHandler.buyGoods": {
        "optional uInt32 code": 1,
        // 货币类型
        "optional uInt32 moneyType": 2,
        // 刷新数量，用于飘字
        "optional uInt32 count": 3
    },
    // 领取邀請碼奖励
    "area.activityHandler.drawAwards": {
        "optional uInt32 code": 1,
        // 邀請碼表ID
        "optional uInt32 id": 2,
        // 条件
        "optional uInt32 condParam": 3,
        // 奖励列表
        "repeated Drop drops": 4,
        //活动详情
        "optional ActivityDetail detailInfo":2
    },

    // 领取收集英雄活动奖励
    "area.activityHandler.drawAwards4Collect": {
        "optional uInt32 code": 1,
        // 奖励列表
        "repeated Drop drops": 4,
        //活动详情
        "optional ActivityDetail detailInfo":2
    },

	// 领取活动体力
    "area.activityHandler.getEnergy": {
         "optional uInt32 code": 1,
		 "repeated Drop drops": 2
    },	
	// 礼品兑换
	"area.activityHandler.snExchange": {
        "optional uInt32 code": 1,
        // 奖励列表
        "repeated Drop drops": 2
    },
	// 领取联盟特权
    "area.activityHandler.drawUnion": {        
        "optional uInt32 code": 1,
        // 奖励列表
        "repeated Drop drops": 2
    },
    // GM命令模拟充值
    "area.gmHandler.charge": {
        "optional uInt32 code": 1,
        // 刷新钻石，用于飘字
        "optional uInt32 diamond": 2
    },
    // GM命令，获取当前运营标志
    "area.gmHandler.getOpFlags": {
        "optional uInt32 code": 1,
        // 运营标志列表
        "repeated string opFlags": 2
    },
    // 设置当前运营标志
    "area.gmHandler.setOpFlags": {
        "optional uInt32 code": 1,
        // 刷新的运营标志列表
        "repeated string opFlags": 1
    },
    // 装备
    "area.equipHandler.arm": {
        "optional uInt32 code": 1
    },
    // 精炼
    "area.equipHandler.refine": {
        "optional uInt32 code": 1,
        // 材料格子回传
        "optional uInt32 posList": 2,
        // 金币刷新
        "optional uInt32 gold": 3,
        // 剩余免费次数刷新
       // "optional uInt32 dailyFreeRefine": 4,
        // 钻石刷新
        //"optional uInt32 diamond": 4,
        // 剩余钻石精炼次数刷新
       // "optional uInt32 dailyDiamondRefine": 6
    },
    //强化一次的结果
    "message OneStrengthenRS":{
        //返回码
        "optional uInt32 code": 1,
        //添加等级
        "optional uInt32 addLv": 2,
    },
    //强化
    "area.equipHandler.strengthen": {
        "optional uInt32 code": 1,
        // 多次强化的结果集
        "repeated OneStrengthenRS oneStrengthenRS": 2,
    },
    // GM手动保存总榜
    "world.gmHandler.saveScoreRankingList": {
        "optional uInt32 code": 1
    },
    // 排行榜条目
    "message ScoreRank": {
        // 排名
        "optional uInt32 rank": 1,
        // 玩家id
        "optional uInt32 playerId": 2,
        // 得分
        "optional uInt32 score": 3,
        // 角色名
        "optional string name": 4,
        // 头像id
        "optional uInt32 headPicId": 5,
        // 出战猎魔人id,即数据id
        "optional uInt32 heroId": 6,
        // 段位
        "optional uInt32 division": 7
    },
    // 获取总榜
    "world.rankingListHandler.getScoreList": {
        "optional uInt32 code": 1,
        // 排行榜列表
        "repeated ScoreRank rankingList": 2,
        // 自己的排名
        "optional uInt32 myRank": 3,
        // 奖励排名，没有奖励则无此字段
        "optional uInt32 awardRank": 4,
        // 奖励是否已领取
        "optional uInt32 awardDrew": 5
    },
    // GM手动保存周榜
    "world.gmHandler.saveWeekScoreRankingList": {
        "optional uInt32 code": 1
    },
    // 获取周榜
    "world.rankingListHandler.getWeekScoreList": {
        "optional uInt32 code": 1,
        // 排行榜列表
        "repeated ScoreRank rankingList": 2,
        // 自己的排名
        "optional uInt32 myRank": 3,
        // 奖励排名，没有奖励则无此字段
        "optional uInt32 awardRank": 4,
        // 奖励是否已领取
        "optional uInt32 awardDrew": 5
    },
    // 预览排行榜奖励
    "world.rankingListHandler.previewAwards": {
        "optional uInt32 code": 1,
        // 排行榜类型回传
        "optional uInt32 type": 2,
        // 奖励列表
        "repeated Drop awards": 3
    },
    // 领取排行榜奖励
    "area.rankingListHandler.drawAwards": {
        "optional uInt32 code": 1,
        // 排行榜类型，按排行榜奖励表的定义
        "optional uInt32 type": 2,
        // 奖励列表
        "repeated Drop awards": 3
    },
    // 预览自己的排行榜奖励
    "area.rankingListHandler.previewMyAwards": {
        "optional uInt32 code": 1,
        // 排行榜类型，按排行榜奖励表的定义
        "optional uInt32 type": 2,
        // 奖励列表
        "repeated Drop awards": 3
    },
    // 装备觉醒
    "area.equipHandler.wakeUp": {
        "optional uInt32 code": 1,
        // 部位
        "optional uInt32 part": 2,
        // 刷新金币，用于飘字
        "optional uInt32 gold": 3,
        // 刷新觉醒等级，0-59
        "optional uInt32 wakeUpLV": 4
    },
    // 装备熔炼
    "area.equipHandler.melt": {
        "optional uInt32 code": 1,
        // 获得的熔炼值，用于飘字
        "optional uInt32 meltPoint": 1
    },
    // 加成商品
    "message BuffItem": {
        // 加成数据id
        "optional uInt32 dataId": 1,
        // 已拥有个数
        "optional uInt32 cnt": 2,
        // 今日已购买次数
        "optional uInt32 buyCnt": 3,
        // 当前购买价格
        "optional uInt32 moneyNum": 4
    },
    // 获取加成商店物品列表
    "area.endlessBuffHandler.getShopItems": {
        "optional uInt32 code": 1,
        // 加成商品列表，已按id升序排列
        "repeated BuffItem items": 2
    },
    // 购买加成
    "area.endlessBuffHandler.buy": {
        "optional uInt32 code": 1,
        // 加成数据id回传
        "optional uInt32 dataId": 2,
        // 已拥有数量
        "optional uInt32 cnt": 3,
        // 今日已购买次数刷新
        "optional uInt32 buyCnt": 4
    },
    // 进入无尽模式战斗，单人模式和多人模式都一样调这个接口
    "area.endlessHandler.fight": {
        "optional uInt32 code": 1,
        // // 赛事数据id
        // "optional uInt32 occasionId": 2,
        // //无尽历史最高波次(单人)
        // "optional uInt32 endlessSingleOldWave": 3,
    },
    //赛次购买次数
    "area.endlessHandler.buyCount":{
        "optional uInt32 code": 1,
    },
    // 赛事信息
    "message Occasion": {
        // 赛事数据id
        "optional uInt32 occasionId": 1,
        // 已挑战次数
        "optional uInt32 dailyCnt": 2,
        // 胜利奖励
        "repeated Drop winAwards": 3,
        // 赠送奖励
        "repeated Drop presentAwards": 4
    },
    // 查看赛事
    "area.endlessHandler.viewOccasion": {
        "optional uInt32 code": 1,
        // 单人模式或多人模式，见赛事表定义
        "optional uInt32 mode": 2,
        "repeated Occasion occasions": 3,
        // 是否显示查看赛果的红点
        "optional uInt32 showReportRedSpot": 4
    },
    // 添加装备
    "area.gmHandler.addEquip": {
        "optional uInt32 code": 1
    },
    // 添加战斗勋章
    "area.gmHandler.addChapterKey": {
        "optional uInt32 code": 1
    },
    // 添加竞技点
    "area.gmHandler.addEndlessPkPoint": {
        "optional uInt32 code": 1
    },
    // 添加熔炼值
    "area.gmHandler.addEquipMeltPoint": {
        "optional uInt32 code": 1
    },
    // 添加觉醒材料
    "area.gmHandler.addWakeUpItem": {
        "optional uInt32 code": 1
    },
    // 宝箱
    "message Box": {
        // 宝箱中的奖励
        "repeated Drop awards": 1
    },
    // 玩家定时反馈得分 无尽多人模式结束提交  otherEnd
    "world.endlessHandler.reportScore": {
        "optional uInt32 code": 1,
        // 对手当前得分
        "optional uInt32 otherScore": 2,
        // 最高得分
        "optional uInt32 highScore": 3,
        // 本周排名
        "optional uInt32 curWeekRank": 4,
        // 宝箱奖励
        "repeated Box awards": 5,
        // 对手是否结束
        "optional uInt32 otherEnd": 6,
		// 无尽小奖励
        "repeated Box systemIdAwards": 7, 
		//随机商店数据 为{}表示没有随机到或者是商店已经存在
		"repeated randomShopInfo randomInfo": 8,
    },	
    "world.endlessHandler.singleReportScore": {
        "optional uInt32 code": 1,
	},
    // 赛果
    "message EndlessReport": {
        // 胜负
        "optional uInt32 result": 1,
        // 我方当时出战的猎魔人id
        "optional uInt32 heroId": 2,
        // 对方当时出战的猎魔人id
        "optional uInt32 otherHeroId": 3,
        // 对方名字
        "optional string otherName": 4,
        // 我方得分
        "optional uInt32 score": 5,
        // 比赛时间戳
        "optional uInt32 recTime": 6,
        // 是否已领取奖励
        "optional uInt32 drew": 7,
        // 无尽战斗id
        "optional string endlessId": 8,
        // 对方得分
        "optional uInt32 otherScore": 9,
		// 对方id
        "optional uInt32 otherPlayerId": 10,
		// 我方战前排行
        "optional uInt32 fightBfRank": 11,
		// 我方战前周榜排行
        "optional uInt32 fightBfWeekRank": 12,
        // 是否双倍掉落
        "optional uInt32 isDouble": 14
    },
    // 查看赛果
    "area.endlessHandler.viewReports": {
        "optional uInt32 code": 1,
        "repeated EndlessReport reports": 2
    },
    // 领取赛果
    "area.endlessHandler.drawAwards": {
        "optional uInt32 code": 1,
        // 参赛奖励
        "repeated Drop presentAwards": 2,
        // 获胜奖励
        "repeated Drop winAwards": 3,
        // 对方参赛奖励
        "repeated Drop otherPresentAwards": 4,
        // 对方获胜奖励
        "repeated Drop otherWinAwards": 5
    },
    // 无尽复活
    "area.endlessHandler.revive": {
        "optional uInt32 code": 1,
        // 复活次数刷新，用于飘字，另有推送
        "optional uInt32 reviveCnt": 2
    },
    // 提交单人模式的结算，下发宝箱
    "area.endlessHandler.commit": {
        // 更新后历史最高得分，如果玩家战斗前排行榜上不大于此得分，即为刷新记录
        "optional uInt32 highScore": 1,
        // 更新后的本周排名，如果玩家战斗前的周排名不大于此排名，即为刷新记录
        "optional uInt32 weekRank": 2,
        // 宝箱奖励
        "repeated Box awards": 3,
		//随机商店数据 为{}表示没有随机到或者是商店已经存在
		"repeated randomShopInfo randomInfo": 4,
    },

    "message DivisionOpponent":{
        //段位id
        "optional uInt32 divisionId": 1,
        //玩家名字
        "optional string name": 2,
        //玩家段位积分
        "optional uInt32 divScore": 3,
        //玩家英雄
        "optional uInt32 heroId": 4,
        //玩家历史最高战力
        "optional uInt32 hPower": 5,
        //玩家综合榜历史最高分
        "optional uInt32 hScore": 6,
        //是否机器人
        "optional uInt32 isRobot": 6,
    },

    // 获取无尽段位相关信息
    "area.endlessHandler.getDivisionInfo": {
        "optional uInt32 code": 1,
        //段位id
        "optional uInt32 division": 2,
        //玩家段位积分
        "optional uInt32 divScore": 3,
        //玩家历史最高段位
        "optional uInt32 highDivision": 4,
        //对手列表
        "repeated DivisionOpponent opponents": 5,
        //刷新次数
        "optional uInt32 refreshCnt": 1,
    },

    // 无尽段位刷新对手
    "area.endlessHandler.refreshDivisionOpponent": {
        "optional uInt32 code": 1,
        "repeated DivisionOpponent opponents": 5,
        //刷新次数
        "optional uInt32 refreshCnt": 1,
    },

    // 再开宝箱
    "area.endlessHandler.reopenBox": {
        "optional uInt32 code": 1,
        // 宝箱奖励
        "repeated Box awards": 2
    },
    // 开宝箱，上线时调用一下，检查上次离线是否有无尽PVP宝箱可以开
    "area.endlessHandler.openBox": {
        "optional uInt32 code": 1,
        // 宝箱奖励
        "repeated Box awards": 2,
        // 赛事id，用于再开宝箱
        "optional uInt32 occasionId": 3,
				
		"optional uInt32 activityDropDouble": 4, 
		
		// 无尽小奖励
        "repeated Box systemIdAwards": 5
    },
	
	 //充值信息
    "message rechargeInfo": {
        "optional uInt32 id":0,
		"optional uInt32 type":1,
		"optional uInt32 name":2,
		"optional uInt32 pic":3,
		"optional uInt32 price":4,
		"optional uInt32 coinType":5,
		"optional uInt32 diamond":6,
		"optional uInt32 firstText":7,
		"optional uInt32 firstGift":8,
		"optional uInt32 text":9,
		"optional uInt32 gift":10,
		"optional uInt32 order":11,
		"optional string operationFlag":12,
		"optional uInt32 buyCnt":13
    },
	
	//获取充值策划表数据列表
	 "area.rechargeHandler.list": {
		"optional uInt32 code": 1,
		"repeated rechargeInfo list": 2
	 },
	 
	  //充值 （内部充值接口）
	 "area.rechargeHandler.buy": {
		 "optional uInt32 code": 1,
		 //获得钻石
		 "optional uInt32 diamond": 2,
		 //赠送钻石
		 "optional uInt32 giftDiamond": 3,
		 //已购买次数
		 "optional uInt32 buyCnt": 4 
	 },
	 
	  //领取任务成就奖励
	 "area.missionHandler.drawAwards": {
		 //任务成就表id
		 "optional uInt32 code":  1,
		 //掉落数据
		 "repeated Drop  awards":2
	 },
	 
	 //玩家行为
	 "area.statisticHandler.playerBehavior": {
		  "optional uInt32 code":  1
	 },	  
	 
	  // 邮件信息
    "message MailTitle": {
        // 邮件ID
        "optional uInt32 id": 1,
        // 名字
        "optional string title": 3,
        // 过期时间
        "optional uInt32 delTime": 4,
        // 邮件状态
        "optional uInt32 status": 5,
        // 邮件附件物品个数
        "optional uInt32 itemCnt": 6,
        // 添加时间
        "optional uInt32 addTime": 7,
        // 邮件l类型
        "optional uInt32 type": 9,
    },
    // 邮件详细
    "message MailDetail": {
        // 邮件ID
        "optional uInt32 id": 1,
        // 发送者
        "optional string sender": 2,
        // 名字
        "optional string title": 3,
        // 过期时间
        "optional uInt32 delTime": 4,
        // 邮件状态, 详见 consts.MAIL_STATUS
        "optional uInt32 status": 5,
        // 创建时间
        "optional uInt32 addTime": 6,
        // 附加信息
        "optional uInt32 info": 7,
        // 附加掉落
        "repeated Drop drops": 8,
        // 邮件l类型
        "optional uInt32 type": 9,
        // 参数  [{type:0,value:100}] 0是真实值，1是程序字
        "optional string params": 10,
    },
    // 获取邮件标题
    "area.mailHandler.getMailTitle": {
        "optional uInt32 code": 1,
        "repeated MailTitle title": 2
    },
    // 获取邮件信息
    "area.mailHandler.getMailDetail": {
        "optional uInt32 code": 1,
        "repeated MailDetail detail": 2
    },
    // 获取邮件物品
    "area.mailHandler.getMailItems": {
        "optional uInt32 code": 1,
        // 邮件ID
        "optional uInt32 id": 1,
        // 邮件状态
        "optional uInt32 status": 2,
        // 删除时间   
        "optional uInt32 delTime": 3,
        // 附加掉落
        "repeated Drop drops": 4
    },
    // 获取全部邮件物品
    "area.mailHandler.getAllMailItems": {
        "optional uInt32 code": 1,
        "repeated Drop allDrops": 2
    },
    // 基本属性验证和CRC校验
    "area.battleHandler.verify": {
        "repeated uInt32 code": 1
    },

    // 删除邮件
    "area.mailHandler.removeMail": {
        "optional uInt32 code": 1
    },
    // 删除已读邮件
    "area.mailHandler.removeAllMail": {
        "optional uInt32 code": 1,
        "repeated uInt32 ids": 2
    },
		
	"message randomShopGoodfInfo":{
		//商品表的所有字段(具体去看策划表)
		//id	index	type 	typeId 	unit	dailyMax 	priceType	price	rate	sort 	pic 	buyLimit	buyLimitId	text1	text2			
		// 已经购买的次数
		"optional uInt32 buyCnt": 11
	},
	 // 随机商店信息
    "message randomShopInfo": {
        // 创建的时间（毫秒）
        "optional uInt32 createTime": 1,
        // 关闭的时间（毫秒）
        "optional uInt32 closeTime": 2,
        // 随机物品列表
        "repeated randomShopGoodfInfo goodsDataList": 3,
        // 已经刷新的次数
        "optional uInt32 refreshCnt": 4,
		//无尽进度
		"optional uInt32 progress": 5,	
        // 显示货币栏列表
        "optional uInt32 moneyShow": 6
    },	
	  
	// 获取随机商店信息
    "area.randomShopHandler.getRandomShopInfo": {
        "optional uInt32 code": 1,
		"repeated randomShopInfo randomInfo": 3,
    },
	// 购买随机商店商品
    "area.randomShopHandler.buy": {
        "optional uInt32 code": 1,
		"optional uInt32 refreshCnt": 2
    },
	//刷新随机商店
    "area.randomShopHandler.refresh": {
        "optional uInt32 code": 1
    },
	//碎片合成
    "area.fragItemHandler.compose": {
        "optional uInt32 code": 1,
		"repeated Hero hero": 2,
    },
	//夺宝
	"area.snatchTreasuresHandler.snatch":{
        "optional uInt32 code": 1,
		// 掉落列表
        "repeated Drop drops": 2,
	},
	//购买关卡商店物品
	"area.playerHandler.buyBarrierPromote":{
        "optional uInt32 code": 1,
		// 掉落列表
        "repeated Drop drops": 2,
	},
    // 生成内部订单号
    "area.shopHandler.makeOrderId": {
        "optional uInt32 code": 1,
        // 订单id
        "optional string orderId": 2,
        // 回传产品id
        "optional string productId": 3,
        // 订单生成时间
        "optional uInt32 timestamp": 4
    },
    // 首次购买猎魔人奖励获取
    "area.heroHandler.drawFirstBuyAward": {
        "optional uInt32 code": 1,
		// 掉落列表
        "repeated Drop drops": 2,
    },

    //author：卢家泉 尝试添加
    // 获取活动副本基础信息
    "area.activityEctypeHandler.getActivityBase": {
        "optional uInt32 code": 1,
        "optional uInt32 actGold": 0,
        "optional uInt32 actExp": 0,
        "optional uInt32 actItem": 0,
        //下次获取时间
        "optional long nextGetTime": 0,
    },
    "message ActEctypeDetail":{
        "optional uInt32 star": 0,
        "optional uInt32 coolEndtime": 0,
        "optional uInt32 activityId": 0,
    },
    // 获取活动副本基础信息
    "area.activityEctypeHandler.getActivityDetail": {
        "optional uInt32 code": 1,
        "repeated ActEctypeDetail detailList": 0
    },
    // 挑战活动副本
    "area.activityEctypeHandler.activityEnter": {
        "optional uInt32 code": 1,
        // 关卡信息
        "optional Barrier barrier": 2,
    },
    // 扫荡活动副本
    "area.activityEctypeHandler.activitySweep": {
        "optional uInt32 code": 1,
        // 掉落列表
        "repeated Drop drops": 2,

        "optional ActEctypeDetail info": 0
    },
    // 退出活动副本
    "area.activityEctypeHandler.activityOut": {
        "optional uInt32 code": 1,
        // 掉落列表
        "repeated Drop drops": 2,

        "optional ActEctypeDetail info": 0
    },
    // 去除背包new标签
    "area.playerHandler.removeBagNewFlag": {
        "optional uInt32 code": 1,
    },

    // 出售装备
    "area.equipHandler.sell": {
        "optional uInt32 code": 1,
    },

    // 获取周榜
    "world.rankingListHandler.getCatchList": {
        "optional uInt32 code": 1,
        // 排行榜列表
        "repeated ScoreRank rankingList": 2,
        // 自己的排名
        "optional uInt32 myRank": 3,
        // 奖励排名，没有奖励则无此字段
        "optional uInt32 awardRank": 4,
        // 奖励是否已领取
        "optional uInt32 awardDrew": 5
    },

    //进入游戏
    "area.catchTreasureHandler.joinGame":{
        "optional uInt32 code": 1,
        "optional uInt32 isFog": 1,
    },

    //开始游戏
    "area.catchTreasureHandler.startGame":{
        "optional uInt32 code": 1,
    },

    //结算游戏
    "area.catchTreasureHandler.overGame":{
        "optional uInt32 code": 1,
        "optional uInt32 moneyType": 2,
        "optional uInt32 moneyCnt": 3,

    },

    //购买抓宝次数
    "area.catchTreasureHandler.buyOnePlayCount":{
        "optional uInt32 code": 1,
    },

    // 角色分解
    "area.heroHandler.decompose": {
        "optional uInt32 code": 1,
        // 掉落列表
        "repeated Drop drops": 2,
        // 金币
        "optional uInt32 gold": 1,
        // 经验
        "optional uInt32 exp": 1,
        //武装核心
        "optional uInt32 heroCore": 1,
    },
    // 获取排行榜 统一协议
    "world.rankingListHandler.getRankList": {
        "optional uInt32 code": 1,
        // 排行榜列表
        "repeated ScoreRank rankingList": 2,
        // 自己的排名
        "optional uInt32 myRank": 3,
        // 奖励排名，没有奖励则无此字段
        "optional uInt32 awardRank": 4,
        // 奖励是否已领取
        "optional uInt32 awardDrew": 5,
        // 类型
        "optional uInt32 type": 6,
        // 自己的分数
        "optional uInt32 myScore": 7,
    },
    // 三星券使用
    "area.playerHandler.threeStar": {
        "optional uInt32 code": 1,
    },

    //好友列表对象
    "message FriendInfo":{
        //好友id
        "optional uInt32 playerId": 1,
        //好友名字
        "optional string playername": 2,
        //好友头像
        "optional uInt32 headPicId": 3,
        //好友历史最高战斗
        "optional uInt32 highPower": 4,
        //好友发送体力状态
        "optional uInt32 sendEnergy": 5,
        //好友接收状态
        "optional uInt32 receiveEnergy": 6,
        //好友登入时间
        "optional long logonTime": 7,
        //段位
        "optional uInt32 division": 8,
        //本周无尽积分
        "optional uInt32 weekHighScore": 9,
        //上周无尽积分
        "optional uInt32 lastWeekHighScore": 10,
    },

    //获取好友列表
    "area.friendsHandler.getInfoList":{
        "optional uInt32 code": 1,
        //好友信息列表
        "repeated FriendInfo infoList":1,
    },

    //是否在对方申请列表中
    "area.friendsHandler.playerInFriendRequest":{
        "optional uInt32 code": 1,
        //0:不在  ,1 :在
        "optional uInt32 rs":1,
    },

    //发送好友请求
    "area.friendsHandler.sendRequest":{
        "optional uInt32 code": 1,
        //助战添加推荐好友的奖励
        "repeated Drop assistReward": 2,
    },

    //查找好友
    "area.friendsHandler.findFriend":{
        "optional uInt32 code": 1,
        //好友id
        "optional uInt32 playerId":2,
    },

    //发送好友体力
    "area.friendsHandler.sendEnergy":{
        "optional uInt32 code": 1,
    },

    //接收好友体力
    "area.friendsHandler.acceptEnergy":{
        "optional uInt32 code": 1,
    },

    //添加黑名单
    "area.friendsHandler.addBadFriend":{
        "optional uInt32 code": 1,
    },

    //移除黑名单
    "area.friendsHandler.removeBadFriend":{
		"optional uInt32 code": 1,    },

    //同意好友请求
    "area.friendsHandler.agreeRequest":{
        "optional uInt32 code": 1,
    },

    //拒绝好友请求
    "area.friendsHandler.refuseRequest":{
        "optional uInt32 code": 1,
    },

    //删除好友
    "area.friendsHandler.removeFriend":{
        "optional uInt32 code": 1,
    },

    //获取好友的随机boss
    "area.friendsHandler.getAllFriendsBoss":{
        //随机boss信息
        "repeated BarrierRandBossInfo barrierRandBoss": 1,
        // 助战随机boss次数
        "optional uInt32 assistRandBossCount": 2,
        // 玩家攻打自己的随机boss冷却时间
        "optional uInt32 playerRandBossCoolTime": 3,
        // 玩家助战随机boss冷却时间
        "optional uInt32 assistRandBossCoolTime": 4
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
        // 助战好友战斗力
        "optional uInt32 highPower": 5,
    },
    //获取好友的助战列表
    "area.assistFightHandler.getAllAssistList":{
        // 玩家id
        "repeated assistInfo friendAssistList": 1,
        // 玩家id
        "repeated assistInfo sysAssistList": 2,
        // 系统配置表助战列表
        "repeated assistInfo dataAssistList": 3,
        //助战添加好友领取奖励的次数
        "optional uInt32 assistAddFriendDrewCnt": 4,
    },

    //训练模块信息
    "message TrainVO": {
        //训练值
        "optional uInt32 trainValue": 2 ,
        //免费加速次数
        "optional uInt32 freeCnt": 3,
        //付费加速次数
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

    //获取训练相关信息
    "area.trainHandler.trainInfo":{
        "optional uInt32 code": 1,
        //训练模块信息
        "optional TrainVO trainVO": 2,
    },
    //训练点击事件
    "area.trainHandler.clickGain":{
        "optional uInt32 code": 1,
        //训练模块信息
        "optional TrainVO trainVO": 2,
    },
    //训练加速
    "area.trainHandler.quicken":{
        "optional uInt32 code": 1,
        // 掉落列表
        "repeated Drop drops": 2,
        //训练模块信息
        "optional TrainVO trainVO": 2,
    },

    //新联领取奖励
    "area.trainHandler.gain":{
        "optional uInt32 code": 1,
        // 掉落列表
        "repeated Drop drops": 2,
        //训练模块信息
        "optional TrainVO trainVO": 2,
    },

    // 客户端信息记录
    "area.clientActionHandler.record":{
        "optional uInt32 code": 1,
    },

    //分享随机boss
    "area.playerHandler.shareRandBoss":{
        "optional uInt32 code": 1,
    },

    //碎片合成
    "area.fragItemHandler.equipCompose": {
        "optional uInt32 code": 1,
        "optional Equip equip": 2,
    },

    //英雄技能进阶
    "area.heroHandler.advanceSkill": {
        "optional uInt32 code": 1,
        //消耗的武装核心
        "optional uInt32 costCore": 2,
        //进阶等级
        "optional uInt32 addLv": 3,
    },

    // 无尽乱斗获得道具
    "world.endlessHandler.gainItem": {
        //
        "optional uInt32 code": 1,
    },
    // 无尽乱斗使用道具
    "world.endlessHandler.useItem": {
        // 玩家ID
        "optional uInt32 code": 1,
    },
    // 使用可选包
    "area.playerHandler.optionGift": {
        //
        "optional uInt32 code": 1,
        // 掉落列表
        "repeated Drop drops": 2,
    },

    "message playerDynamics":{
        // 玩家ID
        "optional string playername": 1,
        // 积分
        "optional uInt32 score": 2,
        // 排名
        "optional uInt32 rank": 3,
    },
    "message endlessMatchCnt":{
        // 无尽赛事ID
        "optional uInt32 occasionId": 1,
        // 匹配次数
        "optional uInt32 count": 2,
    },
    "world.endlessHandler.getEndlessDynamics":{
        // 玩家动态
        "repeated playerDynamics playerDynamics": 1,
        // 无尽匹配信息
        "repeated endlessMatchCnt matchCnt": 2,
    },
    // 金币宝箱
    "area.playerHandler.goldBox": {
        //
        "optional uInt32 code": 1,
        // 倍率
        "optional uInt32 luckyRewardRate": 2,
        // 购买次数
        "optional uInt32 buyTime": 3,

    }


};
