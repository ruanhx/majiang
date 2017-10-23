/**
 * Created with JetBrains WebStorm.
 * User: kilua
 * Date: 13-9-28
 * Time: 下午2:33
 * To change this template use File | Settings | File Templates.
 */

var formula = module.exports = {};

/*
*   计算一般伤害
*   @param {Number} playerRaceAtk 主角种族攻击力
*   @param {Number} playerVSMobTagRestrictTotal 主角怪物标签相克系数总和
*   @param {Number} cardAtk 卡牌攻击力
*   @param {Number} cardVSMobTagRestrictTotal 卡牌和怪物标签相克系数总和
*   @param {Number} defense 防御力
*   @param {Number} ratio1 技能系数1
*   @param {Number} ratio2 技能系数2
*   @param {Number} ratio3 技能系数3
*   @param {Number} raceRestrict 种族相克系数
* */
formula.getHurt = function(playerRaceAtk, playerVSMobTagRestrictTotal, cardAtk, cardVSMobTagRestrictTotal, defense, ratio1
    , ratio2, ratio3, raceRestrict){
    return Math.max(playerRaceAtk * ratio1 * (1 + playerVSMobTagRestrictTotal) + (cardAtk * ratio2 + ratio3)
        * (1 + raceRestrict + cardVSMobTagRestrictTotal) - defense, 0);
};
/*
*   暴击伤害公式
*   @param {Number} normalHurt 一般伤害
*/
formula.getCritHurt = function(normalHurt){
    return normalHurt * 2;
};
///*
//*   治疗值公式
//*   @param {Number} atk 卡牌或怪物攻击力
//*   @param {Number} skillRatio2 技能系数2
//*   @param {Number} skillRatio3 技能系数3
//* */
//formula.getCure = function(atk, skillRatio2, skillRatio3){
//    return atk * skillRatio2 + skillRatio3;
//};

/*
 *   治疗公式修订版 12-20
 *   @param raceAtk 主角种族攻击力。主角使用时，根据卡牌的种族取主角对应的该种族攻击力，怪物使用时，取0.
 *   @param ratio1 系数1。从技能表读取。
 *   @param tagRestrictTotal标签相克系数之和。
 *   @param cardAtk 卡牌(怪物)攻击力
 *   @param ratio2 系数2。从技能表读取。
 *   @param ratio3 系数3.从技能表读取。
 *   @param cardVSTargetRaceRestrictRatio 卡牌(怪)于目标种族相克系数
 *   @param cardVSTargetTagRestrictTotal 卡牌(怪)于目标种族相克系数之和
 * */
formula.getCure = function(raceAtk, ratio1, tagRestrictTotal, cardAtk, ratio2, ratio3, cardVSTargetRaceRestrictRatio
    , cardVSTargetTagRestrictTotal){
    return Math.max(raceAtk * ratio1 * (1 - tagRestrictTotal) + (cardAtk * ratio2 + ratio3) * (1
        - cardVSTargetRaceRestrictRatio - cardVSTargetTagRestrictTotal), 0);
};
/*
*   暴击治疗值
*   @param {Number} normalCure 普通治疗值
* */
formula.getCritCure = function(normalCure){
    return normalCure * 1.5;
};
///*
//*   护盾吸收值
//*   @param {Object} card 卡牌
//* */
//formula.getAbsorb = function(atk, ratio2, ratio3){
//    return atk * ratio2 + ratio3;
//};
/*
*   人物暴击率公式
*   @param {Number} playerCrit 人物暴击等级(如果是怪，则传0)
*   @param {Number} cardCrit 卡牌等级
*   @param {Number} targetLV 受击方等级
* */
//var a = 11.89, b = 182, c = -66;
formula.getCritChance = function(playerCrit, cardCrit, targetStdVal){
    return Math.min((playerCrit + cardCrit)/ (targetStdVal), 0.4);
};
///*
//*   卡牌和怪物暴击率公式
//*   @param {Number} crit 暴击等级
//*   @param {Number} targetLV 受击方等级
//* */
//var d = 1, e = 1, f = 1;    // 系数,实数
//formula.getMobOrCardCritChance = function(crit, targetLV){
//    return (crit / (d * Math.pow(targetLV, 2) + e * targetLV + f));
//};

/*
*   闪躲率公式
*   @param {Number} duck 闪躲等级
*   @param {Number} attackerLV 攻击方等级
* */
//var g = 11.89, h = 182, i = -66;
formula.getDuckChance = function(duck, stdVal){
    return Math.min((duck / (stdVal)), 0.4);
};
/*
* 卡牌怪物能力公式
* @param {Number} ratio 系数
* @param {Number} stdAbility 标准能力
* @param {Number} quality 品质/品质系数
* */
formula.getMobOrCardAbility = function(ratio, stdAbility, quality){
    return ratio * stdAbility * quality;
};

/*
*   卡牌怪物暴击等级公式
* */
formula.getMobOrCardCrit = function(ratio, stdAbility){
    return ratio * stdAbility;
};