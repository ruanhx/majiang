/**
 * Created by employee11 on 2016/1/9.
 */

module.exports = {
    // 查询入口服务器
    "gate.gateHandler.queryEntry": {
        // 帐号id
        "optional string uid": 1
    },
    // 登录
    "connector.entryHandler.entry": {
        // 帐号id或SDK回传的用户唯一id
        "optional string MAC": 1,
        // 密码
        "optional string pwd": 2,
        // 传入SDK回传的 session 或 token
        "optional string token": 3,
        // 平台标志，我方内部的帐号验证可不传或传'default'
        "optional string platform": 4,
		// 平台sdk回调数据
        "optional string sdkLoginCbData": 4
    },
    // 创角
    "connector.roleHandler.createPlayer": {
        // 帐号
        "optional string MAC": 1,
        // 密码
        "optional string pwd": 2,
        // 角色名
        "optional string name": 3,
        // 头像id
        "optional byte picId": 4,
        // 角色id
        "optional uInt32 heroId": 5,
    },
    // 客户端心跳包
    "connector.heartHandler.clientHeart": {
        // 无需参数
    },
    // 同步时间给客户端
    "connector.heartHandler.syncClientTime": {
        // 无需参数
    },
    // 进入场景
    "area.playerHandler.enterScene": {
        // 语言
		"optional string language": 1,
		//是否重连 1=重连
		"optional uInt32 isReconnect": 2
    },
	
	// 角色取名字
    "area.playerHandler.createPlayerName": { 
		"optional string name": 1
    },
	
	// 攻打随机boss
    "area.playerHandler.atkRandBoss": { 
		"optional uInt32 randomBossId": 1,
        // 协助好友
        "optional uInt32 friendId": 2
    },
	// 退出随机boss
    "area.playerHandler.exitRandBoss": { 
		"optional uInt32 currHp": 1,//本次打掉血量的百分比，放大了10万倍的。
		"optional uInt32 randomBossId": 2,
        // 协助好友
        "optional uInt32 friendId": 3
    },	
    // 设置当前出战猎魔人
    "area.playerHandler.setCurFightHero": {
        // 猎魔人位置
        "optional byte pos": 1
    },
    // 设置当前出战猎魔人2
    "area.playerHandler.setCurFightHeroBrother": {
        // 猎魔人位置
        "optional byte type": 1,
        // 猎魔人位置
        "optional byte pos": 2
    },
    // 创建关卡
    "area.playerHandler.createBarrier": {
        // 关卡id
        "optional uInt32 barrierId": 1,
        // 助战玩家Id
        "optional uInt32 assistFightPlayerId": 2
    },
    // 退出关卡
    "area.playerHandler.exitBarrier": {
        // 战斗结果，1胜利，其他失败
        "optional uInt32 status": 1,
        // 星级
        "optional uInt32 star": 2,
        // 战斗力
        "optional uInt32 power": 3,
        // 通关使用大招次数
        "optional uInt32 superSkillCnt": 4,
        // 通关跳跃次数
        "optional uInt32 jumpCnt": 5,
        // 通关使用跳跃技能次数
        "optional uInt32 jumpSkillCnt": 6,
        // 通关时间
        "optional uInt32 passTime": 7,
        // 助战玩家Id
        "optional uInt32 assistFightPlayerId": 8
    },
    // 购买关卡次数
    "area.playerHandler.resetBarrierAtkCnt": {
        // 关卡id
        "optional uInt32 barrierId": 1
    },
    // 自动组队
    "area.teamHandler.autoCreateTeam": {
        // 关卡id
        "optional uInt32 barrierId": 1
    },
    // 取消自动组队
    "area.teamHandler.cancelAutoCreateTeam": {
        // 无需参数
    },
    // 使用技能
    "area.teamBattleHandler.useSkill": {
        // 技能类型
        "optional uInt32 skillType": 1
    },
    // 上传加载进度
    "world.endlessHandler.loadingPercent": {
        // 进度百分比
        "optional byte percent": 1
    },
    // 广播猎魔人伤害
    "area.teamBattleHandler.syncHeroHurt": {
        // 伤害值
        "optional uInt32 value": 1
    },
    // 广播移动消息
    "area.teamBattleHandler.playerMove": {
        // 方向
        "optional byte direction": 1,
        // 角度�����
        "optional directionAngle directionAngle": 2,
        // 位置
        "optional point point": 3
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
    "area.teamBattleHandler.playerJump": {
        // 无需参数
    },
    // 使用buffer
    "area.teamBattleHandler.useBuffer": {
        // 属性类型
        "optional byte propType": 1
    },
    // 购买体力
    "area.playerHandler.buyEnergy": {
        // 无需参数
    },
    // 升级猎魔人技能
    "area.heroHandler.levelUpSkill": {
        // 猎魔人位置
        "optional uInt32 pos": 1,
        // 技能类型，参见 consts.HERO_SKILL_TYPES
        "optional uInt32 skillType": 2,
        // 提升等级
        "optional uInt32 addLV": 3
    },
    // 使用物品
    "message UseItem": {
        // 物品位置
        "optional uInt32 pos": 1,
        // 物品数量
        "optional uInt32 count": 2
    },
    // 购买猎魔人
    "area.heroHandler.buyHero": {
        // 猎魔人id，策划表的id
        "optional uInt32 heroId": 1
    },
	// 解锁英雄
    "area.heroHandler.openHeroLock": {
        // 猎魔人id，策划表(HeroAttribute)的id
        "optional uInt32 id": 1
    },
	
    // 升级猎魔人
    "area.heroHandler.levelUp": {
        // 位置
        "optional uInt32 pos": 1,
        // 使用物品列表
        "repeated UseItem items": 2,
        // 使用其他猎魔人的位置列表
        "repeated uInt32 heroPosList": 3
    },
    // 猎魔人突破
    "area.heroHandler.breakThrough": {
        // 位置
        "optional uInt32 pos": 1,
        // 使用物品列表
        "repeated UseItem items": 2,
        // 使用其他猎魔人的位置列表
        "repeated uInt32 heroPosList": 3
    },
    // 购买宠物
    "area.petHandler.buyPet": {
        // 宠物Id，即策划表id
        "optional uInt32 petId": 1
    },
    // 宠物升级
    "area.petHandler.petUpgrade": {
        // 目标宠物位置
        "optional uInt32 pos": 1,
        // 使用物品
        "repeated UseItem items": 2,
        // 使用宠物位置列表
        "repeated uInt32 pets": 3
    },
    // 宠物突破
    "area.petHandler.petBreakthrough": {
        // 位置
        "optional uInt32 pos": 1
    },
    // 解锁章节
    "area.playerHandler.unlockChapter": {
        // 章节id
        "optional uInt32 chapterId": 1
    },
    // 扫荡
    "area.playerHandler.wipe": {
        // 关卡id
        "optional uInt32 barrierId": 1
    },
    // 购买扫荡券
    "area.playerHandler.buyWipeTicket": {
        // 无需参数
    },
    // 领取章节星级宝箱
    "area.playerHandler.drawChapterStarAwards": {
        // 章节id
        "optional uInt32 chapterId": 1,
        // 星级条件id，1、2、3
        "optional uInt32 starCondId": 2
    },
    // 复活猎魔人
    "area.heroHandler.revive": {
        // 位置
        "optional uInt32 pos": 1
    },
	
	//角色-聚变
    "area.heroHandler.compose": {
        // 聚变表id
        "optional uInt32 id": 1,
		//选择的英雄pos列表
		"optional uInt32 heroPosList": 2,
		//合成的品质 Compose表里面的needRoleQuality
		"optional uInt32 needRoleQuality": 3,
		
    },
	
	//角色-拆分
    "area.heroHandler.splittingUp": {
        // 位置
        "optional uInt32 pos": 1,
    },
	
    // 购买时间
    "area.playerHandler.buyTime": {
        // 无需参数
    },
    // 添加物品，GM命令
    "area.gmHandler.addItem": {
        // 物品id
        "optional uInt32 itemId": 1,
        // 数量
        "optional uInt32 count": 2
    },
    // 添加猎魔人，GM命令
    "area.gmHandler.addHero": {
        // 猎魔人id，即策划表的id字段
        "optional uInt32 heroId": 1
    },
    // 设置猎魔人等级，GM命令
    "area.gmHandler.setHeroLV": {
        // 猎魔人格子
        "optional uInt32 pos": 1,
        // 新的等级
        "optional uInt32 level": 2
    },
    // 添加宠物，GM命令
    "area.gmHandler.addPet": {
        // 宠物id，即策划表的id字段
        "optional uInt32 petId": 1
    },
    // 设置宠物等级，GM命令
    "area.gmHandler.setPetLV": {
        // 宠物格子
        "optional uInt32 pos": 1,
        // 新的等级
        "optional uInt32 level": 2
    },
    // 设置钻石，GM命令
    "area.gmHandler.setDiamond": {
        // 新的钻石数量
        "optional uInt32 diamond": 1
    },
    // 设置金币，GM命令
    "area.gmHandler.setGold": {
        // 新的金币数量
        "optional uInt32 gold": 1
    },
    // 设置体力，GM命令
    "area.gmHandler.setSpirit": {
        // 新的体力
        "optional uInt32 spirit": 1
    },
    // 清空背包，GM命令
    "area.gmHandler.cleanItemBag": {
        // 无需参数
    },
    // 清空猎魔人背包，GM命令
    "area.gmHandler.cleanHeroBag": {
        // 无需参数
    },
    // 清空宠物背包，GM命令
    "area.gmHandler.cleanPetBag": {
        // 无需参数
    },
    // 设置指定关卡极其所有前置关卡3星通关，GM命令
    "area.gmHandler.clearCustom": {
        // 关卡id
        "optional uInt32 barrierId": 1
    },
    // 设置指定关卡以指定星数通关，GM命令
    "area.gmHandler.clearCustomNow": {
        // 关卡id
        "optional uInt32 barrierId": 1,
        // 关卡星数
        "optional uInt32 star": 2
    },
    // 出售物品
    "area.itemHandler.sell": {
        // 格子编号
        "optional uInt32 slot": 1
    },
	// 物品开宝箱
    "area.itemHandler.openBox": {
        // 格子编号
        "optional uInt32 slot": 1,
		// 物品表物品类型
        "optional uInt32 type": 2
    },
    // 保存客户端数据
    "area.clientSaveHandler.save": {
        // 客户端保存数据
        "optional string saveData": 1
    },
    // 读取客户端保存数据
    "area.clientSaveHandler.load": {
        // 无需参数
    },
    // 报告引导完成，下方奖励
    "area.guideHandler.finish": {
        // 引导id
        "optional uInt32 guideId": 1
    },
    // 提交建议
    "area.suggestionHandler.commit": {
        // 建议内容
        "optional string content": 1
    },
    // 获取出售商品信息
    "area.shopHandler.getPageList": {
        // 无需参数
    },
    // 购买商店商品
    "area.shopHandler.buy": {
        // 商品id
        "optional uInt32 goodsId": 1,
        // 商品类型
        "optional uInt32 type": 2,
        // 商品类型参数
        "optional uInt32 typeId": 3,
        // 单次购买数量
        "optional uInt32 unit": 4,
        // 价格类型
        "optional uInt32 priceType": 5,
        // 单次购买价格
        "optional uInt32 price": 6
    },
    // 获取活动列表
    "area.activityHandler.list": {
        // 无需参数
    },
    // 点击查看活动详情，与红点有关
    "area.activityHandler.viewDetail": {
        // 活动id
        "optional uInt32 actId": 1
    },
    // 购买优惠商店商品
    "area.activityHandler.buyGoods": {
        // 活动id
        "optional uInt32 actId": 1,
        // 商品id
        "optional uInt32 goodsId": 2
    },
	  // 领取活动体力
    "area.activityHandler.getEnergy": {
        // 活动id
        "optional uInt32 actId": 1,
        // ActivetyStrength表id
        "optional uInt32 id": 2
    },
	 // 礼品兑换
    "area.activityHandler.snExchange": {
        // 运营商，为''则走我方自定义验证
        "optional string interface": 1,
        // 激活码
        "optional string sn": 2
    },

    // 领取活动奖励
    "area.activityHandler.drawAwards": {
        // 活动id
        "optional uInt32 actId": 1,
        // 条件id
        "optional uInt32 condId": 2
    },

    // 领取收集英雄活动奖励
    "area.activityHandler.drawAwards4Collect": {
        // 活动id
        "optional uInt32 actId": 1,
        // 条件id
        "optional uInt32 collectId": 2
    },

    // 领取邀請碼
    "area.activityHandler.drawInvitAwards": {
        // 活动id
        "optional uInt32 id": 1,
        // 邀請碼表ID
        "optional uInt32 condParam": 2,
        //好友的邀请码
        "optional string inviteCode": 3,
    },
	// 领取联盟特权
    "area.activityHandler.drawUnion": {
        // 活动id
        "optional uInt32 actId": 1,
        // 1为月卡 2为永久卡 3为周卡
        "optional uInt32 cardType": 1
    },
    // GM命令模拟充值
    "area.gmHandler.charge": {
        // 充值金额
        "optional uInt32 money": 1,
        // 获得钻石，不包括赠送
        "optional uInt32 diamond": 2,
        // 赠送钻石
        "optional uInt32 present": 3
    },
    // GM命令，获取当前运营标志
    "world.gmHandler.getOpFlags": {
        // 无需参数
    },
    // 设置当前运营标志
    "world.gmHandler.setOpFlags": {
        // 新的运营标志列表
        "repeated string opFlags": 1
    },
    // 装备
    "area.equipHandler.arm": {
        // 背包仓库格子
        "optional uInt32 pos": 1
    },
    // 精炼
    "area.equipHandler.refine": {
        // 材料装备格子
        "optional uInt32 posList": 1,
		// 强化的部位
		"optional uInt32 part": 2
    },
    // 强化
    "area.equipHandler.strengthen": {
        // 强化的部位
        "optional uInt32 part": 1,
        // 强化多少次数
        "optional uInt32 cnt": 2,
    },
    // GM手动保存总榜
    "world.gmHandler.saveScoreRankingList": {
        // 无需参数
    },
    // 获取总榜
    "world.rankingListHandler.getScoreList": {
        // 无需参数
    },
    // GM手动保存周榜
    "world.gmHandler.saveWeekScoreRankingList": {
        // 无需参数
    },
    "world.rankingListHandler.getWeekScoreList": {
        // 无需参数
    },
    // 预览排行榜奖励
    "world.rankingListHandler.previewAwards": {
        // 排行榜类型，按排行榜奖励表的定义
        "optional uInt32 type": 1
    },
    // 领取排行榜奖励
    "area.rankingListHandler.drawAwards": {
        // 排行榜类型，按排行榜奖励表的定义
        "optional uInt32 type": 1
    },
    // 预览自己的排行榜奖励
    "area.rankingListHandler.previewMyAwards": {
        // 排行榜类型，按排行榜奖励表的定义
        "optional uInt32 type": 1
    },
    // 装备觉醒
    "area.equipHandler.wakeUp": {
        // 部位
        "optional uInt32 part": 1
    },
    // 装备洗练
    "area.equipHandler.wash": {
        // 部位
        "optional uInt32 part": 1
    },
    // 装备熔炼
    "area.equipHandler.melt": {
        // 待熔炼的装备位置列表
        "repeated uInt32 posList": 1
    },
    // 获取加成商店物品列表
    "area.endlessBuffHandler.getShopItems": {
        // 无需参数
    },
    // 购买加成
    "area.endlessBuffHandler.buy": {
        // 加成数据id
        "optional uInt32 dataId": 1
    },
    // 进入无尽模式战斗，单人模式和多人模式都一样调这个接口
    "area.endlessHandler.fight": {
        // 赛事数据id，服务端根据这个判断单人模式或多人模式
        "optional uInt32 occasionId": 1,
        // 主动应战的玩家ID
        "optional uInt32 fightPlayerId": 2,
        // 助战玩家Id
        "optional uInt32 assistFightPlayerId": 3,
        //使用物品（挑战券）
        "optional uInt32 itemPos": 3
    },
    // 查看赛事
    "area.endlessHandler.viewOccasion": {
        // 单人模式或多人模式，见赛事表定义
        "optional uInt32 mode": 1
    },
    //赛次购买次数
    "area.endlessHandler.buyCount":{
        // 赛事数据id，
        "optional uInt32 occasionId": 1
    },
    // 添加装备
    "area.gmHandler.addEquip": {
        // 装备数据id
        "optional uInt32 equipId": 1,
        // 装备数量
        "optional uInt32 cnt": 2
    },
    // 添加战斗勋章
    "area.gmHandler.addChapterKey": {
        // 数量
        "optional uInt32 cnt": 1
    },
    // 添加竞技点
    "area.gmHandler.addEndlessPkPoint": {
        // 数量
        "optional uInt32 cnt": 1
    },
    // 添加熔炼值
    "area.gmHandler.addEquipMeltPoint": {
        // 数量
        "optional uInt32 cnt": 1
    },
    // 添加洗练石
    "area.gmHandler.addWashPoint": {
        // 数量
        "optional uInt32 cnt": 1
    },
    // 添加觉醒材料
    "area.gmHandler.addWakeUpItem": {
        // 物品id
        "optional uInt32 itemId": 1,
        // 数量
        "optional uInt32 count": 2
    },
    // 玩家定时反馈得分
    "world.endlessHandler.reportScore": {
        // 当前得分
        "optional uInt32 score": 1,
        // 是否结束，1结束，2继续
        "optional uInt32 end": 2,
        // 玩家当前关卡id
        "optional uInt32 curBattleId": 3,
		//无尽历史最高关卡
		"optional uInt32 endlessSingleHighBarr": 4
    },
    // 玩家定时反馈得分
    "world.endlessHandler.singleReportScore": {
        // 当前得分
        "optional uInt32 score": 1,
        // 是否结束，1结束，2继续
        "optional uInt32 end": 2,
        // 玩家当前关卡id
        "optional uInt32 curBattleId": 3,
		//无尽历史最高关卡
		"optional uInt32 endlessSingleHighBarr": 4
    },
    // 查看赛果
    "area.endlessHandler.viewReports": {
        // 无需参数
    },
    // 领取赛果
    "area.endlessHandler.drawAwards": {
        // 战斗id
        "optional string endlessId": 1
    },
    // 无尽复活
    "area.endlessHandler.revive": {
        // 赛事id，考虑玩家可能在单人模式战斗中，但是上一场PVP并未结束，所以需要此字段
        "optional uInt32 occasionId": 1
    },
    // 提交单人模式的结算，下发宝箱
    "area.endlessHandler.commit": {
        // 得分
        "optional uInt32 score": 1,
		//无尽波次(单人)
		"optional uInt32 endlessSingleOldWave": 2, 
		//
		"optional uInt32 systemId": 3,
        //赛事id
        "optional uInt32 occasionId": 4,
        //段位获得积分
        "optional uInt32 divScore": 5,
        // 助战玩家Id
        "optional uInt32 assistFightPlayerId": 6
    },
    // 获取无尽段位相关信息
    "area.endlessHandler.getDivisionInfo": {

    },
    // 无尽段位刷新对手
    "area.endlessHandler.refreshDivisionOpponent": {
        //刷新类型  0是收费 1是免费
        "optional uInt32 type": 5,
    },

    // 再开宝箱
    "area.endlessHandler.reopenBox": {
        // 赛事id，由于可能存在同时在打PVP模式和单人模式，所以需要传赛事id
        "optional uInt32 occasionId": 1
    },
    // 开宝箱，上线时调用一下，检查上次离线是否有无尽PVP宝箱可以开
    "area.endlessHandler.openBox": {},
	
	 //获取充值策划表数据列表
	 "area.rechargeHandler.list": {},
	 
	  //充值 （内部充值接口）
	 "area.rechargeHandler.buy": {
		 //充值策划表id
		 "optional uInt32 id": 1
	 },	 
	 //领取任务成就奖励
	 "area.missionHandler.drawAwards": {
		 //任务成就表id
		 "optional uInt32 missionId": 1
	 },	

	//玩家行为
	 "area.statisticHandler.playerBehavior": {
		 //界面层/场景		 
		 "optional uInt32 id": 1,
		 //参数1 关卡选择：关卡id pve战斗场景：关卡id
		 "optional uInt32 parameter1": 2,
	 },	 
    // 获取邮件列表
    "area.mailHandler.getMailTitle": {
        // 无需参数
    },
    // 获取邮件详细
    "area.mailHandler.getMailDetail": {
        // 邮件ID
        "optional uInt32 id": 1
    },
    // 获取邮件物品
    "area.mailHandler.getMailItems": {
        // 邮件ID
        "optional uInt32 id": 1
    },
    // 获取全部邮件物品
    "area.mailHandler.getAllMailItems": {
        // 无需参数
    },
    // 删除邮件
    "area.mailHandler.removeMail": {
        // 邮件ID
        "optional uInt32 id": 1
    },
    // 删除已读邮件
    "area.mailHandler.removeAllMail": {
        // 无需参数
    },	
	// 获取随机商店信息
    "area.randomShopHandler.getRandomShopInfo": {
        // 无需参数
    },
	// 购买随机商店商品
    "area.randomShopHandler.buy": {
        "optional uInt32 goodsId": 1
    },
	//刷新随机商店
    "area.randomShopHandler.refresh": {
        // 无需参数
    },
	//碎片合成
    "area.fragItemHandler.compose": {
        //Items表里面的id
		"optional uInt32 itemId": 1
    },
	//夺宝
	"area.snatchTreasuresHandler.snatch":{
        // 是否为单抽,1=单抽，0=10连抽
        "optional uInt32 isSingle": 1
	},
	//购买关卡商店物品
	"area.playerHandler.buyBarrierPromote":{
        //关卡id
        "optional uInt32 chapterId": 1,
		//要购买的掉落id
        "optional uInt32 dropId": 2
	},
    // 生成内部订单号
    "area.shopHandler.makeOrderId": {
        // 产品id
        "optional string productId": 1
    },
    // 首次购买猎魔人奖励获取
    "area.heroHandler.drawFirstBuyAward": {
        // 已经购买的id，角色表的id
        "optional uInt32 configId": 1
    },

    //author：卢家泉 尝试添加
    // 获取活动副本基础信息
    "area.activityEctypeHandler.getActivityBase": {
        // 无效参数
    },
    // 获取活动副本详细信息
    "area.activityEctypeHandler.getActivityDetail": {
        // 活动副本id
        "repeated uInt32 activityIdList": 1,
    },
    // 挑战活动副本
    "area.activityEctypeHandler.activityEnter": {
        // 活动副本id
        "optional uInt32 activityId": 1,
    },
    // 扫荡活动副本
    "area.activityEctypeHandler.activitySweep": {
        // 活动副本id
        "optional uInt32 activityId": 1,
    },
    // 退出活动副本
    "area.activityEctypeHandler.activityOut": {
        // 活动副本id
        "optional uInt32 activityId": 1,
        // 战斗结果，1胜利，其他失败
        "optional uInt32 status": 1,
        // 星级
        "optional uInt32 star": 2,
    },

    // 去除背包new标签
    "area.playerHandler.removeBagNewFlag": {
        // 背包类型 1是武装，2是装备
        "optional uInt32 type": 1,
        // 格子编号
        "repeated uInt32 slot": 1
    },
    // 出售装备
    "area.equipHandler.sell": {
        // 格子编号
        "optional uInt32 slot": 1
    },
    //获取抓宝排行榜
    "world.rankingListHandler.getCatchList": {
        // 无需参数
    },

    //获取排行榜
    "world.rankingListHandler.getRankList": {
        /// 排行榜类型
        "optional uInt32 type": 1,
        /// 关卡ID 关卡排行用 其他可不传
        "optional uInt32 barrierId": 2
    },

    //进入游戏
    "area.catchTreasureHandler.joinGame":{
        // 无需参数
    },

    //开始游戏 ---遗弃
    "area.catchTreasureHandler.startGame":{
        // 无需参数
    },
    //宝藏
    "message Treasure ":{
        "optional uInt32 id" : 1,
        "optional uInt32 num" : 1,
    },
    //结算游戏
    "area.catchTreasureHandler.overGame":{
        // 格子编号
        "optional uInt32 playCnt": 1,
        // 格子编号
        "optional uInt32 score": 1,
        // 格子编号
        "repeated Treasure treasureList": 1
    },

    //购买抓宝次数
    "area.catchTreasureHandler.buyOnePlayCount":{
        // 无需参数
    },

    //角色分解
    "area.heroHandler.decompose":{
        // 格子编号
        "repeated uInt32 slotList": 1
    },

    // 三星券过关
    "area.playerHandler.threeStar": {
        // 关卡id
        "optional uInt32 barrierId": 1,
        // 使用物品列表
        "repeated UseItem items": 2,
    },

    //获取列表
    "area.friendsHandler.getInfoList":{
        //列表类型 0是请求列表，1是好友列表，2是黑名单，3是推荐列表
        "optional uInt32 type":1,
    },

    //是否在对方申请列表中
    "area.friendsHandler.playerInFriendRequest":{
        //对方玩家id
        "optional uInt32 playerId":1,
    },

    //发送好友请求
    "area.friendsHandler.sendRequest":{
        //好友id
        "optional uInt32 playerIds":1,
        //是否助战推荐
        "optional uInt32 assist":2,
    },

    //查找好友
    "area.friendsHandler.findFriend":{
        //好友昵称
        "optional string name":1,
    },

    //发送体力
    "area.friendsHandler.sendEnergy":{
        //好友id数组
        "repeated uInt32 playerIds":1,
    },

    //接收体力
    "area.friendsHandler.acceptEnergy":{
        //好友id数组
        "repeated uInt32 playerIds":1,
    },

    //添加黑名单
    "area.friendsHandler.addBadFriend":{
        //好友id
        "optional uInt32 playerId":1,
    },

    //移除黑名单
    "area.friendsHandler.removeBadFriend":{
        //好友id
        "optional uInt32 playerId":1,
    },

    //同意好友请求
    "area.friendsHandler.agreeRequest":{
        //好友id
        "optional uInt32 playerId":1,
    },

    //拒绝好友请求
    "area.friendsHandler.refuseRequest":{
        //好友id
        "optional uInt32 playerId":1,
    },

    //删除好友
    "area.friendsHandler.removeFriend":{
        //好友id
        "optional uInt32 playerId":1,
    },

    //获取好友的随机boss
    "area.playerHandler.getAllFriendsBoss":{

    },

    //获取好友的助战列表
    "area.assistFightHandler.getAllAssistList":{

    },

    //获取训练相关信息
    "area.trainHandler.trainInfo":{

    },
    //训练点击事件
    "area.trainHandler.clickGain":{
        //第一次点击时间
        "optional uInt32 startTime":1,
        //最后一次点击时间
        "optional uInt32 endTime":2,
        //点击次数
        "optional uInt32 clickCnt":3,
        //以下是客户端用
        //点击剩余次数
        "optional uInt32 clickRemainCnt":4,
        //冷却到期时间
        "optional uInt32 clickCoolEndTime":5,
    },
    //训练加速
    "area.trainHandler.quicken":{
        "optional uInt32 type":1,//0是免费 1是钻石刷新
    },

    //新联领取奖励
    "area.trainHandler.gain":{
    },
    // 客户端信息记录
    "area.clientActionHandler.record":{
        // 类型
        "optional uInt32 type":1,//0是设备信息 1是报错信息 3：最后的操作
        // 信息记录
        "optional string msg": 2
    },

    //分享随机boss
    "area.playerHandler.shareRandBoss":{
        "optional uInt32 randomBossId": 1
    },
    // 发送聊天信息
    "chat.chatHandler.send": {
        // 频道
        "optional uInt32 channel": 1,
        // 接收方
        "optional long receiverPid": 2,
        // 聊天内容
        "optional string content": 3
    },

    //碎片合成
    "area.fragItemHandler.equipCompose": {
        //Items表里面的id
        "optional uInt32 itemId": 1
    },
    //英雄技能进阶
    "area.heroHandler.advanceSkill": {
        //英雄位置
        "optional uInt32 pos": 1,
        //技能id
        "optional uInt32 skillId": 2,
        //技能类型
        "optional uInt32 skillType": 3,
        //添加等级
        "optional uInt32 addLV": 4,
    },
    // 无尽乱斗获得道具
    "world.endlessHandler.gainItem": {
        //道具位置
        "optional uInt32 pos": 1,
        //道具id
        "optional uInt32 itemId": 2

    },
    // 无尽乱斗使用道具
    "world.endlessHandler.useItem": {
        //道具位置
        "optional uInt32 pos": 1

    },

    // 使用可选包
    "area.playerHandler.optionGift": {
        // 可选包id
        "optional uInt32 giftItemId": 1,
        // 使用物品列表
        "repeated UseItem giftItems": 2,
        // 可选包id
        "optional uInt32 useItemId": 3,
        // 使用物品列表
        "repeated UseItem useItems": 4,
        // 可选包选择索引
        "repeated uInt32 index": 5,
    },
    // 获取无尽动态信息
    "world.endlessHandler.getEndlessDynamics":{

    },

    "area.playerHandler.goldBox": {

    }

};