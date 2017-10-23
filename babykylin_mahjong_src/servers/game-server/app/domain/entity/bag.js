/**
 * Created by lishaoshen on 2015/11/3.
 */

var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var _ = require('underscore');

var dataApi = require('../../util/dataApi'),
    itemLog = require('../area/itemLog'),
    Consts = require('../../consts/consts');

var Item = function (opts) {
    opts = opts || {};
    this.playerId = opts.playerId;
    this.pos = opts.pos;
    this.itemId = opts.itemId;
    this.itemCount = opts.itemCount;
    this.data = dataApi.Items.findById(this.itemId);
    if (!this.data) {
        console.log('Items.id = %s not found!', this.itemId);
    }
};
Item.prototype.clearItem = function(){
    delete this.playerId;
    delete this.pos;
    delete this.itemId;
    delete this.itemCount;
    delete this.data;
}

Item.prototype.getClientInfo = function () {
    return {pos: this.pos, itemId: this.itemId, itemCount: this.itemCount}
};

Item.prototype.getData = function () {
    return {playerId: this.playerId, pos: this.pos, itemId: this.itemId, itemCount: this.itemCount}
};

Item.prototype.getType = function () {
    return this.data.type;
};

Item.prototype.getValue = function () {
    return this.data.value;
};

Item.prototype.getSellPrice = function () {
    return this.data.sellPrice;
};
//RESERVE
var Bag = function (opts,reserveCnt) {
    opts = opts || {};
    EventEmitter.call(this);
    this.reserveCnt = reserveCnt||10;
    this.maxBagCount = (opts.maxSlot || Consts.BAG_MAX_SLOT) + reserveCnt;
    this.load(opts.itemData);
};

util.inherits(Bag, EventEmitter);

module.exports = Bag;

Bag.prototype.clearBag = function(){
    delete this.reserveCnt;
    delete this.maxBagCount;

    for(var key in this.items){
        this.items[key].clearItem();
        delete this.items[key];
    }
    delete this.items;

    this.removeAllListeners();
}

Bag.prototype.load = function (dbItems) {
    var self = this;
    self.items = {};
    dbItems = dbItems || [];
    dbItems.forEach(function (dbItem) {
        self.items[dbItem.pos] = new Item(dbItem);
    });
};

Bag.prototype.getItem = function (pos) {
    return this.items[pos];
};

Bag.prototype.getAllItem = function () {
    return _.values(this.items);
};

Bag.prototype.getEmptySlotCnt = function () {
    var emptySlotCnt = 0;
    for (var i = 1; i <= this.maxBagCount; i++) {
        if (!this.getItem(i)) {
            emptySlotCnt++;
        }
    }
    return emptySlotCnt;
};

/*
 *   背包是否有足够的空格
 * */
Bag.prototype.isHasPosition = function () {
    return (this.getEmptySlotCnt() > this.reserveCnt);
};

/*
 *   查找空格
 *   @return {Number} 格子编号或0，0表示没有空格
 * */
Bag.prototype.getEmptySlot = function (startPos) {
    for (var m = startPos; m <= this.maxBagCount; m++) {
        if (!this.getItem(m)) {
            return m;
        }
    }
    return 0;
};

/*
 *   在指定格子放入指定的所有物品或放满该格
 *   @param {Number} pos
 *   @param {Object} item {playerId: ?, itemId: ?, count: ?}
 *   @return {Number} 放入的数量
 * */
Bag.prototype.putItem = function (pos, item) {
    var itemData = dataApi.Items.findById(item.itemId);
    if (!itemData) {
        return 0;
    }
    var stackMax = (itemData.canOverlay === 0) ? 1 : itemData.canOverlay,
        bagItem = this.getItem(pos), putCnt;
    if (bagItem) {
        if (bagItem.itemId === item.itemId && stackMax > 1) {
            putCnt = Math.min(item.count, stackMax - bagItem.itemCount);
            this.setItemCount(pos, bagItem.itemCount + putCnt);
            return putCnt;
        }
        return 0;
    }
    putCnt = Math.min(stackMax, item.count);
    var newItem = this.items[pos] = new Item({
        playerId: item.playerId,
        pos: pos,
        itemId: item.itemId,
        itemCount: putCnt
    });
    this.emit('save', newItem);
    return putCnt;
};

/*
 *   设置格子的物品数量
 *   @param {Number} pos
 *   @param {Number} cnt 该格子的新的物品数量
 * */
Bag.prototype.setItemCount = function (pos, cnt) {
    var item = this.getItem(pos);
    if (item) {
        item.itemCount = cnt;
        this.emit('save', item);
        if (item.itemCount <= 0) {
            delete this.items[pos];
        }
        return true;
    }
    return false;
};
/*
* 获取物品数量
* **/
Bag.prototype.getItemCount = function(pos){
    var item = this.getItem(pos);
    var curCnt = 0;
    if (item) {
        curCnt = item.itemCount;
    }
    return curCnt;
};

/*
 *   查找指定物品的未放满的格子
 *   @param {Number} itemId
 *   @return {Number} 格子编号
 * */
Bag.prototype.getNotFullSlot = function (startPos, itemId) {
    var itemData = dataApi.Items.findById(itemId);
    if (!itemData) {
        return 0;
    }
    for (var i = startPos; i <= this.maxBagCount; i++) {
        var item = this.getItem(i);
        if (item && item.itemId === itemId && item.itemCount < itemData.canOverlay) {
            return i;
        }
    }
    return 0;
};

/*
 *   查找可以放入的格子，包括空格或未满的格子
 *   @param {Object} item {playerId: ?, itemId: ?, count: ?}
 *   @return {Array} 可以放入的格子列表
 * */
Bag.prototype.findSlots = function (item) {
    var itemData = dataApi.Items.findById(item.itemId),
        slots = [], slot, total = item.count,
        stackMax = (itemData.canOverlay === 0) ? 1 : itemData.canOverlay;
    if (!itemData) {
        return [];
    }
    if (stackMax > 1) {
        // 可叠加物品
        // 优先找未满的格子放入
        slot = 0;
        for (var i = 1; i <= this.maxBagCount; i++) {
            slot = this.getNotFullSlot(slot + 1, item.itemId);
            if (!slot) {
                break;
            }
            slots.push(slot);

            var bagItem = this.getItem(slot);
            total -= Math.min(total, stackMax - bagItem.itemCount);
            if (total <= 0) {
                return slots;
            }
        }
    }
    // 再找空格放入
    slot = 0;
    for (var j = 1; j <= this.maxBagCount; j++) {
        slot = this.getEmptySlot(slot + 1);
        if (!slot) {
            break;
        }
        slots.push(slot);

        total -= Math.min(total, stackMax);
        if (total <= 0) {
            break;
        }
    }
    return (total > 0) ? [] : slots;
};

/*
 *   是否可以放入指定物品
 *   @param {Object} item {playerId: ?, itemId: ?, count: ?}
 * */
Bag.prototype.canAdd = function (item) {
    var slots = this.findSlots(item);
    return (slots.length > 0);
};
/*
 *   添加物品
 *   @param {Object} item {playerId: ?, itemId: ?, count: ?}
 *   @return {Array} 返还放入的格子列表
 * */
Bag.prototype.addItem = function (item) {
    var self = this,
        slots = self.findSlots(item);
    slots.forEach(function (slot) {
        item.count -= self.putItem(slot, item);
    });
    return slots;
};

/*
 *   使用物品
 **/
Bag.prototype.useItem = function (pos, count) {
    var bagItem = this.getItem(pos);
    this.setItemCount(pos, bagItem.itemCount - count);
    return bagItem;
};

/*
 *   物品是否足够
 * */
Bag.prototype.isItemEnough = function (pos, count) {
    var item = this.getItem(pos);
    return (item && item.itemCount >= count);
};

/*
 *   组织下发给客户端的数据
 * */
Bag.prototype.getClientInfo = function () {
    return _.map(this.items, function (item) {
        return item.getClientInfo();
    });
};

Bag.prototype.getItemTotal = function (itemId) {
    return _.reduce(this.items, function (memo, item) {
        if (item.itemId === itemId) {
            return memo + item.itemCount;
        }
        return memo;
    }, 0);
};

Bag.prototype.clear = function () {
    var self = this;
    _.each(self.items, function (item, pos) {
        self.setItemCount(pos, 0);
    });
};

Bag.prototype.findItems = function (itemId, cnt) {
    var pos, item, total = 0, resultItems = [], pickCount;
    for (pos in this.items) {
        item = this.items[pos];
        if (item && item.itemId === itemId && total < cnt) {
            pickCount = Math.min(item.itemCount, cnt - total);
            total += pickCount;
            resultItems.push({pos: item.pos, count: pickCount});
        }
        if (total >= cnt) {
            break;
        }
    }
    return resultItems;
};

Bag.prototype.removeItems = function (items) {
    var self = this;
    items = items || [];
    items.forEach(function (item) {
        self.useItem(item.pos, item.count);
    });
};

Bag.prototype.checkAddItems = function(itemsMap){
    var self = this;
    var checkId = [];
    var sumSlots = 0;
    for(var key in this.items){
        var item = this.items[key];
        var itemCount = itemsMap[item.itemId];
        if(itemCount){
            var itemData = dataApi.Items.findById(item.itemId)
            var stackMax = (itemData.canOverlay === 0) ? 1 : itemData.canOverlay;
            if(stackMax>1){
                //可叠加 - -
                if(stackMax != item.itemCount){//格子未满
                    //计算格子数
                    if(stackMax - item.itemCount < itemCount){
                        itemCount = itemCount-(stackMax - item.itemCount);
                        sumSlots += parseInt(itemCount/stackMax);
                        if(itemCount % stackMax != 0){
                            sumSlots ++;
                        }
                    }
                    checkId.push(item.itemId);
                }else{
                    //当相当于不去算
                }
            }else{
                //不可叠加 - - 占用格子就是物品本身数量
                sumSlots += parseInt(itemsMap[item.itemId]);
                checkId.push(item.itemId);
            }

        }
    }

    for(var key in itemsMap){
        if(_.indexOf(checkId,parseInt(key))==-1){
            var itemCount = itemsMap[key];
            var itemData = dataApi.Items.findById(parseInt(key));
            var stackMax = (itemData.canOverlay === 0) ? 1 : itemData.canOverlay;
            sumSlots += parseInt(itemCount/stackMax);
            if(itemCount % stackMax != 0){
                sumSlots ++;
            }
        }
    }

    return (this.getEmptySlotCnt() - sumSlots);
}