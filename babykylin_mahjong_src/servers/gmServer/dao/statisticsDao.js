/**
 * Created by kilua on 2015-10-15.
 */

var dao = module.exports = {};

var logger = console;

dao.getTodayCreatedUser = function(dbClient, cb){
    var sql = 'CALL getTodayCreatedUser()';
    dbClient.query(sql, [], function(err, res){
        if(err){
            logger.error('getTodayCreatedUser err = %s', err.stack);
            cb(err.message, 0);
        }else{
            if(!!res && res.length > 0 && res[0].length > 0 && res[0][0]){
                cb(null, res[0][0]['COUNT(*)']);
            }else{
                logger.warn('getTodayCreatedUser failed!');
                cb(null, 0);
            }
        }
    });
};

/*
 *   ���ճ�ֵ�������������û��͵���ע����û�
 * */
dao.getTodayEverChargeTotal = function(dbClient, cb){
    var sql = 'CALL getTodayEverChargeTotal()';
    dbClient.query(sql, [], function (err, res) {
        if(err){
            logger.error('getTodayEverChargeTotal err = %s', err.stack);
            cb(err.message, 0);
        }else{
            if(!!res && res.length > 0 && res[0].length > 0 && res[0][0]){
                cb(null, res[0][0].count);
            }else{
                cb(null, 0);
            }
        }
    });
};

/*
 *   ���ճ�ֵ�ܴ���
 * */
dao.getTodayChargeTotalCount = function(dbClient, cb){
    var sql = 'CALL getTodayChargeTotalCount()';
    dbClient.query(sql, [], function(err, res){
        if(err){
            logger.error('getTodayChargeTotalCount err = %s', err.stack);
            cb(err.message, 0);
        }else{
            if(!!res && res.length > 0 && res[0].length > 0 && res[0][0]){
                cb(null, res[0][0].chargeTotalCount || 0);
            }else{
                cb(null, 0);
            }
        }
    });
};

/*
 *   ���ճ�ֵ�ܶ�
 * */
dao.getTodayChargeTotalMoney = function(dbClient, cb){
    var sql = 'CALL getTodayChargeTotalMoney()';
    dbClient.query(sql, [], function(err, res){
        if(err){
            logger.error('getTodayChargeTotalMoney err = %s', err.stack);
            cb(err.message, 0);
        }else{
            if(!!res && res.length > 0 && res[0].length > 0 && res[0][0]){
                cb(null, res[0][0].chargeTotal || 0);
            }else{
                cb(null, 0);
            }
        }
    });
};

/*
 *   ����ע�Ტ��ֵ����
 * */
dao.getTodayCreatedAndChargeUser = function(dbClient, cb){
    var sql = 'CALL getTodayCreatedAndChargeUser()';
    dbClient.query(sql, [], function(err, res){
        if(err){
            logger.error('getTodayCreatedAndChargeUser err = %s', err.stack);
            cb(err.message, 0);
        }else{
            if(!!res && res.length > 0 && res[0].length > 0 && res[0][0]){
                cb(null, res[0][0].count);
            }else{
                cb(null, 0);
            }
        }
    });
};

/*
 *   �����׳��ܶ�
 * */
dao.getTodayCreatedFirstChargeTotalAmount = function(dbClient, cb){
    var sql = 'CALL getTodayCreatedFirstChargeTotalAmount()';
    dbClient.query(sql, [], function(err, res){
        if(err){
            logger.error('getTodayCreatedFirstChargeTotalAmount err = %s', err.stack);
            cb(err.message, 0);
        }else{
            if(!!res && res.length > 0 && res[0].length > 0 && res[0][0]){
                cb(null, res[0][0].firstChargeTotal || 0);
            }else{
                cb(null, 0);
            }
        }
    });
};