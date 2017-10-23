/**
 * Created by kilua on 2015-05-26.
 */

module.exports = function(app, http){
    http.get('/', function(req, res) {
        // broadcast to all world servers.
        app.rpc.world.serverStatusRemote.getAllFlags.toServer('*', function(err, opFlags, shopFlags){
            var opts = {title: 'Game Manage'};
            if(!err && opFlags){
                opts.opFlags = JSON.stringify(opFlags);
                opts.shopFlags = JSON.stringify(shopFlags);
            }
            res.render('index', opts);
        });
    });
};