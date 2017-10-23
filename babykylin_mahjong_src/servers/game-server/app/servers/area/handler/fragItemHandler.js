/**
 * Created by tony on 2017/3/6.
 */

var Code = require('../../../../shared/code'),
    Consts = require('../../../consts/consts'),
    flow = require('../../../consts/flow'),
    area = require('../../../domain/area/area'),
    dataApi = require('../../../util/dataApi'),
    utils = require('../../../util/utils'),
    Equip = require('../../../domain/entity/equip');
    dataUtils = require('../../../util/dataUtils');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

var pro = Handler.prototype;

/**合成碎片*/
pro.compose = function (msg, session, next) {

    var player = area.getPlayer(session.get('playerId'));
    //要合成的list
    var itemId = msg.itemId;

    var itemData = dataApi.Items.findById(itemId);
    if (null == itemData) {
        return next(null, {code: Code.AREA.ITEM_NOT_EXIST});
    }

    if (player.heroBag.isFull()) {
        return next(null, {code: Code.AREA.HERO_BAG_FULL});
    }

    var heroData = dataApi.HeroAttribute.findById(itemData.value);
    if (!heroData) {
        logger.warn('not found hero : id = %s', itemData.value);
        return next(null, {code: Code.AREA.FA_PLAYER_NOT_EXIST});
    }
   // var grade = heroData.roleGrade;这个是错误,策划说不能用目标角色的评级
    var grade = itemData.quality;//应该使用物品的品质
    var Role_GradePieceNumTmp = dataUtils.getOptionList('Role_GradePieceNum', '#');
    var size = _.size(Role_GradePieceNumTmp);
    var i = 0;
    var gradeToNum = {};
    var lastGrade = 1;
    for (i = 0; i < size; ++i) {
        var Role_GradePieceNumGroup = utils.parseParams(Role_GradePieceNumTmp[i], '&');
        var gradeTmp = Role_GradePieceNumGroup[0];
        var num = Role_GradePieceNumGroup[1];
        gradeToNum[gradeTmp] = num;
        lastGrade = lastGrade < gradeTmp ? gradeTmp : lastGrade;
    }

    grade = grade > lastGrade ? lastGrade : grade;

    var needNum = gradeToNum[grade];

    var mCnt = player.fragBag.getItemTotal(itemId);
    if (needNum > mCnt) {
        return next(null, {code: Code.FRAG_COMPOSE.NUM_ERROR});
    }

    var needItemList = player.fragBag.findItems(itemId, needNum);

    player.fragBag.removeItems(needItemList);


    //奖励英雄
    var tempHeroPos = player.addHero(heroData, 0, 1,flow.HERO_FLOW.FRAG_COMPOSE_GAIN);
    var tempHero = player.heroBag.getItemByPos(tempHeroPos)
    return next(null, {code: Code.OK, hero: tempHero.getClientInfo()});
};
/**
 * 装备碎片合成
 * @param msg
 * @param session
 * @param next
 * @returns {*}
 */
pro.equipCompose = function (msg, session, next) {
    var player = area.getPlayer(session.get('playerId'));
    var itemId = msg.itemId;
    var itemData = dataApi.Items.findById(itemId);
    if (null == itemData) {
        return next(null, {code: Code.AREA.ITEM_NOT_EXIST});
    }
    if (player.equipBag.isFull()) {
        return next(null, {code: Code.AREA.HERO_BAG_FULL});
    }
    var equipData = dataApi.Equip.findById(itemData.value);
    if (!equipData) {
        logger.warn('not found hero : id = %s', itemData.value);
        return next(null, {code: Code.AREA.FA_PLAYER_NOT_EXIST});
    }
    //var grade = equipData.quality;这个是错误,策划说不能用目标装备的品质
    var grade = itemData.quality;//应该使用物品的品质
    // 通过配置取需要消耗的碎片数量
    var Role_GradePieceNumTmp = dataUtils.getOptionList('Role_QualityPieceNum', '#');
    var size = _.size(Role_GradePieceNumTmp);
    var i = 0;
    var gradeToNum = {};
    var lastGrade = 1;
    for (i = 0; i < size; ++i) {
        var Role_GradePieceNumGroup = utils.parseParams(Role_GradePieceNumTmp[i], '&');
        var gradeTmp = Role_GradePieceNumGroup[0];
        var num = Role_GradePieceNumGroup[1];
        gradeToNum[gradeTmp] = num;
        lastGrade = lastGrade < gradeTmp ? gradeTmp : lastGrade;
    }
    grade = grade > lastGrade ? lastGrade : grade;
    var needNum = gradeToNum[grade];
    var mCnt = player.fragBag.getItemTotal(itemId);
    //  需要的数量是否足够
    if (needNum > mCnt) {
        return next(null, {code: Code.FRAG_COMPOSE.NUM_ERROR});
    }
    // 消耗碎片
    var needItemList = player.fragBag.findItems(itemId, needNum);
    player.fragBag.removeItems(needItemList);
    // 添加装备
    var equip = new Equip({playerId: player.id, equipId: equipData.id,isNew:0});
    player.equipBag.add(equip);

    return next(null, {code: Code.OK,equip:equip.getClientInfo()});
};