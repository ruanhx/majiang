/**
 * Created by tony on 2016/8/31.
 */
var pomelo = require('pomelo'),
    logger = require('pomelo-logger').getLogger(__filename),
    _ = require('underscore');

var dataApi = require('../../util/dataApi');

var PlayerRecharge = function (player) {
    this.player = player;
};

var pro = PlayerRecharge.prototype;
pro.clearRecharge = function(){
    delete this.player;
}

pro.load = function(player)
{
    if (!player.recharge) {
        player.recharge = new PlayerRecharge(player);
    }
};
pro.getClientInfo = function () {
    var pages =[], self = this;
    _.each(dataApi.Recharge.all(), function (pageData) {
        var page = {};
      if(  self.player.isOpenOrderFlag(pageData.operationFlag) )
      {
          // 页面基本信息
          page.id = pageData.id;
          page.type = pageData.type;
          page.name = pageData.name;
          page.pic = pageData.pic;
          page.price = pageData.price;
          page.coinType = pageData.coinType;
          page.diamond = pageData.diamond;
          page.firstText = pageData.firstText;
          page.firstGift = pageData.firstGift;
          page.text = pageData.text;
          page.gift = pageData.gift;
          page.order = pageData.order;
          page.productId = pageData.productId;
          page.operationFlag = pageData.operationFlag;
          page.buyCnt = self.player.getBuyCntByProductId(page.productId);
          pages.push(page);
      }
    });
    return pages;
};

module.exports.get = function (player) {
    if (!player.recharge) {
        player.recharge = new PlayerRecharge(player);
    }
    return player.recharge;
};