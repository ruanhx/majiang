/**
 * Created by rhx on 2017/9/15.
 */
// itemflow 从10000开始
// moneyflow 从1开始
module.exports = {

    HERO_FLOW: {
        //GM后台获得
        GM_GAIN: 20000,
        // 碎片合成
        FRAG_COMPOSE_GAIN: 20001,
        // 角色购买获得
        HERO_BUG_GAIN:20002,
        // 角色购买获得
        HERO_OPEN_LOCK_GAIN:20003,

    },

    ITEM_FLOW: {
        // 活动获得
        ACTIVITY:30000,
        // 角色搜集活动获得
        ACTIVITY_HERO_COLLECT:30001,
        // 邀请码获得
        INVIT_GAIN:30002,
        // 段位赛获得
        DIVISION_GAIN:30003,
        //邮件获取
        MAIL_GAIN:30004,
        // 训练获得
        TRAIN_GAIN:3005,
        // 通关关卡获得
        PASS_BARRIER:30006,
        // 杀死随机boss奖励
        KILL_RAND_BOSS:30007,
        // 协助杀死随机boss奖励
        HELP_KILL_RAND_BOSS:30008,
        // 协助攻打随机boss奖励
        SHARE_PARTICIPATE:30009,
        // 无尽赛果参与奖
        ENDLESS_PRESENT:30010,
        // 无尽赛果获胜奖
        ENDLESS_WIN:30011,
        // 玩家商店购买
        PLAYER_SHOP_BUG:30012,
        // 随机商店购买
        RANDOM_SHOP_BUG:30013,
        // 活动副本获得
        ACTIVITYECTYPE:30014,
        // 序列号兑换获得
        SNEXCHANGE:30015,
        // 购买优惠商店商品
        ACTIVITY_BUY_GOODS:30016,
        // 首充获得
        FIRST_RECHARGE_GAIN:30017,
        //无尽单人
        ENDLESS_SINGLE:30018,
        //无尽开宝箱
        ENDLESS_OPEN_BOX:30019,
        //无尽再次开宝箱
        ENDLESS_REOPEN_BOX:30020,
        //引导获得
        GUIDE_FINISH_GAIN:30021,
        // 角色分解
        HERO_DECOMPOSE_GAIN:30022,
        // 首次购买角色获得
        FIRST_BUY_HERO:30023,
        // 开宝箱
        OPEN_BOX_GAIN:30024,
        // 成就系统
        MISSION_GAIN:30025,
        // 购买关卡宝箱
        BUY_BARRIER_PROMOTE:30026,
        // 领取星级宝箱
        DRAW_CHAPTER_STAR_AWARD:30027,
        // 关卡结算
        EXIT_BARRIER:30028,
        // 可选包获得
        OPTION_GIFT:30029,
        // 关卡扫荡
        BARRIER_WIPE:30030,
        //排行奖励获得
        RANKING_LIST_AWARD:30031,
        // 夺宝获得
        SNATCH_TREASURES:30032
    },
    MONEY_FLOW_COST: {
        // 1：买角色
        HERO_BUY: 1,
        // 2：重置关卡可挑战次数
        RESET_BARROER_CNT: 2,
        // 3：战斗复活
        FIGHT_RESURRECTION: 3,
        // 4：战斗买时间
        FIGHT_BUY_TIME: 4,
        // 5：在商店买什么东西
        SHOP_BUY: 5,
        // 6：买体力
        ENERGY_BUY: 6,
        // 7：活动买东西
        ACITIVTY_BUY: 7,
        // 8：购买装备精炼次数
        REFINE_CNT_BUY: 8,
        //刷新商店
        REFRESH_RAND_SHOP: 9,
        //购买关卡商店
        BARRIERPROMOTE_BUY: 10,
        //购买抓宝次数
        CATCH_COUNT_BUY: 11,
        //进入抓宝小游戏  --理论上用的是钥匙，不过货币类型是配置的所以多做一下预备
        JOIN_CATCH_GAME: 12,
        //刷新段位对手
        REFRESH_DIVISION_OPPONENT: 13,
        //助战
        ASSIST_FIGHT: 14,
        //段位购买次数
        DIVISION_BUY_CNT: 15,
        //无尽BUFF 购买
        ENDLESS_BUFF_BUY_COST: 16,
        //无尽匹配消耗
        ENDLESS_MATCH_COST: 17,
        //无尽开宝箱
        ENDLESS_REOPEN_BOX: 18,
        //装备开启洗练
        EQUIP_OPEN_WASH: 19,
        //装备强化消耗
        EQUIP_STRENGTHEN: 20,
        //装备觉醒消耗
        EQUIP_WAKEUP: 21,
        //装备洗练消耗
        EQUIP_WASH: 22,
        //角色技能升级
        HERO_ADVANCE_SKILL: 23,
        //角色突破
        HERO_BREAKTHROUGH_COST: 24,
        //角色合成
        HERO_COMPOSE: 25,
        //复活猎魔人
        HERO_REVIVE: 26,
        //夺宝消耗
        SNATCH_COST: 27,
        // 摇钱树消耗
        GOLD_BOX_COST:28
    },
    MONEY_FLOW_GAIN: {
        //抓宝奖励
        CATCH_GAIN: 501,
        //装备出售获得
        SELL_EQUIP: 502,
        //GM获得
        GM: 503,
        //角色突破返还
        HERO_BREAKTHROUGH_GAIN: 504,
        //角色分解获得
        HERO_DECOMPOSE_GAIN: 505,
        // 物品出售获得
        ITEM_SELL_GAIN: 506,
        // 无尽匹配没匹配到返还
        ENDLESS_MATCH_GIVEBACK: 507,
        // 摇钱树获得
        GOLD_BOX_GAIN:506
    }
}