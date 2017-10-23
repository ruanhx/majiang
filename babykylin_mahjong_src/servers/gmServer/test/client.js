/**
 * Created by kilua on 2015-10-14.
 */

var request = require('request').defaults({jar: true, json: true});

var CODE = require('../shared/code');

request.post(
    {
        url: 'http://localhost:3901/login',
        form: {username: 'admin', password: '123456'}
    },
    function(err, httpResponse, body){
        console.log('body = %j', body);
        //body = JSON.parse(body);
        if(body.code === CODE.OK) {
            request({
                    //method: 'GET',
                    method: 'POST',
                    uri: 'http://localhost:3901/orderQuery.getOrderCache'
                    , body: {
                        username: 'default_123494',
                        //playerId: 10000,
                        //playerName: '鹰纹商恩',
                        channelIds: 0, serverIds: 0, begin: new Date(2015, 6, 22).getTime(), end: Date.now()
                    }
                    //, body: {
                    //    channelIds: 0, serverIds: 0,
                    //    //interval: 10,
                    //    uid: 10000
                    //}
                    //, body: {
                    //    channelIds: 0, serverIds: 0,
                    //    //username: '123463',
                    //    //playerName: '鹰纹商恩'
                    //    playerId: 10000
                    //}
                    //, body: {channelIds: 0, serverIds: 0}
                    //, body: {channelIds: 0, serverIds: 0, opFlags: 'a#b'}
                    //, body: {
                    //    channelIds: 0,
                    //    serverIds: 0,
                    //    mailInfo: {
                    //        title: 'title',
                    //        sender: 'sender',
                    //        // 抬头由客户端拼接到info里
                    //        info: 'info',
                    //        drop: '1',
                    //        // 账号暂不支持
                    //        //targetID: 10000,
                    //        targetName: '鹰纹商恩',
                    //        //less: 1,
                    //        //greater: 10,
                    //        life: ''
                    //    }
                    //}
                    //, body: {channelIds: 0, serverIds: 0, announcement: 'aabb', sendCount: 20, interval: 100000, priority: 1
                    //, sendTime: Date.now(), pos: 1}
                    //, body: {channelIds: 0, serverIds: 0, begin: new Date(2015, 6, 22).getTime(), end: Date.now()}
                },
                function(err, httpResponse, body){
                    if(err){
                        console.log('err = %s', err.stack);
                    }else{
                        //console.log('httpResponse = %j', httpResponse);
                        console.log('body = %j', body);
                        if(body.code === 200){
                            //var results = body.results;
                            //if(results.length > 0){
                            //    var result = results[0];
                            //    // 取消公告
                            //    request({
                            //        method: 'POST',
                            //        uri: 'http://localhost:3901/cancelAnnouncement'
                            //        , body: {channelId: result.channelId, serverId: result.serverId, emitterId: result.emitterId}
                            //    }, function(err, response, body){
                            //        console.log('body = %j', body);
                            //    });
                            //}

                            request({
                                method: 'POST',
                                uri: 'http://localhost:3901/getAnnouncements'
                                , body: {channelIds: 0, serverIds: 0}
                            }, function(err, response, body){
                                console.log('body = %j', body);
                            });
                        }
                    }
                }
            );
        }
    }
);