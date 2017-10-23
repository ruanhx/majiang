/**
 * Created by kilua on 2015-10-08.
 */
var util = require('util');

var router = require('express').Router(),
    async = require('async'),
    request = require('request'),
    _ = require('underscore'),
    mysql = require('mysql');

var userDao = require('../dao/userDao'),
    GMAccountUtil = require('../utils/GMAccountUtil'),
    CODE = require('../shared/code'),
    configUtils = require('../utils/configUtils'),
    globalStatDao = require('../dao/globalStatDao'),
    statisticsDao = require('../dao/statisticsDao'),
    channelById = require('../config/channels/index.json'),
    serverList = require('../utils/serverList'),
    consumeStatistics = require('./consumeStatistics'),
    onlineStatistics = require('./onlineStatistics'),
    sysMsgManage = require('./sysMsgManage'),
    mailManage = require('./mailManage'),
    activityManager = require('./activityManager'),
    shopManager = require('./shopManager'),
    monitorConsole = require('./monitorConsole'),
    orderQuery = require('./orderQuery'),
    snManager = require('./snManager'),
    roleManager = require('./roleManager');
    playerManager = require('./playerManager'),
    battleException= require('./battleException'),
    PAGE_PRIVILEGE = require('../config/pagePrivilege.json');;

//router.get('/', function(req, res){
//    res.render('index', {title: "Game Admin"});
//    //res.redirect('/ui/index');
//});

router.route('/login')
    //.get(function(req, res){
    //    if(req.session.user){
    //        return res.redirect('/home');
    //    }
    //    res.render('login', {title: '用户登录'})
    //})
    .post(function(req, res){
        console.log('####%s username = %s, password = %s', req.originalUrl, req.body.username, req.body.password);
        userDao.getUserByName(req.dbClient, req.body.username, function(err, user){
            if(err){
                req.session.error = err.message;
                return res.send({code: CODE.FAIL});
                //return res.redirect('/login');
            }
            if(!!user && req.body.username === user.username && GMAccountUtil.encrypt(req.body.password) === user.password){
                req.session.user = user;
                return res.send({code: CODE.OK, username: req.body.username, px: user.privilege});
                //return res.redirect('/home');
            }
            req.session.error = '用户名或密码不正确';
            //res.redirect('/login');
            return res.send({code: CODE.FAIL});
        });
    });

router.get('/logout', function(req, res){
    req.session.user = null;
    //res.redirect('/');
    res.send({code: CODE.OK});
});

//router.get('/home', function(req, res){
//    res.render('home', {title: 'Home'});
//});

/*
*   请求账号列表
* */
router.get('/listAccounts', function(req, res){
    console.log('#listAccount...');
    userDao.getUserList(req.dbClient, function(err, userList){
        userList = userList || [];
        var accounts = [];
        userList.forEach(function(user){
            accounts.push({username: user.username, px: user.privilege});
        });
        return res.send({code: CODE.OK, accounts: accounts});
    });
});

/*
*   添加GM帐号
* */
router.post('/addGMAccount', function(req, res){
    console.log('addGMAccount username = %s, password = %s', req.body.username, req.body.password);
    // 处理
    var defPrivilege = 'C';
    if(!req.body.username || !req.body.password){
        console.log('/addGMAccount param error!');
        return res.send({code: CODE.FAIL});
    }
    if(req.body.username.length < 6){
        console.log('/addGMAccount username length limit!');
        return res.send({code: CODE.USERNAME_LENGTH_LIMIT});
    }
    if(/[^a-zA-Z0-9]/.test(req.body.username)){
        console.log('/addGMAccount username contains unexpected chars!');
        return res.send({code: CODE.USERNAME_UNEXPECTED_CHAR});
    }
    if(req.body.password.length < 6){
        console.log('/addGMAccount password length limit!');
        return res.send({code: CODE.PASSWORD_LENGTH_LIMIT});
    }
    if(/[^a-zA-Z0-9]/.test(req.body.password)){
        console.log('/addGMAccount password contains unexpected chars!');
        return res.send({code: CODE.PASSWORD_UNEXPECTED_CHAR});
    }
    req.body.password = GMAccountUtil.encrypt(req.body.password);
    userDao.addGMAccount(req.dbClient, req.body.username, req.body.password, defPrivilege, function(err, success){
        var json = {};
        if(success){
            json.code = CODE.OK;
            json.username = req.body.username;
            json.px = defPrivilege;
        }else{
            //console.log('/addGMAccount fail!');
            json.code = CODE.FAIL;
        }
        return res.send(json);
    });
});

/*
*   批量修改账号权限
* */
router.post('/updatePrivilege', function(req, res){
    console.log('updatePrivilege userList = %j', req.body.userList);
    if(req.body.userList) {
        try {
            req.body.userList = JSON.parse(req.body.userList);
        }catch(ex){
            console.error('updatePrivilege parse err = %s', err.stack);
            req.body.userList = [];
        }
    }
    var userList = req.body.userList || [];
    if(userList.length <= 0){
        return res.send({code: CODE.OK});
    }
    async.each(
        userList,
        function(userInfo, callback){
            userDao.updatePrivilege(req.dbClient, userInfo.username, userInfo.privilege, callback);
        },
        function(err){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK});
        });
});

/*
*   获取所有渠道和区服信息
* */
router.post('/listChannelServers', function(req, res){
    console.log('###listChannelServers page = %s', req.body.page);
    var expectPrivilege = PAGE_PRIVILEGE[req.body.page];
    if(expectPrivilege){
        if(!GMAccountUtil.haveEnoughPrivilege(req.session.user.privilege, expectPrivilege)){
            return res.send({code: CODE.LACK_PRIVILEGE});
        }
    }
    serverList.getServerListEx(_.values(channelById), function(err, serverList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        return res.send({code: CODE.OK, serverList: serverList});
    });
});


function getGlobalStat(serverInfo, start, end, cb){
    var mysqlConf = serverInfo.conf.GameStat;
    var dbClient = mysql.createConnection({
        host: mysqlConf.host,
        port: mysqlConf.port,
        user: mysqlConf.user,
        password: mysqlConf.password,
        database: mysqlConf.database,
        supportBigNumbers: true
    });
    globalStatDao.queryByDate(dbClient, start, end, function(err, result){
        dbClient.destroy();
        cb(err, result);
    });
}

function getGlobalStatEx(serverList, begin, end, cb){
    configUtils.getMysqlConf(serverList, function(err, serverList){
        if(err){
            return cb(err);
        }
        async.map(
            serverList,
            function(serverInfo, callback){
                getGlobalStat(serverInfo, begin, end, callback);
            },
            function(err, results){
                if(err){
                    return cb(err);
                }
                results = _.flatten(results || [], true);
                return cb(null, results);
            }
        );
    });
}

/*
*   全服统计
*
*   body = {
 "code":200,
 "results":[
     {
         "id":2,
         "totalUser":0,
         "todayCreatedUser":0,
         "todayEverLogonBaseOnNumOfDaysBeforeCreated_1":0,
         "todayEverLogonBaseOnNumOfDaysBeforeCreated_2":0,
         "todayEverLogonBaseOnNumOfDaysBeforeCreated_4":0,
         "todayEverLogonBaseOnNumOfDaysBeforeCreated_6":0,
         "todayEverLogonBaseOnNumOfDaysBeforeCreated_14":0,
         "todayActiveUser":0,
         "todayCreatedAndChargeTotal":0,
         "todayCreatedUserChargeTotal":0,
         "todayEverChargeUser":0,
         "todayChargeTotalMoney":0,
         "todayHighOnline":0,
         "todayAvgOnline":0,
         "todayActiveUserChargeTotalMoney":0,
         "todayCreatedARPU":0,
         "todayActiveARPU":0,
         "todayARPU":0,
         "todayChargePercent":0,
         "createTime":1444831776355,
         "todayCreatedFirstChargeTotal":0,
         "todayChargeTotalCount":0,
         "todayEverLogonUsers": 0,
         "todayLossUsers": 0,
         "todayLossChargeUsers": 0
     }
 ]
 }
* */
router.post('/globalStatistics', function(req, res){
    console.log('globalStatistics channelIds = %j, serverIds = %j, begin = %s, end = %s', req.body.channelIds, req.body.serverIds, req.body.begin,
    req.body.end);
    if(_.isUndefined(req.body.channelIds) || _.isUndefined(req.body.serverIds) || !req.body.begin || !req.body.end){
        return res.send({code: CODE.FAIL});
    }
    if(!(req.body.channelIds instanceof Array)){
        // 特殊-全部,传0
        req.body.channelIds = parseInt(req.body.channelIds);
        if(req.body.channelIds === 0){
            // 自动填充所有渠道ID
            req.body.channelIds = configUtils.getAllChannelIds();
            console.log('globalStatistics all channelIds = %j', req.body.channelIds);
        }else {
            req.body.channelIds = [req.body.channelIds];
        }
    }
    // 过滤出渠道
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(req.body.channelIds, channelInfo.id);
    });
    console.log('globalStatistics channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('globalStatistics serverListByChannelId = %j', channelServerList);
        if(!(req.body.serverIds instanceof Array)){
            req.body.serverIds = parseInt(req.body.serverIds);
            if(req.body.serverIds === 0){
                req.body.serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('globalStatistics all serverIds = %j', req.body.serverIds);
            }else {
                req.body.serverIds = [req.body.serverIds];
            }
        }
        // 过滤出服务器
        var serverList = channelServerList;
        console.log('globalStatistics serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(req.body.serverIds, serverInfo.ID);
        });
        console.log('globalStatistics serverList = %j', serverList);
        getGlobalStatEx(serverList, parseInt(req.body.begin), parseInt(req.body.end), function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
});

function getFirstChargeMoneyPercent(todayCreatedFirstChargeTotal, todayChargeTotalMoney){
    return (todayChargeTotalMoney === 0) ? 0 : (todayCreatedFirstChargeTotal / todayChargeTotalMoney);
}

function getChargeStatNow(serverInfo, cb){
    var mysqlConf = serverInfo.conf.GameUser;
    var dbClient = mysql.createConnection({
        host: mysqlConf.host,
        user: mysqlConf.user,
        password: mysqlConf.password,
        database: mysqlConf.database,
        supportBigNumbers: true
    });
    async.parallel([
            function(callback){
                statisticsDao.getTodayCreatedUser(dbClient, callback);
            },
            function(callback){
                statisticsDao.getTodayEverChargeTotal(dbClient, callback);
            },
            function(callback){
                statisticsDao.getTodayChargeTotalCount(dbClient, callback);
            },
            function(callback){
                statisticsDao.getTodayChargeTotalMoney(dbClient, callback);
            },
            function(callback){
                statisticsDao.getTodayCreatedAndChargeUser(dbClient, callback);
            },
            function(callback){
                statisticsDao.getTodayCreatedFirstChargeTotalAmount(dbClient, callback);
            }
        ],
        function(err, results){
            dbClient.destroy();
            if(err){
                return cb(err);
            }
            var createTime = Date.now(),
                todayCreatedUser = results[0],
                todayEverChargeUser = results[1],
                todayChargeTotalCount = results[2],
                todayChargeTotalMoney = results[3],
                todayCreatedAndChargeTotal = results[4],
                todayCreatedFirstChargeTotal = results[5],
                todayChargePercent = (todayCreatedUser === 0) ? 0 : (todayEverChargeUser / todayCreatedUser),
                firstChargeMoneyPercent = getFirstChargeMoneyPercent(todayCreatedFirstChargeTotal, todayChargeTotalMoney);
            return cb(null, {createTime: createTime, todayCreatedUser: todayCreatedUser, todayEverChargeUser: todayEverChargeUser,
                todayChargeTotalCount: todayChargeTotalCount, todayChargeTotalMoney: todayChargeTotalMoney,
                todayCreatedAndChargeTotal: todayCreatedAndChargeTotal, todayCreatedFirstChargeTotal: todayCreatedFirstChargeTotal,
                todayChargePercent: todayChargePercent, firstChargeMoneyPercent: firstChargeMoneyPercent});
        }
    );
}

function chargeStatEx(serverList, begin, end, cb){
    // 先查日报
    getGlobalStatEx(serverList, begin, end, function(err, results){
        if(err){
            return cb(err);
        }
        // 筛选数据
        results = results || [];
        var rows = [];
        _.each(results, function(result){
            rows.push({createTime: result.createTime, todayCreatedUser: result.todayCreatedUser, todayEverChargeUser: result.todayEverChargeUser,
                todayChargeTotalCount: result.todayChargeTotalCount, todayChargeTotalMoney: result.todayChargeTotalMoney,
                todayCreatedAndChargeTotal: result.todayCreatedAndChargeTotal, todayChargePercent: result.todayChargePercent,
                todayCreatedFirstChargeTotal: result.todayCreatedFirstChargeTotal,
                firstChargeMoneyPercent: getFirstChargeMoneyPercent(result.todayCreatedFirstChargeTotal, result.todayChargeTotalMoney)
            });
        });
        // 再查当日
        var curDate = new Date().setHours(0, 0, 0, 0);
        if(end >= curDate){
            // 包含今日，需做实时查询
            configUtils.getMysqlConf(serverList, function(err, serverList){
                if(err){
                    return cb(err);
                }
                async.map(
                    serverList,
                    getChargeStatNow,
                    function(err, results){
                        if(err){
                            return cb(err);
                        }
                        rows = rows.concat(results);
                        return cb(null, rows);
                    }
                );
            });
        }else{
            return cb(null, rows);
        }
    });
}

/*
*   充值统计
*   {
         "code": 200,
         "results": [
             {
                 "createTime": 1444831776355,
                 "todayCreatedUser": 0,
                 "todayEverChargeUser": 0,
                 "todayChargeTotalCount": 0,
                 "todayChargeTotalMoney": 0,
                 "todayCreatedAndChargeTotal": 0,   // 新增首充人數
                 "todayChargePercent": 0,
                 "todayCreatedFirstChargeTotal": 0,
                 "firstChargeMoneyPercent": 0
             },
             {
                 "createTime": 1444896642359,
                 "todayCreatedUser": 0,
                 "todayEverChargeUser": 0,
                 "todayChargeTotalCount": 0,
                 "todayChargeTotalMoney": 0,
                 "todayCreatedAndChargeTotal": 0,
                 "todayCreatedFirstChargeTotal": 0,
                 "todayChargePercent": 0,
                 "firstChargeMoneyPercent": 0
             }
         ]
 }
 *
* */
router.post('/chargeStatistics', function(req, res){
    console.log('chargeStatistics channelIds = %j, serverIds = %j, begin = %s, end = %s', req.body.channelIds,
        req.body.serverIds, req.body.begin, req.body.end);
    if(_.isUndefined(req.body.channelIds) || _.isUndefined(req.body.serverIds) || !req.body.begin || !req.body.end){
        return res.send({code: CODE.FAIL});
    }
    if(!(req.body.channelIds instanceof Array)){
        // 特殊-全部,传0
        req.body.channelIds = parseInt(req.body.channelIds);
        if(req.body.channelIds === 0){
            // 自动填充所有渠道ID
            req.body.channelIds = configUtils.getAllChannelIds();
            console.log('chargeStatistics all channelIds = %j', req.body.channelIds);
        }else {
            req.body.channelIds = [req.body.channelIds];
        }
    }
    // 过滤出渠道
    var channelList = _.filter(channelById, function(channelInfo){
        return _.contains(req.body.channelIds, channelInfo.id);
    });
    console.log('chargeStatistics channelList = %j', channelList);
    serverList.getServerListEx(channelList, function(err, channelServerList){
        if(err){
            return res.send({code: CODE.FAIL});
        }
        console.log('chargeStatistics serverListByChannelId = %j', channelServerList);
        if(!(req.body.serverIds instanceof Array)){
            req.body.serverIds = parseInt(req.body.serverIds);
            if(req.body.serverIds === 0){
                req.body.serverIds = _.map(channelServerList, function(serverInfo){return serverInfo.ID});
                console.log('chargeStatistics all serverIds = %j', req.body.serverIds);
            }else {
                req.body.serverIds = [req.body.serverIds];
            }
        }
        // 过滤出服务器
        var serverList = channelServerList;
        console.log('chargeStatistics serverList = %j', serverList);
        serverList = _.filter(serverList, function(serverInfo){
            return _.contains(req.body.serverIds, serverInfo.ID);
        });
        console.log('chargeStatistics serverList = %j', serverList);
        chargeStatEx(serverList, parseInt(req.body.begin), parseInt(req.body.end), function(err, results){
            if(err){
                return res.send({code: CODE.FAIL});
            }
            return res.send({code: CODE.OK, results: results});
        });
    });
});

/*
*   消费统计-按类型
{
    "code": 200,
    "results": [
        {
            "id": 2,
            "report": "{\"type\": 2,\"dailyTotal\": 5,\"total\": 6,\"uptime\": 7}",
            "createTime": 1444904934600
        }
    ]
 }
* */
router.post('/consumeStatisticsByType', consumeStatistics.getConsumeStatisticsByType);

/*
*   消费统计-按itemId
{
    "code": 200,
    "results": [
        {
            "id": 2,
            "report": "{\"itemId\": 2,\"dailyCount\": 4,\"uptime\": 5,\"totalCount\": 6}",
            "createTime": 1444904934600
        }
    ]
}
* */
router.post('/consumeStatisticsByItemId', consumeStatistics.getConsumeStatisticsByItemId);

/*
*   在线与登录
{
    "code": 200,
    "results": [
        {
            "today": [
                {
                    "id": 10000,
                    "count": 0,
                    "sampleTime": 1444924800013
                },
                {
                    "id": 10001,
                    "count": 0,
                    "sampleTime": 1444925100013
                }
            ],
            "yesterday": [],
            "lastWeek": [],
            "total": [
                {
                    "onlineTimeStat": {
                        "0-10": 1,
                        "11-30": 1,
                        "31-60": 0,
                        "61-120": 0,
                        "121-1440": 0
                    },
                    "todayHighOnline": 0,
                    "createTime": 1444924740006
                }
            ]
        }
    ]
}
* */
router.post('/onlineStatistics', onlineStatistics.onlineStatistics);

/*
*   公告管理
{
    "code": 200,
    "results": [
        {
            "channelId": 1,
            "serverId": 10803,
            "success": true,
            "emitterId": 3
        }
    ]
}
* */
router.post('/sysMsgManage', sysMsgManage.sendAnnouncement);

/*
*   取消公告
{
    "code": 200,
    "results": [
        {
            "channelId": 1,
            "serverId": 10803,
            "success": true,
            "emitterId": 3
        }
    ]
 }
* */
router.post('/cancelAnnouncement', sysMsgManage.cancelAnnouncement);

/*
*   获取公告列表
{
    "code": 200,
    "results": [
        {
            "channelId": 1,
            "serverId": 10803,
            "success": true,
            "announcements": [
            {
                "emitterId": 1,
                "announcement": "aabb",
                "sendCount": "20",
                "interval": "100000",
                "priority": "1",
                "pos": "1",
                "sendTime": "1448104502515000"
            }
            ]
        }
    ]
}
* */
router.post('/getAnnouncements', sysMsgManage.getAnnouncements);

/*
*   邮件管理
 {
     "code": 200,
     "results": [
         {
             "channelId": 1,
             "serverId": 10803,
             "success": true
         }
     ]
 }
* */
router.post('/mailManage', mailManage.sendMail);

/*
*   活动管理-查询
 {
     "code": 200,
     "results": [
         {
             "channelId": 1,
             "serverId": 10803,
             "result": {
                 "activities": [
                     {
                         "id": 1,
                         "name": "冲级奖励",
                         "openDate": 1444924800000,
                         "closeDate": -1,
                         "operationFlag": "cjjl",
                         "isOpen": true
                     },
                     {
                         "id": 2,
                         "name": "战力提升奖励",
                         "openDate": 1444924800000,
                         "closeDate": -1,
                         "operationFlag": "zlts",
                         "isOpen": true
                     },
                     {
                         "id": 3,
                         "name": "首冲活动",
                         "openDate": 1444924800000,
                         "closeDate": -1,
                         "operationFlag": "schd",
                         "isOpen": true
                     },
                     {
                         "id": 4,
                         "name": "累计充值活动",
                         "openDate": 1444924800000,
                         "closeDate": -1,
                         "operationFlag": "ljczhd",
                         "isOpen": true
                     },
                     {
                         "id": 5,
                         "name": "累计消费活动",
                         "openDate": 1444924800000,
                         "closeDate": -1,
                         "operationFlag": "ljxfhd",
                         "isOpen": true
                     },
                     {
                         "id": 6,
                         "name": "礼品兑换",
                         "openDate": 1444924800000,
                         "closeDate": -1,
                         "operationFlag": "",
                         "isOpen": true
                     }
                ],
            "opFlags": [
                     "cjjl",
                     "zlts",
                     "schd",
                     "ljczhd",
                     "ljxfhd"
                ]
            }
        }
     ]
 }
* */
router.post('/activityManager.listActivities', activityManager.listActivities);

/*
*   活动管理-修改运营标志
 {
     "code": 200,
     "results": [
         {
             "channelId": 1,
             "serverId": 10803,
             "result": {
             "activities": [
                 {
                     "id": 6,
                     "name": "礼品兑换",
                     "openDate": 1444924800000,
                     "closeDate": -1,
                     "operationFlag": "",
                     "isOpen": true
                 }
             ],
             "opFlags": [
                 "a",
                 "b"
             ]
             }
         }
     ]
 }
* */
router.post('/activityManager.changeOpFlags', activityManager.changeOpFlags);

/*
*   查询商店运营标志
 {
     "code": 200,
     "results": [
         {
             "channelId": 1,
             "serverId": 10803,
             "result": "[\"YQSD\",\"ZSSD\",\"JBSD\"]"
         }
     ]
 }
* */
router.post('/shopManager.getShopFlags', shopManager.getShopFlags);

/*
*   修改商店运营标志
 {
     "code": 200,
     "results": [
         {
             "channelId": 1,
             "serverId": 10803,
             "result": [
                 "a",
                 "b"
             ]
         }
     ]
 }
* */
router.post('/shopManager.changeShopFlags', shopManager.changeShopFlags);

/*
*   客服后台监控-查询
 {
     "code": 200,
     "results": [
         {
             "channelId": 1,
             "serverId": 10803,
             "result": [
                 {
                     "uid": 10000,
                     "username": "123463",
                     "playerId": 10000,
                     "playerName": "鹰纹商恩",
                     "level": 1,
                     "isOnline": 0,
                     "opRecs": [
                         {
                             "op": 1,           // 禁言
                             "interval": 1440   // 分钟
                         },
                         {
                             "op": 2,
                             "interval": 1440   // 封号
                         }
                     ]
                 }
             ]
         }
     ]
 }
* */
router.post('/monitorConsole.findPlayer', monitorConsole.findPlayer);

/*
*   踢人
 {
     "code": 200,               // 其他code是出错了
     "results": [
         {
             "channelId": 1,
             "serverId": 10803,
             "result": "fail"   // 成功则'ok'
         }
     ]
 }
* */
router.post('/monitorConsole.kickPlayer', monitorConsole.kickPlayer);

/*
*   禁言
 {
     "code": 200,
     "results": [
         {
             "channelId": 1,
             "serverId": 10803,
             "uid": 10000,
             "result": "fail"   // 成功则'ok'
         }
     ]
 }
* */
router.post('/monitorConsole.disableChat', monitorConsole.disableChat);

/*
*   封号
 {
     "code": 200,
     "results": [
         {
             "channelId": 1,
             "serverId": 10803,
             "uid": 10000,
             "result": "ok"         // 失败则'fail'
         }
     ]
 }
* */
router.post('/monitorConsole.disableLogon', monitorConsole.disableLogon);

/*
*   解禁
 {
     "code": 200,
     "results": [
         {
             "channelId": 1,
             "serverId": 10803,
             "uid": 10000,
             "result": "ok"     // 失败则'fail'
         }
     ]
 }
* */
router.post('/monitorConsole.enableChat', monitorConsole.enableChat);

/*
*   解封
* */
router.post('/monitorConsole.enableLogon', monitorConsole.enableLogon);

/*
*   客服充值查询
 {
     "code": 200,
     "results": [
     {
         "channelId": 1,
         "serverId": 10803,
         "orderList": [
             {
                 "createTime": 1445092255404,
                 "username": "123463",
                 "playerId": 10000,
                 "playerName": "鹰纹商恩",
                 "chargeTotal": 1011,
                 "money": 11,
                 "orderId": "2",
                 "channel": "app store",
                 "status": 3,    // 1异常 2成功 3失败
                 "registerTime": 1452958295806
             }
         ]
         }
     ]
 }
* */
router.post('/orderQuery.getOrderList', orderQuery.getOrderList);

/*
*
body:
{
    username: 'default_123494', // optional
    channelIds: 0, serverIds: 0, begin: new Date(2015, 6, 22).getTime(), end: Date.now() // required
}

response:
 {
     "code": 200,
     "results": [
         {
             "channelId": 1,
             "serverId": 10000,
             "orderList": [
                 {
                     "orderId": "o1452942868213",
                     "uid": "default_123494",
                     "money": "1",
                     "productId": "hlz_1monthproduct",
                     "gameMoney": "10000",
                     "serverId": "10000",
                     "time": "1452942868213",
                     "sign": "a7738c8c03bce66958f22db23f09d9be",
                     "channel": "app store",
                     "innerOrderId": "",
                     "registerTime": 1452958295806
                 }
             ]
         }
     ]
 }
* */
router.post('/orderQuery.getOrderCache', orderQuery.getOrderCache);
/*
*   客服礼包查询
 {
     "code": 200,
     "results": [
         {
         "channelId": 1,
         "serverId": 10803,
         "snHistories": [
             {
                 "logTime": 1445092255404,
                 "playerId": 10000,
                 "uid": 10000,
                 "playerName": "鹰纹商恩",
                 "sn": "sn_1",
                 "awardId": "snAwardData.id",
                 "awardName": "snAwardData.name"
             }
         ]
         }
     ]
 }
* */
router.post('/snManager.getSnHistories', snManager.getSnHistories);

router.post('/roleManager.getRoleInfo',roleManager.getRoleInfo);
/*
*   客服信息查询
 {
     "code": 200,
     "results": [
         {
             "channelId": 1,
             "serverId": 10803,
             "playerList": [
                 {
                     "username": "123463",
                     "playerId": 10000,
                     "playerName": "鹰纹商恩",
                     "level": 1,
                     "isOnline": 0,
                     "registerTime": 1444933057348,
                     "logonTime": 1445017101506,
                     "logoffTime": 1445017113000,
                     "totalOnlineTime": 130569,
                     "firstChargeTime": 0,
                     "lastChargeTime": 0,
                     "chargeTotal": 0,
                     "rank": 0,
                     "barrierProgress": 0,
                     "buildings": []
                 }
             ]
         }
     ]
 }
* */
router.post('/playerManager.findPlayer', playerManager.findPlayer);

/*
*   客服-物品查询(暂不支持名字，因为服务器端是不会存物品名字的)
 {
     "code": 200,
     "results": [
         {
             "channelId": 1,
             "serverId": 10803,
             "results": [
                 {
                     "username": "123463",
                     "playerId": 10000,
                     "playerName": "鹰纹商恩",
                     "level": 1,
                     "expItems": [
                        {
                                                                                                            "itemId": 1,
                                                                                                            "count": 1
                        },
                        {
                            "itemId": 2,
                            "count": 2
                        }
                     ],
                     "materials": [
                        {
                            "itemId": 3,
                            "count": 3
                        }
                     ],
                     "sweepTickets": [
                        {
                            "itemId": 4,
                            "count": 4
                        }
                     ],
                     "equips": [
                        {
                            "itemId": 4,
                            "count": 4,
                            "level": 4
                        }
                     ]
                 }
             ]
         }
     ]
 }
* */
router.post('/playerManager.listItems', playerManager.listItems);

/*
*   客服-卡牌查询
 {
     "code": 200,
     "results": [
         {
             "channelId": 1,
             "serverId": 10803,
             "results": [
                 {
                    "username": "123463",
                    "playerId": 10000,
                    "playerName": "鹰纹商恩",
                    "level": 1,
                    "cards": [
                        {
                            "cardId": 92010101,
                            "level": 1,
                            "superSkillLV": 1
                        }
                    ]
                }
             ]
         }
     ]
 }
* */
router.post('/playerManager.listCards', playerManager.listCards);

/*
*   客服-卡牌碎片
 {
     "code": 200,
     "results": [
         {
             "channelId": 1,
             "serverId": 10803,
             "results": [
             {
                 "username": "123463",
                 "playerId": 10000,
                 "playerName": "鹰纹商恩",
                 "level": 1,
                 "frags": [
                 {
                 "itemId": 1,
                 "count": 2
                 }
                 ]
                 }
             ]
         }
     ]
 }
* */
router.post('/playerManager.listCardFrags', playerManager.listCardFrags);

/*
*   客服-异常日志查询
 {
     "code": 200,
     "results": [
         {
             "channelId": 1,
             "serverId": 10803,
             "results": [
             {
                 "playerId": 10000,
                 "username": 'xxx',
                 "playerName": 'yyy',
                 "type": 2,
                 "logTime": 1445092255404,
                 "myLV": 1,
                 "myPower": 2,
                 "targetLV": 5,
                 "targetPower": 3,
                 "targetId": 4
             },
             {
                 "playerId": 10000,
                 "username": 'xxx',
                 "playerName": 'yyy',
                 "type": 3,
                 "logTime": 1445092255404,
                 "myLV": 1,
                 "myPower": 2,
                 "barrierId": 3,
                 "barrierPower": 4
             }
             ]
         }
     ]
 }
* */
router.post('/battleException.getLog', battleException.getLog);

/*
*   客服-异常统计查询
 {
     "code": 200,
     "results": [
     {
         "channelId": 1,
         "serverId": 10803,
         "results": [
             {
                 "playerId": 10000,
                 "PVPTotal": 2,
                 "PVPCycleTotal": 1,
                 "PVETotal": 4,
                 "PVECycleTotal": 3,
                 "username": "123463",
                 "playerName": "鹰纹商恩",
                 "traced": true
             }
         ]
         }
     ]
 }
* */
router.post('/battleException.getStat', battleException.getStat);

/*
*   客服-异常账号追踪
 {
     "code": 200,
     "results": [
         {
             "channelId": 1,
             "serverId": 10803,
             "result": true
         }
     ]
 }
* */
router.post('/battleException.addTraceByName', battleException.addTraceByName);

/*
 *   客服-撤销异常账号追踪
 {
     "code": 200,
     "results": [
        {
             "channelId": 1,
             "serverId": 10803,
             "result": true
         }
     ]
 }
 * */
router.post('/battleException.delTraceByName', battleException.delTraceByName);

/*
*   客服-查询追踪记录
 {
     "code": 200,
     "results": [
         {
             "channelId": 1,
             "serverId": 10803,
             "results": [
                 {
                     "playerId": 10000,
                     "recordTime": 1,
                     "gmAccount": "1",
                     "username": "123463",
                     "playerName": "鹰纹商恩",
                     "level": 1
                 }
             ]
         }
     ]
 }
* */
router.post('/battleException.getTraceRecord', battleException.getTraceRecord);

module.exports = router;