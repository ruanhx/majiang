/**
 * Created by kilua on 2015-10-09.
 */

var userDao = require('./dao/userDao'),
    GMAccountUtil = require('./utils/GMAccountUtil'),
    mysql = require('./dao/mysql/mysql'),
    mysqlConf = require('./config/mysql.json'),
    passwordEncoder = require('./utils/passwordEncoder');

if(process.argv.length < 5){
    console.log('param count error!');
    return -1;
}

var username = process.argv[2],
    password = process.argv[3],
    privilege = process.argv[4].toUpperCase();

console.log('create gm account %s %s privilege', username, password, privilege);

mysqlConf.password = passwordEncoder.decrypt(mysqlConf.password);
var dbClient = mysql.init(mysqlConf);

password = GMAccountUtil.encrypt(password);
userDao.addGMAccount(dbClient, username, password, privilege, function(err, success){
    dbClient.shutdown();
    if(err){
        console.info('add gm account err %s', err);
        return;
    }
    console.info('add gm account %s!', success ? 'ok' : 'fail');
});