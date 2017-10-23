/**
 * Created with JetBrains WebStorm.
 * User: kilua
 * Date: 13-10-15
 * Time: 下午5:34
 * To change this template use File | Settings | File Templates.
 */

module.exports = {
	//玩家最大活动区域
    PLAYER_ACTIVE_REGION:{
        LENGTH: 350,
        WIDTH: 400,
        LEFT: 30,
        BOTTOM: 190
    },
    // 怪物最大活动区域
    MOB_ACTIVE_REGION:{
        LENGTH: 400,
        WIDTH: 400,
        LEFT: 530,
        BOTTOM: 190
    },
    // 技能范围类型,从右往左看
    SKILL_SCOPE_TYPE:{
        NONE: 0,
        LEFT_RIGHT: 1,  // 横条(左-右)
        RIGHT_LEFT: 2,  // 横条(右-左)
        TOP_DOWN: 3,    // 竖条(上-下)
        BOTTOM_UP: 4,   // 竖条(下-上)
        LEFT_DOWN: 5,   // 左上-右下
        RIGHT_UP: 6,    // 右下-左上
        LEFT_UP: 7,     // 左下-右上
        RIGHT_DOWN: 8,  // 右上-左上
        POINT: 9        // 点
    },
    // 对象类型
    ENTITY_TYPE: {
        PLAYER: 1,
        MOB: 2,         // 怪物
        HERO: 3,
        ROBOT_HERO: 4   // 机器人英雄
    },
    // 回合类型
    ROUND_TYPE: {
        PLAYER_ROUND: 1,    // 玩家回合
        AI_ROUND: 2         // AI回合
    },
    // AI回合阶段
    AI_ROUND: {
        PHASE_MOVE: 2 * 1000,   // 只能移动，不可攻击阶段,单位ms
        PHASE_ATTACK: 20 * 1000	// 可攻击阶段，单位ms
    },
    // 进入关卡可以选择的关卡数量
    SELECT_CARD: {
        MIN: 6,
        MAX: 10
    },
    // 技能类型
    SKILL_TYPE:{
        NULL: 0,                    // 空技能
        HURT: 1,                    // 普通伤害
        CURE: 2,                    // 普通治疗
        ADJUST_CD: 3,               // cd 调整
        DOT: 101,                   // dot 技能
        HOT: 102,                   // hot 技能
        REBIRTH: 103,               // 复活技能
        SHIELD: 104,                // 护盾
        COUNTER_STRIKE: 107,        // 反击
        SACRIFICE: 109,             // 献祭
        DOT_ADDITION: 110,          // DOT 加/减成
        DAZE: 114,                  // 眩晕技能
        PETRIFY: 115,               // 石化 buff
        SILENCE: 118,               // 沉默
        ADD_PROP: 201,              // 属性加减
        MULTI_HURT: 202,            // 多倍伤害
        SUCK_ON_ATTACK: 203,        // 攻击吸血
        ADJUST_CD_BUFF: 205,        // 调整 CD buff
        ADJUST_USER_CD: 206,        // 施法者调整CD
        PURSUE: 207,                // 追击
        ADJUST_FINAL_HURT: 208,     // 调整最终伤害
        MULTI_CUT: 209              // 多人斩
    },
    // 技能类型
    SKILL_KIND:{
        NONE: 0,
        NORMAL: 1,                  // 普通
        SPECIAL: 2,                 // 特殊
        SUPER: 3                    // 大招
    },
    // 增减的技能cd类型,须和SKILL_KIND同步
    ADJUST_SKILL_KIND: {
        NORMAL: 1,      // 普通
        SPECIAL: 2,     // 特殊
        SUPER: 3,       // 大招
        ALL: 4          // 所有
    },
    // buff 生效方式
    BUFF_FLAG: {
        NO_BUFF: 0,     // 非 buff
        AURA: 1,        // 光环
        ATTACH: 2,      // 单次生效
        NORMAL: 3       // 普通
    },
    MAX_TAG: 3,         // 怪物标签数量
    RACE:{              // 种族
        NONE: 0,
        HUMAN: 1,       // 人类
        FAIRY: 2,       // 精灵
        DEMON: 3		// 恶魔
    },
    // 标签数值和名称的映射表
    tagMap: {
        10: 'A',
        20: 'B',
        30: 'C',
        40: 'D',
        50: 'E',
        60: 'F'
    },
    // 种族相克系数
    RACE_RESTRICTION: 0.25,
    // 种族相克
    RACE_RESTRICT_MAP: {
        0: {0: 0, 1: 0, 2: 0, 3: 0},
        1: {0: 0, 1: 0, 2: 1, 3:-1},
        2: {0: 0, 1: -1, 2: 0, 3: 1},
        3: {0: 0, 1: 1, 2: -1, 3: 0}
    },
    // 服务器下发的随机率表中的type
    CHANCE: {
        DUCK: 1,    // 闪避
        CRIT: 2     // 暴击
    },
    REFRESH_MOB_MAX_TYPE: 4,        // 关卡一幕出怪的最大种数
    DROP_MAX_CHANCE: 1000000,
    // 最大掉落概率
    DROP_TYPE:{
        DT_CARD: 0,                 // 卡牌
        DT_ITEM: 1,                 // 装备
        DT_FRAG: 2,                 // 碎片
        DT_MONEY: 3,                // 货币
        DT_EXP: 4,                  // 经验
        DT_CARD_PKG: 5              // 卡包
    },
    // 技能目标类型
    SKILL_TARGET_TYPE: {
        ENEMY: 1,
        US: 2,
        ALL: 3,
        FOLLOW_MAIN: 4    // 跟随主技能
    },
    // 技能目标优先级
    SKILL_TARGET_PRIOR:{
        SUPER: 0,                   // 大招没有优先级
        FRONT: 1,                   // 前排
        MIDDLE: 2,                  // 中排
        BACK: 3,                    // 后排
        ALL: 4,                     // 某方全体
        MAX_HP_PERCENT: 5,          // 血量百分比最多单体
        MIN_HP_PERCENT: 6,          // 血量百分比最少单体
        MAX_HP: 7,                  // 血量最多单体
        MIN_HP: 8,                  // 血量最少单体
        SELF: 9,                    // 自己
        LAST_ATTACKER: 10,          // 最近一个攻击自己的对象
        RANDOM_ONE: 11,             // 随机1单位
        RANDOM_TWO: 12,             // 随机2单位
        RANDOM_THREE: 13,           // 随机3单位
        NORMAL_SKILL_MAX_CD: 14,    // 普通技能剩余CD最长
        SPECIAL_SKILL_MAX_CD: 15,   // 特殊技能剩余CD最长
        SUPER_SKILL_MAX_CD: 16      // 大招剩余CD最长
    },
    // 战场位置
    BATTLE_FIELD_POS:{
        FRONT: 1,           // 前排
        MIDDLE: 2,          // 中排
        BACK: 3             // 后排
    },
    CRIT_RATIO: 2,          // 暴击伤害倍率
    MIN_HURT: 1,            // 最小伤害
    BATCH_REPORT: 1,
    // buff 类型
    BUFF_TYPE: {
        POSITIVE: 1,    // 正面
        NEGATIVE: 2     // 负面
    },
    // 装备位置
    ARM_POS: {
        // 魔典
        MAGIC_BOOK: 1,
        // 符文
        RUNE: 2,
        // 项链
        NECKLACE: 3,
        // 微章
        BADGE: 4,
        // 圣物
        RELIC: 5,
        // 魔法球
        MAGIC_BALL: 6,
        MAX: 7
    },
    EQUIP_MAX_ITEM_ID: 100000    // 暂定，装备最大数据ID，这个值以上是装备，以上是物品
};