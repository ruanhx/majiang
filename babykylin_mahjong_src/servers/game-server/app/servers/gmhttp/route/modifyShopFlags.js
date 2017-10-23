/**
 * Created by cxy on 2015-06-15.
 */

var logger = require('pomelo-logger').getLogger(__filename);

module.exports = function (app, http) {
    http.get('/modifyShopFlags', function (req, res) {
        var values = req.query,
            opFlags = values['opFlags'];
        logger.debug('modifyShopFlags opFlags = %s', opFlags);
        try {
            opFlags = JSON.parse(opFlags);
        } catch (ex) {
            return res.send('modifyShopFlags invalid operation flags!');
        }
        // broadcast to all world servers.
        app.rpc.world.serverStatusRemote.setShopFlags.toServer('*', opFlags, function (err, opFlags, shopFlags) {
            if (err) {
                //return res.send('modifyOpFlags error %s occurs!', err);
                logger.debug('modifyShopFlags error %s occurs!', err);
            }
            var opts = {title: 'Game Manage'};
            if (opFlags) {
                opts.opFlags = JSON.stringify(opFlags);
            }
            if (shopFlags) {
                opts.shopFlags = JSON.stringify(shopFlags);
            }
            res.render('index', opts);
        });
    });

    /*
    *   变更商店的运营标志，示例：http://192.168.1.150:3601/changeShopFlags?opFlags=[%22ab%22]
    * */
    http.get('/changeShopFlags', function(req, res){
        var values = req.query,
            opFlags = values['opFlags'];
        logger.debug('changeShopFlags opFlags = %s', opFlags);
        try {
            opFlags = JSON.parse(opFlags);
        } catch (ex) {
            return res.send('changeShopFlags invalid operation flags!');
        }
        // broadcast to all world servers.
        app.rpc.world.serverStatusRemote.setShopFlags.toServer('*', opFlags, function (err, opFlags, shopFlags) {
            if (err) {
                //return res.send('modifyOpFlags error %s occurs!', err);
                logger.debug('changeShopFlags error %s occurs!', err);
            }
            res.send(JSON.stringify(shopFlags));
        });
    });

    http.get('/getShopFlags', function(req, res){
        logger.debug('getShopFlags...');
        app.rpc.world.serverStatusRemote.getShopFlags.toServer('*', function(err, shopFlags){
            if(err){
                logger.error('getShopFlags err %s', err);
            }
            res.send({code: 'ok', shopFlags: JSON.stringify(shopFlags)});
        });
    });
};