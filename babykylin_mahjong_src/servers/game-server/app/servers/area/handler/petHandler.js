/**
 * Created by employee11 on 2016/3/3.
 */

var _ = require('underscore'),
    logger = require('pomelo-logger').getLogger(__filename);

var area = require('../../../domain/area/area'),
    Code = require('../../../../shared/code'),
    hasBuyPetDao = require('../../../dao/hasBuyPetDao'),
    dataApi = require('../../../util/dataApi'),
    dataUtils = require('../../../util/dataUtils'),
    Consts = require('../../../consts/consts');

var Handler = function (app) {
    this.app = app;
};

module.exports = function (app) {
    return new Handler(app);
};

var pro = Handler.prototype;

/*
 *   计算材料总经验
 * */
function calculateTotalExp(player, items, pets) {
    items = items || [];
    var totalExpValue = _.reduce(items, function (memo, item) {
        var bagItem = player.bag.getItem(item.pos);
        if (bagItem) {
            return memo + (item.count * bagItem.getValue());
        }
        return memo;
    }, 0);

    pets = pets || [];
    totalExpValue += _.reduce(pets, function (memo, pet) {
        var petObj = player.petBag.getItemByPos(pet);
        if (petObj) {
            return memo + petObj.getTotalExp();
        }
        return memo;
    }, 0);

    return totalExpValue;
}

/*
 *   材料是否足够
 * */
function isItemEnough(player, items, pets) {
    items = items || [];
    var itemEnough = _.every(items, function (item) {
        var bagItem = player.bag.getItem(item.pos);
        return (!!bagItem && bagItem.getType() === Consts.ITEM_TYPE.PET_EXP_ITEM
        && player.bag.isItemEnough(item.pos, item.count));
    });

    pets = pets || [];
    var petEnough = _.every(pets, function (pet) {
        return !!player.petBag.getItemByPos(pet);
    });

    return (itemEnough && petEnough);
}

function isItemsValid(items) {
    var itemsByPos = _.groupBy(items, 'pos');
    return _.every(itemsByPos, function (itemList) {
        return itemList.length === 1;
    });
}

function isPetPosListValid(petPosList) {
    var heroPosInfoListByPos = _.groupBy(petPosList, function (pos) {
        return pos;
    });
    return _.every(heroPosInfoListByPos, function (posInfoList) {
        return posInfoList.length === 1;
    });
}

/*
 *   购买宠物
 * */
pro.buyPet = function (msg, session, next) {
    var playerId = session.get('playerId');
    var player = area.getPlayer(playerId);

    if (player.petBag.isFull()) {
        return next(null, {code: Code.PET.PET_BAG_FULL});
    }
    var petData = dataApi.PetAttribute.findById(msg.petId);
    if (!petData) {
        return next(null, {code: Code.PET.PET_IS_NOT_EXIST});
    }
    hasBuyPetDao.getHasBuyPet(playerId, msg.petId, function (err, result) {
        if (!!err) {
            return next(null, {code: Code.DB_ERROR});
        }
        if (!!result && result.length > 0) {
            if (player.diamondCnt < petData.buyMoneyNum) {
                return next(null, {code: Code.DIAMOND_NUM_NOT_ENOUGH});
            }
            player.setDiamond(player.diamondCnt - petData.buyMoneyNum);
            var slot = player.addPet(petData);
            if (!slot) {
                return next(null, {code: Code.PET.ADD_PET_FAILED});
            }
            next(null, {code: Code.OK, costDiamond: heroData.firstBuyMoneyNum, pos: slot});
        } else {
            if (player.diamondCnt < petData.firstBuyMoneyNum) {
                return next(null, {code: Code.DIAMOND_NUM_NOT_ENOUGH});
            }
            hasBuyPetDao.addHasBuyPet(playerId, msg.petId, function (err, result) {
                if (!!err) {
                    return next(null, {code: Code.DB_ERROR});
                } else {
                    player.setDiamond(player.diamondCnt - petData.firstBuyMoneyNum);
                    var slot = player.addPet(petData);
                    if (!slot) {
                        return next(null, {code: Code.PET.ADD_PET_FAILED});
                    }
                    next(null, {code: Code.OK, costDiamond: petData.firstBuyMoneyNum, pos: slot});
                }
            });
        }
    });
};

/*
 *   宠物升级
 * */
pro.petUpgrade = function (msg, session, next) {
    var playerId = session.get('playerId'),
        player = area.getPlayer(playerId),
        pet = player.petBag.getItemByPos(msg.pos),
        items = msg.items || [],
        pets = msg.pets || [];
    logger.debug('petUpgrade post = %s, items = %j, pets = %j', msg.pos, msg.items, msg.pets);
    if (!isItemsValid(items)) {
        logger.debug('petUpgrade invalid item found!');
        return next(null, {code: Code.FAIL});
    }
    if (!isPetPosListValid(pets) || _.contains(pets, msg.pos)) {
        logger.debug('petUpgrade invalid pet found!');
        return next(null, {code: Code.FAIL});
    }
    if (!pet) {
        return next(null, {code: Code.AREA.PET_NOT_EXIST});
    }
    if (pet.lv >= pet.getMaxLV()) {
        return next(null, {code: Code.AREA.LV_UPPER_LIMIT});
    }
    if (!isItemEnough(player, items, pets)) {
        return next(null, {code: Code.AREA.ITEM_NOT_ENOUGH});
    }
    var totalExpValue = calculateTotalExp(player, items, pets),
        totalCost = Math.ceil(dataUtils.getOptionValue(Consts.CONFIG.LV_UP_COST_COE, 1) * totalExpValue);
    if (player.goldCnt < totalCost) {
        return next(null, {code: Code.AREA.GOLD_NOT_ENOUGH});
    }
    player.set('goldCnt', player.goldCnt - totalCost);
    player.bag.removeItems(items);
    player.petBag.removeByPosList(pets);
    pet.lvUp(totalExpValue);
    player.petBag.emit('update', pet);
    next(null, {code: Code.OK, costGold: totalCost});
};

/*
 *   宠物突破
 * */
pro.petBreakthrough = function (msg, session, next) {
    var playerId = session.get('playerId'),
        player = area.getPlayer(playerId),
        dstPet = player.petBag.getItemByPos(msg.pos);
    if (!dstPet) {
        next(null, {code: Code.AREA.PET_NOT_EXIST});
        return;
    }
    if (dstPet.lv < dstPet.getMaxLV()) {
        next(null, {code: Code.AREA.LV_NOT_ENOUGH});
        return;
    }

    var bagItemTotal = player.bag.getItemTotal(dstPet.getNeedMat1());
    if (bagItemTotal < dstPet.getNeedMat1Cnt()) {
        return next(null, {code: Code.AREA.ITEM_NOT_ENOUGH});
    }
    var useItemInfo = player.bag.findItems(dstPet.getNeedMat1(), dstPet.getNeedMat1Cnt()),
        availablePets = player.petBag.filter(function (bagPet) {
            return (bagPet.getPetId() === dstPet.getNeedMat2() && bagPet.pos !== dstPet.pos);
        });
    if (dstPet.getNeedMat2Cnt() > availablePets.length) {
        logger.debug('petBreakthrough pet not enough');
        return next(null, {code: Code.AREA.NOT_ENOUGH_PET});
    }
    var usePets = _.pluck(availablePets.slice(0, dstPet.getNeedMat2Cnt()), 'pos');
    if (player.goldCnt < dstPet.getNeedMoney()) {
        next(null, {code: Code.AREA.GOLD_NOT_ENOUGH});
        return;
    }
    player.set('goldCnt', player.goldCnt - dstPet.getNeedMoney());
    player.bag.removeItems(useItemInfo);
    player.petBag.removeByPosList(usePets);
    dstPet.qualityUp();
    player.petBag.emit('update', dstPet);
    next(null, {code: Code.OK, costGold: dstPet.getNeedMoney()});
};
