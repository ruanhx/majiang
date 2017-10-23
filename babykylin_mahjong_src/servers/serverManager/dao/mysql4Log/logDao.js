

var logDao = module.exports = {};

function formatDate(time){
    var d = new Date(time),
        year = d.getFullYear(),
        month = d.getMonth()+1,
        date = d.getDate();
    return year +'-'+ month +'-'+ date;
}

function formatDateTime(time){
    var d = new Date(time),
        year = d.getFullYear(),
        month = d.getMonth()+1,
        date = d.getDate(),
        hour = d.getHours(),
        minute = d.getMinutes(),
        second = d.getSeconds();
    return year +'-'+ month +'-'+ date+' '+hour+':'+minute+':'+second;
}

//提示：level是最高关卡,虚拟币统计金币跟钻石,profession职业不需要理会
//


logDao.writeLoginReg = function(dbClient, record, cb){
    var sql = 'insert into log_loginreg_msg(channel_id,server_id,device_num,account_id,role_id,role_nickname,role_level,add_ip,daytime,addtime,type) values (?,?,?,?,?,?,?,?,?,?,?) ',
        args = [record.channelId||0,record.serverId||0,record.deviceNum||0,record.accountId||0,record.roleId||0,record.roleNickName||0,record.roleLevel||0,record.addIp||0,formatDate(record.addtime)||0,record.addtime||0,record.type||0];
    dbClient.query(sql, args, function(err, rs){
        if(!!err){
            console.error('writeLoginReg failed!err = %s', err.stack);
            cb(err.message, null);
        }else{
            cb(null, rs);
        }
    });
};

logDao.writeLogPayRec = function(dbClient, record, cb){
    var sql = 'INSERT INTO log_pay_record(order_id,channel_id,device_num,account_id,server_id,role_id,role_level,amount,status,addip,daytime,addtime) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ',
        args = [record.orderId||0,record.channelId||0,record.deviceNum||0,record.accountId||0,record.serverId||0,record.roleId||0,record.roleLevel||0,record.amount||0,record.status||0,record.addip||0,formatDate(record.addtime)||0,record.addtime||0];
    dbClient.query(sql, args, function(err, rs){
        if(err){
            console.error('writeLogPayRec failed!err = %s', err.stack);
            cb(err.message, null);
        }else{
            cb(null,rs);
        }
    });
};

logDao.writeLogOnline = function(dbClient, record, cb){
    var sql = 'INSERT INTO log_online(server_id,log_date,amount) VALUES(?,?,?) ',
        args = [record.serverId,formatDateTime(record.log_date),record.amount];
    dbClient.query(sql, args, function(err, rs){
        if(err){
            console.error('writeLogOnline failed!err = %s', err.stack);
            cb(err.message, null);
        }else{
            cb(null,rs);
        }
    });
};

logDao.writeGameRole = function(dbClient, record, cb){
    var sql = 'INSERT INTO t_game_role(account,user_id,role_id,server_id,nickname,channel_id,profession,level,copper,bind_gold,gold_ingot,isHavPay) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ',
        args = [record.account||0,record.userId||0,record.roleId||0,record.serverId||0,record.nickname||0,record.channelId||0,record.profession||0,record.level||0,record.copper||0,record.bindGold||0,record.goldIngot||0,record.isHavPay||0];
    dbClient.query(sql, args, function(err, rs){
        if(err){
            console.error('writeGameRole failed!err = %s', err.stack);
            cb(err.message, null);
        }else{
            cb(null,rs);
        }
    });
};

logDao.writeLogItemFlow = function(dbClient, record, cb){
    var sql = 'INSERT INTO log_item_flow(server_id,role_id,flow_type,flow_source,item_type,item_id,quality,amount,pre_num,now_num,log_time) VALUES (?,?,?,?,?,?,?,?,?,?,?) ',
        args = [record.serverId||0,record.roleId||0,record.flowType||0,record.flowSource||0,record.itemType||0,record.itemId||0,record.quality||0,record.amount||0,record.preNum||0,record.nowNum||0,formatDateTime(record.log_time)||0];
    dbClient.query(sql, args, function(err, rs){
        if(err){
            console.error('writeGameRole failed!err = %s', err.stack);
            cb(err.message, null);
        }else{
            cb(null,rs);
        }
    });
};

