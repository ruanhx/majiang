/**
 * Created by kilua on 2015-06-01.
 */
var logger = require('pomelo-logger').getLogger(__filename);

module.exports = function(app, http){
    http.get('/modifyOpFlags', function(req, res) {
        var values = req.query,
            opFlags = values['opFlags'];
        logger.debug('modifyOpFlags opFlags = %s', opFlags);
        try{
            opFlags = JSON.parse(opFlags);
        }catch(ex){
            return res.send('modifyOpFlags invalid operation flags!');
        }
        // broadcast to all world servers.
        app.rpc.world.serverStatusRemote.setOperationFlags.toServer('*', opFlags, function(err, opFlags){
            if(err){
                //return res.send('modifyOpFlags error %s occurs!', err);
                logger.debug('modifyOpFlags error %s occurs!', err.stack);
            }
            var opts = {title: 'Game Manage'};
            if(opFlags) {
                opts.opFlags = JSON.stringify(opFlags);
            }
            res.render('index', opts);
        });
    });
};