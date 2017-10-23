/**
 * Created by Administrator on 2016/3/3 0003.
 */

var _ = require('underscore');

var dataApi = require('../../util/dataApi'),
    utils = require('../../util/utils'),
    Consts = require('../../consts/consts');

var exp = module.exports = {};

/*
 *   权重换算成百分比
 * */
function normalizeChance(groupItems, chanceTotal) {
    var elems = [];
    _.each(groupItems || [], function (item) {
        // 修改数据前先拷贝，否则会把表给改掉
        var elem = utils.clone(item);
        elems.push(elem);
        if( item.probability >0 && item.probability<1 )
        {

        }
        else
        {
            elem.probability = elem.probability / chanceTotal;
        }
    });
    return elems;
}

function probabilityCalculation(groupItems)
{
    var elems = [];
    _.each(groupItems || [], function (item) {
        // 修改数据前先拷贝，否则会把表给改掉
        var elem = utils.clone(item);
        elems.push(elem);
    });
    return elems;
}

/*
 *   获取一个标准掉落表id对应的掉落条目，并将其掉落权重转成百分比
 * */
function getGroupItems(groupId) {
    var groupItems = dataApi.DropItemNormal.findBy('normalId', groupId);
    var  chanceTotal = _.reduce(groupItems, function (memo, item) {
        return memo + item.probability;
    }, 0);
    return normalizeChance(groupItems, chanceTotal);
}

/*
 *   生成掉落物品
 * */
function makeDrop(dropItem) {
    var drop = {};
    drop.dropType = dropItem.dropType;
    drop.itemId = dropItem.itemType;
    drop.parameterId =  dropItem.parameterId;
    // 随机数量
    drop.count = _.random(dropItem.minDropNum, dropItem.maxDropNum);

    if (drop.count > 0)
        return drop;
}

/*
 *   单独计算一组掉落的掉落物品
 * */
function getRndDrop(groupItems) {
    var chance = Math.random(), i, item;
    for (i = 0; i < groupItems.length; ++i) {
        item = groupItems[i];
        //console.log('chance : %s , probability: %s',chance,item.probability);
        chance -= item.probability;

        if (chance < 0) {
            return makeDrop(item);
        }
    }
}

/*
 *   根据指定掉落索引id，计算掉落物品
 * */
exp.getDropItems = function (dropIndex) {
    var dropGroups = dataApi.DropItemIndex.findBy('indexId', dropIndex),
        drops = [];
    _.each(dropGroups, function (dropGroup) {
        var drop = getRndDrop(getGroupItems(dropGroup.normalId));
        if (drop) {
            var index = findIndex(drops,drop);
            if(index!=-1){
                drops[index].count = drops[index].count + drop.count;
            }else {
                drops.push(drop);
            }
        }
    });

    return drops;
};

/*
 *   根据指定掉落索引id，计算掉落物品
 * */
exp.getDropItemsByCount = function (dropIndex,count) {
    var dropGroups = dataApi.DropItemIndex.findBy('indexId', dropIndex),
        drops = [];
    _.each(dropGroups, function (dropGroup) {
        var drop = getRndDrop(getGroupItems(dropGroup.normalId));
        if (drop){
            drop.count = drop.count * count;
        }
        if (drop) {
            drops.push(drop);
        }
    });

    return drops;
};
function findIndex(drops,drop) {
    var index = -1;
    for (var i=0;i<drops.length;i++){
        if(drop.dropType == drops[i].dropType&&drop.itemId == drops[i].itemId){
            return i;
        }
    }
    return index;
}
exp.getDropItemsByDropIndexs = function (dropIndexs) {
   var drops = [];
    _.each(dropIndexs,function (dropIndex) {
        var dropGroups = dataApi.DropItemIndex.findBy('indexId', dropIndex);
        _.each(dropGroups, function (dropGroup) {
            var drop = getRndDrop(getGroupItems(dropGroup.normalId));
            if (drop) {
                var index = findIndex(drops,drop);
                if(index!=-1){
                    drops[index].count = drops[index].count + drop.count;
                }else {
                    drops.push(drop);
                }
            }
        });
    });
    return drops;
};

exp.makeGoldDrop = function (count) {
    var drop = {};
    drop.dropType = Consts.DROP_TYPE.MONEY;
    drop.itemId = Consts.MONEY_TYPE.GOLD;
    drop.count = count;
    return drop;
};

exp.makeMoneyDrop = function (moneyType, count) {
    var drop = {};
    drop.dropType = Consts.DROP_TYPE.MONEY;
    drop.itemId = moneyType;
    drop.count = count;
    return drop;
};

exp.makeItemDrop = function (itemId, count) {
    var drop = {};
    drop.dropType = Consts.DROP_TYPE.MATERIAL;
    drop.itemId = itemId;
    drop.count = count;
    return drop;
};

exp.isDoubleTime= function ( id ){
    var dateTime = new Date( Date.now() );
    var currTime = parseInt(dateTime.getHours()) + dateTime.getMinutes()/60;
    var data = dataApi.EndlessType.findById(id);
    var timeRange = data.cupAddTime.split('#');
    var tempRange = data.cupAddLastTime.split('#');
    var isDouble = false;
    if(data.type !=2){
        return false;
    }
    for (var i=0;i<timeRange.length;i++){
        var limitDate = timeRange[i].split('&');
        var tempDate = tempRange[i].split('&');
        var tempTime = parseInt(tempDate[0])+tempDate[1]/60;
        var needTime = parseInt(limitDate[0])+limitDate[1]/60;
        var isDouble =currTime >=needTime && currTime<(needTime+tempTime);
        if(isDouble){
            return isDouble;
        }
    }
    return isDouble;
};

//console.log(exp.getDropItems(1));