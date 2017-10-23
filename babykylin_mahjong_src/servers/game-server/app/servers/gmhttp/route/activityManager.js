/**
 * Created by kilua on 2015-10-01.
 */

var logger = require('pomelo-logger').getLogger(__filename);

module.exports = function(app, http){
    http.get('/listActivities', function(req, res) {
        //var values = req.query;
        logger.debug('listActivities ...');
        // broadcast to all world servers.
        app.rpc.world.serverStatusRemote.getCurServerActivities.toServer('*', function(err, activities, opFlags){
            if(err){
                //return res.send('modifyOpFlags error %s occurs!', err);
                logger.debug('listActivities error %s occurs!', err.stack);
            }
            res.header("Content-Type", "application/json;charset=utf-8");
            res.send({activities: activities || [], opFlags: opFlags || []});
        });
    });

    /*
    *   修改运营标志以开/关活动, 例如：http://192.168.1.150:3601/changeOpFlags?opFlags=[]
    * */
    http.get('/changeOpFlags', function(req, res){
        var values = req.query,
            opFlags = values['opFlags'];
        logger.debug('changeOpFlags opFlags = %s', opFlags);
        try{
            opFlags = JSON.parse(opFlags);
        }catch(ex){
            //return res.send('changeOpFlags invalid operation flags!');
            res.header("Content-Type", "application/json;charset=utf-8");
            return res.send({});
        }
        // broadcast to all world servers.
        app.rpc.world.serverStatusRemote.setOperationFlags.toServer('*', opFlags, function(err, opFlags){
            if(err){
                logger.debug('changeOpFlags error %s occurs!', err.stack);
            }
            // broadcast to all world servers.
            app.rpc.world.serverStatusRemote.getCurServerActivities.toServer('*', function(err, activities, opFlags){
                if(err){
                    //return res.send('modifyOpFlags error %s occurs!', err);
                    logger.debug('listActivities error %s occurs!', err.stack);
                }
                res.header("Content-Type", "application/json;charset=utf-8");
                res.send({activities: activities || [], opFlags: opFlags || []});
            });
        });
    });
};