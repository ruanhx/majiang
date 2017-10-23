/**
 * Created by kilua on 2014-12-23.
 */

var Item = function(opts){
    this.itemId = opts.itemId;
    this.count = opts.count || 1;
    this.itemData = opts.itemData;
};

module.exports = Item;