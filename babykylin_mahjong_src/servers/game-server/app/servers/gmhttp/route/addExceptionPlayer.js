/**
 * Created by kilua on 2015-06-08.
 */

var logger = require('pomelo-logger').getLogger(__filename);

module.exports = function(app, http){
    http.get('/addExceptionPlayerByName', function(req, res) {
        var values = req.query,
            playerName = values['playerName'];
        logger.debug('addExceptionPlayerByName playerName = %s', playerName);
        app.rpc.world.exceptionPlayerRemote.addByPlayerName.toServer('*', playerName, function(err){
            if(err){
                res.send(err);
            }else{
                res.send('ok');
            }
        });
    });

    /*
    *   移除跟踪
    * */
    http.get('/removeExceptionPlayerByName', function(req, res){
        var values = req.query,
            playerName = values['playerName'];
        logger.debug('removeExceptionPlayerByName playerName = %s', playerName);
        app.rpc.world.exceptionPlayerRemote.removeByPlayerName.toServer('*', playerName, function(err){
            if(err){
                res.send(err);
            }else{
                res.send('ok');
            }
        });
    });
};