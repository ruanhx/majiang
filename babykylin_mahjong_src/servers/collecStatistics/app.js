/**
 * Created by kilua on 2016/5/30 0030.
 */

var util = require('util'),
    fs = require('fs');

var program = require('commander'),
    _ = require('underscore'),
    async = require('async'),
    moment = require('moment'),
    iconv = require('iconv-lite'),
    json2csv = require('json2csv'),
    mysqlLib = require('mysql');

var mysql = require('./dao/mysql/mysql'),
    version = require('./package.json').version,
    dataApi = require('./gameData/dataApi'),
    passedBarrierDao = require('./dao/passedBarrierDao'),
    unlockChapterDao = require('./dao/unlockChapterDao'),
    heroBagDao = require('./dao/heroBagDao'),
    playerDao = require('./dao/playerDao'),
    config = require('./config/mysql.json'),
    guideAchievementDao = require('./dao/guideAchievementDao'),
    dailyReportDao = require('./dao/dailyReport'),
    transformDailyDao = require('./dao/transformDailyDao'),
    fightHeroStatisticsDao = require('./dao/fightHeroStatistics'),
    onlineTimePercentDao = require('./dao/onlineTimePercent'),
    logonCountPercentDao = require('./dao/logonCountPercent'),
    lossLevelPercentDao = require('./dao/lossLevelPercent'),
    dailyTaskActiveValueDao = require('./dao/dailyTaskActiveValueDao'),
    dailyEndlessFightCntDao = require('./dao/dailyEndlessFightCntDao'),
    equipDao =  require('./dao/equipDao'),
    useDiamondDao = require('./dao/useDiamondDao'),
    comPointDao = require('./dao/comPointDao'),
    playerBehaivorDao = require('./dao/playerBehaivorDao'),
    rechargePlayerInfoDao = require('./dao/rechargePlayerInfoDao');

function  doCSV(fileNamePath,txt) {
    var newCsv = iconv.encode(txt,'GBK');
    fs.writeFileSync(fileNamePath,newCsv);
};


function decrypt(cyphertext) {
    return new Buffer(cyphertext, 'base64').toString();
}

var env = process.env.NODE_ENV || 'development';
if (config[env]) {
    config = config[env];
}

var COMMAND_ERROR = 'Illegal command format. Use `configMaker --help` to get more info.\n';
var MAX_STAR_COND = 3;
var dbClient = mysql.init(),
    statClient = mysqlLib.createConnection({
        host: config.GameStat.host,
        port: config.GameStat.port,
        user: config.GameStat.user,
        password: decrypt(config.GameStat.password),
        database: config.GameStat.database
    }),
    logClient = mysqlLib.createConnection({
        host: config.GameLog.host,
        user: config.GameLog.user,
        port: config.GameLog.port,
        password: decrypt(config.GameLog.password),
        database: config.GameLog.database
    }),

    managerClient = mysqlLib.createConnection({
        host: config.ServerManager.host,
        port: config.ServerManager.port,
        user: config.ServerManager.user,
        password: decrypt(config.ServerManager.password),
        database: config.ServerManager.database
    });

function clean() {
    dbClient.shutdown();
    statClient.destroy();
    managerClient.destroy();
}
// 定义命令行选项
program.version(version);
program.command('*')
    .action(function () {
        console.log(COMMAND_ERROR);
    });

function makeStarAwardStatisticsLine(chapterId, condId, percent) {
    return util.format('%s,%s,%s%%\r\n', chapterId, condId, percent);
}

function makeStarAwardStatisticsHeader() {
    return ['chapterId', 'condId', 'percent'].join(',') + '\r\n';
}

function getStarAwardDrewStatistics() {
    console.log('getStarAwardDrewStatistics begin...');
    async.mapSeries(dataApi.Chapter.all(), function (chapterData, callback) {
        async.mapSeries(_.range(1, MAX_STAR_COND + 1), function (condId, cb) {
            var reqStars = dataApi.Chapter.getReqStarsByChapterIdAndCondId(chapterData.id, condId);
            passedBarrierDao.getStarAwardAvailableTotal(dbClient, chapterData.barriers, reqStars, function (err, availableTotal) {
                if (err) {
                    return cb(err);
                }
                //console.log('getStarAwardDrewStatistics chapterId = %s, condId = %s, availableTotal = %s', chapterData.id, condId, availableTotal);
                unlockChapterDao.getStarAwardDrawCntByChapterIdAndCondId(dbClient, chapterData.id, condId, function (err, drewCnt) {
                    if (err) {
                        return cb(err);
                    }
                    //console.log('getStarAwardDrewStatistics chapterId = %s, condId = %s, drewCnt = %s', chapterData.id, condId, drewCnt);
                    cb(null, makeStarAwardStatisticsLine(chapterData.id, condId, (availableTotal === 0) ? 0 : (drewCnt / availableTotal * 100)));
                });
            });
        }, function (err, chapterLines) {
            if (err) {
                return callback(err);
            }
            callback(null, chapterLines.join(''));
        });
    }, function (err, allLines) {
        if (err) {
            console.info('getStarAwardDrewStatistics err = %s', err);
        } else {
            doCSV('./csv/starAward.csv', makeStarAwardStatisticsHeader() + _.values(allLines).join(''));
            console.info('getStarAwardDrewStatistics ok!');
        }
        clean();
    });
}

program.command('starAward')
    .description('星级奖励领取情况')
    .action(getStarAwardDrewStatistics);

function makeHeroStatisticsHeader() {
    return ['avgMaxLV', 'avgHeroCnt', 'avgHeroLV', 'avgHeroQuality', 'avgActiveSkillLV', 'avgJumpSkillLV',
            'avgPassiveSkill1LV', 'avgPassiveSkill2LV', 'avgPassiveSkill3LV'].join(',') + '\r\n';
}

function getHeroStatistics() {
    heroBagDao.getHeroStatistics(dbClient, function (err, result) {
        if (err) {
            console.info('getHeroStatistics err = %s', err);
        } else {
            doCSV('./csv/heroStatistics.csv', makeHeroStatisticsHeader() + _.values(result).join(','));
            console.info('getHeroStatistics ok! result :%j ',result);
        }
        clean();
    });
}

program.command('heroStatistics')
    .description('角色培养')
    .action(getHeroStatistics)

function makeLossLevelPercentHeader() {
    var headers = ['date'];
    _.range(1, 200 + 1).forEach(function (level) {
        headers.push(level);
    });
    return headers.join(',') + '\r\n';
}

function makeLossLevelLines(rows) {
    rows = rows || [];
    var lines = '';
    rows.forEach(function (row) {
        lines += row.date;
        _.range(1, 200 + 1).forEach(function (idx) {
            lines += util.format(',%s%%', row[util.format('percent%s', idx)]);
        });
        lines += '\r\n';
    });
    return lines;
}

function getLossLevelPercent() {
    lossLevelPercentDao.getLossLevelPercent(statClient, function (err, rows) {
        if (err) {
            console.info('getLossLevelPercent err = %s', err);
        } else {
            //console.log('getLossLevelPercent result = %j', rows);
            doCSV('./csv/lossLevelStatistics.csv', makeLossLevelPercentHeader() + makeLossLevelLines(rows));
            console.info('getLossLevelPercent ok!');
        }
        clean();
    });
}

program.command('lossLevelPercent')
    .description('流失等级分布')
    .action(getLossLevelPercent);

function makeBarrierRemainHeader() {
    return ['barrier', 'pass', 'singleLoss', 'totalLoss', 'avgCostTick', 'avgPower', 'avgReviveCnt', 'avgSuperSkillCnt',
            'avgJumpCnt', 'avgJumpSkillCnt', 'avgLoseCnt', 'avgLosePower'].join(',') + '\r\n';
}

function makeBarrierRemainLines(rows) {
    rows = rows || [];
    var lines = '';
    rows.forEach(function (row) {
        //lines += [row.barrier, row.pass, row.singleLoss, row.totalLoss, row.avgCostTick, row.avgPower, row.avgReviveCnt,
        //        row.avgSuperSkillCnt, row.avgJumpCnt, row.avgJumpSkillCnt].join(',') + '\r\n';
        lines += util.format('%s', row.barrier);
        lines += util.format(',%s%%', row.pass);
        lines += util.format(',%s%%', row.singleLoss);
        lines += util.format(',%s%%', row.totalLoss);
        lines += util.format(',%s', row.avgCostTick / 1000);
        lines += util.format(',%s', row.avgPower);
        lines += util.format(',%s', row.avgReviveCnt);
        lines += util.format(',%s', row.avgSuperSkillCnt);
        lines += util.format(',%s', row.avgJumpCnt);
        lines += util.format(',%s', row.avgJumpSkillCnt);
        lines += util.format(',%s', row.avgLoseCnt);
        lines += util.format(',%s\r\n', row.avgLosePower);
    });
    return lines;
}

function getBarrierRemain() {
    async.waterfall([
        function (callback) {
            passedBarrierDao.makeBarrierRemain(dbClient, callback);
        },
        function (success, callback) {
            if (success) {
                passedBarrierDao.getBarrierRemain(dbClient, callback);
            } else {
                callback(null, []);
            }
        }
    ], function (err, rows) {
        if (err) {
            console.info('getBarrierRemain err = %s', err);
        } else {
            doCSV('./csv/barrierRemain.csv', makeBarrierRemainHeader() + makeBarrierRemainLines(rows));
            console.info('getBarrierRemain ok!');
        }
        clean();
    });
}

program.command('barrierRemain')
    .description('关卡相关')
    .action(getBarrierRemain);

function makeGuideAchievement(rows) {
    var lines = '';
    rows.forEach(function (row) {
        lines += row.date;
        _.range(1, 201).forEach(function (guideIdx) {
            lines += util.format(',%s%%', row[util.format('guideId%s', guideIdx)]);
        });
        lines += '\r\n';
    });
    return lines;
}

function makeGuideAchievementHeader() {
    var headers = ['date'],
        guideDatas = dataApi.Guide.all();
    _.each(guideDatas, function (guideData) {
        headers.push(guideData.id);
    });
    return headers.join(',') + '\r\n';
}

function getGuideAchievement() {
    guideAchievementDao.getGuideAchievement(statClient, function (err, rows) {
        if (err) {
            clean();
        } else {
            doCSV('./csv/guideAchievement.csv', makeGuideAchievementHeader() + makeGuideAchievement(rows));
            console.info('getGuideAchievement ok!');
            clean();
        }
    });

}

program.command('guideAchievement')
    .description('引导达成分布')
    .action(getGuideAchievement);

function makePlayerRemainHeader() {
    return ['id', 'date', '2', '3', '4', '5', '6', '7', '8', '14', '30', 'totalUser', 'createPlayer', 'logonUser', 'activeUser',
            'lossUsers'].join(',') + '\r\n';
}

function getDateStr(tick) {
    var curTime = new Date(tick);
    return util.format('%s-%s', curTime.getMonth() + 1, curTime.getDate());
}

function makePlayerRemainRows(rows) {
    rows.forEach(function (row) {
        row.date = getDateStr(row.sampleTick);
    });
    return rows;
}

function makePlayerRemainLines(rows) {
    var lines = '';
    rows.forEach(function (row) {
        lines += util.format('%s,%s,%s%%,%s%%,%s%%,%s%%,%s%%,%s%%,%s%%,%s%%,%s%%,%s,%s,%s,%s,%s\r\n', row.id, row.date,
            row.todayEverLogonBaseOnNumOfDaysBeforeCreated_1 * 100, row.todayEverLogonBaseOnNumOfDaysBeforeCreated_2 * 100,
            row.todayEverLogonBaseOnNumOfDaysBeforeCreated_3 * 100, row.todayEverLogonBaseOnNumOfDaysBeforeCreated_4 * 100,
            row.todayEverLogonBaseOnNumOfDaysBeforeCreated_5 * 100, row.todayEverLogonBaseOnNumOfDaysBeforeCreated_6 * 100,
            row.todayEverLogonBaseOnNumOfDaysBeforeCreated_7 * 100, row.todayEverLogonBaseOnNumOfDaysBeforeCreated_15 * 100,
            row.todayEverLogonBaseOnNumOfDaysBeforeCreated_30 * 100, row.totalUser, row.createPlayer, row.everLogonTotal,
            row.activeUser, row.todayNeverLogonUser);
    });
    return lines;
}

function getPlayerRemain() {
    dailyReportDao.getDailyReport(statClient, function (err, rows) {
        if (err) {
            clean();
        } else {
            doCSV('./csv/playerRemain.csv', makePlayerRemainHeader() + makePlayerRemainLines(makePlayerRemainRows(rows)));
            console.info('getPlayerRemain ok!');
            clean();
        }
    });
}

program.command('playerRemain')
    .description('留存数据')
    .action(getPlayerRemain);

function makeTransformDailyHeader() {
    return ['id', 'date', 'selectServer', 'loadSuccess', 'logonSuccess'].join(',') + '\r\n';
}

function makeTransformDailyRows(rows) {
    rows.forEach(function (row) {
        row.date = getDateStr(row.createTick);
    });
    return rows;
}

function makeTransformDailyLines(rows) {
    var lines = '';
    rows.forEach(function (row) {
        lines += util.format('%s,%s,%s%%,%s%%,%s%%\r\n', row.id, row.date, row.selectServer * 100, row.loadSuccess * 100, row.logonSuccess * 100);
    });
    return lines;
}

function getTransformDaily() {
    transformDailyDao.getDaily(managerClient, function (err, rows) {
        if (err) {
            clean();
        } else {
            doCSV('./csv/transformDaily.csv', makeTransformDailyHeader() + makeTransformDailyLines(makeTransformDailyRows(rows)));
            console.info('getTransformDaily ok!');
            clean();
        }
    });
}

program.command('transformDaily')
    .description('登录部分')
    .action(getTransformDaily);

function makeFightHeroPercentHeaders() {
    var headers = ['date'],
        allHeroes = dataApi.HeroAttribute.all();
    _.each(allHeroes, function (heroData) {
        if (heroData.quality === 1) {
            headers.push(heroData.heroId);
        }
    });
    return headers.join(',') + '\r\n';
}

function getRealHeroCount() {
    var allHeroes = dataApi.HeroAttribute.all(),
        total = 0;
    _.each(allHeroes, function (heroData) {
        if (heroData.quality === 1) {
            total += 1;
        }
    });
    return total;
}

function makeFightHeroPercentLines(rows) {
    var lines = '';
    rows.forEach(function (row) {
        lines += row.date;
        _.range(1, Math.min(getRealHeroCount() + 1, 51)).forEach(function (heroIdx) {
            lines += util.format(',%s%%', row[util.format('heroId%s', heroIdx)]);
        });
        lines += '\r\n';
    });
    return lines;
}

function getFightHeroStatistics() {
    fightHeroStatisticsDao.getFightHeroPercent(statClient, function (err, rows) {
        if (err) {
            clean();
        } else {
            //console.log('getFightHeroStatistics rows = %j', rows);
            doCSV('./csv/fightHeroPercent.csv', makeFightHeroPercentHeaders() + makeFightHeroPercentLines(rows));
            console.info('getFightHeroStatistics ok!');
            clean();
        }
    });
}

/*
 *   上阵角色占比
 * */
program.command('fightHeroStatistics')
    .description('上阵角色占比')
    .action(getFightHeroStatistics);

function makeOnlineTimePercentHeader() {
    return ['date', '0-10', '10-20', '20-30', '30-60', '60-120', '120+'].join(',') + '\r\n';
}

function makeOnlineTimePercentLines(rows) {
    var lines = '';
    rows.forEach(function (row) {
        lines += row.date;
        _.range(1, 6 + 1).forEach(function (idx) {
            lines += util.format(',%s%%', row[util.format('percent%s', idx)]);
        });
        lines += '\r\n';
    });
    return lines;
}

function getOnlineTimePercent() {
    onlineTimePercentDao.getOnlineTimePercent(statClient, function (err, rows) {
        if (err) {
            clean();
        } else {
            doCSV('./csv/onlineTimePercent.csv', makeOnlineTimePercentHeader() + makeOnlineTimePercentLines(rows));
            console.info('getOnlineTimePercent ok!');
            clean();
        }
    });
}

/*
 *   在线时长占比
 * */
program.command('onlineTimePercent')
    .description('在线时长占比')
    .action(getOnlineTimePercent);

function makeLogonCountPercentHeader() {
    return ['date', '1', '2', '3', '4', '5+'].join(',') + '\r\n';
}

function makeLogonCountPercentLines(rows) {
    var lines = '';
    rows.forEach(function (row) {
        lines += row.date;
        _.range(1, 5 + 1).forEach(function (idx) {
            lines += util.format(',%s%%', row[util.format('percent%s', idx)]);
        });
        lines += '\r\n';
    });
    return lines;
}

function getLogonCountPercent() {
    logonCountPercentDao.getLogonCountPercent(statClient, function (err, rows) {
        if (err) {
            clean();
        } else {
            doCSV('./csv/logonCountPercent.csv', makeLogonCountPercentHeader() + makeLogonCountPercentLines(rows));
            console.info('getOnlineTimePercent ok!');
            clean();
        }
    });
}
/*
 *   上线次数占比
 * */
program.command('logonCountPercent')
    .description('上线次数占比')
    .action(getLogonCountPercent);

/*
* 日常任务活跃值统计 ===================================================================================================
* */

function makeDailyTaskActiveValueHeader() {
    return ['统计时间（月/日）', '注册时间', '玩家名称', '	当天日常任务活跃值'].join(',') + '\r\n';
}

function makeDailyTaskActiveValueLines(rows) {
    var lines = '';
    rows.forEach(function (row) {
        lines += util.format('%s,%s,%s,%s\r\n', row.date,row.registerTime,row.playerName,row.dailyTaskActiveValue);
    });
    return lines;
}

function getDailyTaskActiveValue()
{
    dailyTaskActiveValueDao.getDailyTaskActiveValue(statClient, function (err, rows) {
        if (err) {
            clean();
        } else {
            doCSV('./csv/dailyTaskActiveValue.csv', makeDailyTaskActiveValueHeader() + makeDailyTaskActiveValueLines(rows));
            console.info('getDailyTaskActiveValue ok!');
            clean();
        }
    });

};
program.command('dailyTaskActiveValue')
    .description('日常任务活跃值统计')
    .action(getDailyTaskActiveValue);

/*======================================================================================================================
 *                                          统计每个玩家每天参加无尽各个模式的次数
 *======================================================================================================================
 * */
function makeDailyEndlessFightCntHeader() {
    return ['统计时间（月/日）', '注册时间', '玩家名称', '无尽模式类型','当天参与次数','胜利次数'].join(',') + '\r\n';
}
function makeDailyEndlessFightCntLines(rows) {
    var lines = '';
    rows.forEach(function (row) {
        lines += util.format('%s,%s,%s,%s,%s,%s\r\n', row.date,row.registerTime,row.playerName,row.type,row.cnt,row.winCnt);
    });
    return lines;
}
function getDailyEndlessFightCnt()
{
    dailyEndlessFightCntDao.getDailyEndlessFightCnt(statClient, function (err, rows) {
        if (err) {
            clean();
        } else {
            doCSV('./csv/dailyEndlessFightCnt.csv', makeDailyEndlessFightCntHeader() + makeDailyEndlessFightCntLines(rows));
            console.info('getDailyEndlessFightCnt ok!');
            clean();
        }
    });
}

program.command('dailyEndlessFightCnt')
    .description('统计每个玩家每天参加无尽各个模式的次数')
    .action(getDailyEndlessFightCnt);

/*======================================================================================================================
 *                       穿满装备的时间统计 (统计每个玩家注册多久后把8个装备位都装上了装备)
 *======================================================================================================================
 * */
function makeArmEquipFullHeader() {
    return ['玩家名称', '注册时间', '注册多久后装满8个装备（时/分） '].join(',') + '\r\n';
}
function makeArmEquipFullLines(rows) {
    var lines = '';
    rows.forEach(function (row) {
        lines += util.format('%s,%s,%s\r\n', row.playerName,row.registerTime,row.finshTime);
    });
    return lines;
}
function getArmEquipFull()
{
    equipDao.getArmEquipFull(statClient, function (err, rows) {
        if (err) {
            clean();
        } else {
            doCSV('./csv/armEquipFull.csv', makeArmEquipFullHeader() + makeArmEquipFullLines(rows));
            console.info('getArmEquipFull ok!');
            clean();
        }
    });
}
program.command('armEquipFull')
    .description('穿满装备的时间统计')
    .action(getArmEquipFull);


/*======================================================================================================================
 *                       每日装备精炼次数
 *======================================================================================================================
 * */
function makeDailyRefineCntHeader() {
    return ['统计时间（月/日）', '注册时间','玩家名称', '当天进行装备精炼的总次数'].join(',') + '\r\n';
}
function makeDailyRefineCntLines(rows) {
    var lines = '';
    rows.forEach(function (row) {
        lines += util.format('%s,%s,%s,%s\r\n',row.date,row.registerTime, row.playerName,row.cnt);
    });
    return lines;
}
function getDailyRefineCnt()
{
    equipDao.getDailyRefineCnt(statClient, function (err, rows) {
        if (err) {
            clean();
        } else {
            doCSV('./csv/dailyRefineCnt.csv', makeDailyRefineCntHeader() + makeDailyRefineCntLines(rows));
            console.info('getDailyRefineCnt ok!');
            clean();
        }
    });
}
program.command('dailyRefineCnt')
    .description('穿满装备的时间统计')
    .action(getDailyRefineCnt);


/*======================================================================================================================
 *                      装备详细养成统计 之 装备精炼等级
 *======================================================================================================================
 * */
function makeDailyRefineLvHeader() {
    return ['统计时间（月/日）', '注册时间','玩家名称', '装备位1的精炼等级', '装备位2的精炼等级', '装备位3的精炼等级', '装备位4的精炼等级', '装备位5的精炼等级', '装备位6的精炼等级', '装备位7的精炼等级', '装备位8的精炼等级','当天平均精炼等级'].join(',') + '\r\n';
}
function makeDailyRefineLvLines(rows) {
    var lines = '';
    rows.forEach(function (row) {
        var pos1 =  row.pos1|| 0;
        var pos2 =   row.pos2|| 0;
        var pos3 =  row.pos3|| 0;
        var pos4 = row.pos4|| 0;
        var pos5 = row.pos5|| 0;
        var pos6 = row.pos6|| 0;
        var pos7 = row.pos7|| 0;
        var pos8 = row.pos8|| 0;
        var temp =pos1+pos2+pos3+pos4+pos5+pos6+pos7+pos8;
        temp = temp / 8;
        lines += util.format('%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\r\n', row.date,row.registerTime,row.playerName,pos1,pos2,pos3,pos4,pos5,pos6,pos7,pos8,temp.toFixed(1));
    });
    return lines;
}
function getDailyRefineLv()
{
    equipDao.getDailyRefineLvInfo(statClient, function (err, rows) {
        if (err) {
            clean();
        } else {
            doCSV('./csv/dailyRefineLv.csv', makeDailyRefineLvHeader() + makeDailyRefineLvLines(rows));
            console.info('getDailyRefineLv ok!');
            clean();
        }
    });
}
program.command('dailyRefineLv')
    .description('装备详细养成统计 之 装备精炼等级')
    .action(getDailyRefineLv);

/*======================================================================================================================
 *                      装备详细养成统计 之 装备觉醒等级
 *======================================================================================================================
 * */
function makeDailyAwakeLvHeader() {
    return ['统计时间（月/日）', '注册时间','玩家名称', '装备位1的觉醒等级', '装备位2的觉醒等级', '装备位3的觉醒等级', '装备位4的觉醒等级', '装备位5的觉醒等级', '装备位6的觉醒等级', '装备位7的觉醒等级', '装备位8的觉醒等级','当天平均觉醒等级'].join(',') + '\r\n';
}
function makeDailyAwakeLvLines(rows) {
    var lines = '';
    rows.forEach(function (row) {
        var pos1 =  row.pos1|| 0;
        var pos2 =   row.pos2|| 0;
        var pos3 =  row.pos3|| 0;
        var pos4 = row.pos4|| 0;
        var pos5 = row.pos5|| 0;
        var pos6 = row.pos6|| 0;
        var pos7 = row.pos7|| 0;
        var pos8 = row.pos8|| 0;
        var temp =pos1+pos2+pos3+pos4+pos5+pos6+pos7+pos8;
        temp = temp / 8;
        lines += util.format('%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\r\n', row.date,row.registerTime,row.playerName,pos1,pos2,pos3,pos4,pos5,pos6,pos7,pos8,temp.toFixed(1));
    });
    return lines;
}
function getDailyAwakeLv()
{
    equipDao.getDailyAwakeLvInfo(statClient, function (err, rows) {
        if (err) {
            clean();
        } else {
            doCSV('./csv/dailyAwakeLv.csv', makeDailyAwakeLvHeader() + makeDailyAwakeLvLines(rows));
            console.info('getDailyAwakeLv ok!');
            clean();
        }
    });
}
program.command('dailyAwakeLv')
    .description('装备详细养成统计 之 装备觉醒等级')
    .action(getDailyAwakeLv);

/*======================================================================================================================
 *                       每日钻石使用
 *======================================================================================================================
 * */
function makeUseDiamondHeader() {
    return ['消耗时间（月/日/时/分/秒）','玩家名称', '消耗途径类型','本次消耗的钻石数量','剩余钻石数量','商品ID'].join(',') + '\r\n';
}
function makeUseDiamondLines(rows) {
    var lines = '';
    rows.forEach(function (row) {
        var tempTime = row.date +'  '+ row.time;
        lines += util.format('%s,%s,%s,%s,%s\r\n',tempTime,row.playerName, row.useWay,row.useDiamond,row.surplusDiamond,row.shopGoodsId);
    });
    return lines;
}
function getUseDiamond()
{
    useDiamondDao.getDailyUseDiamond(statClient, function (err, rows) {
        if (err) {
            clean();
        } else {
            doCSV('./csv/useDiamond.csv', makeUseDiamondHeader() + makeUseDiamondLines(rows));
            console.info('getUseDiamond ok!');
            clean();
        }
    });
}
program.command('useDiamond')
    .description('每日钻石使用')
    .action(getUseDiamond);

/*======================================================================================================================
 *                       每日竞技点
 *======================================================================================================================
 * */
function makeDailyComPointHeader() {
    return ['统计时间','注册时间', '玩家名称','当天获得奖杯数量','当天消耗奖杯数量'].join(',') + '\r\n';
}
function makeDailyComPointLines(rows) {
    var lines = '';
    rows.forEach(function (row) {
        lines += util.format('%s,%s,%s,%s,%s\r\n',row.date, row.registerTime,row.playerName,row.getComPoint,row.useComPoint);
    });
    return lines;
}
function getDailyComPoint()
{
    comPointDao.getDailyComPoint(statClient, function (err, rows) {
        if (err) {
            clean();
        } else {
            doCSV('./csv/dailyComPoint.csv', makeDailyComPointHeader() + makeDailyComPointLines(rows));
            console.info('getDailyComPoint ok!');
            clean();
        }
    });
}
program.command('dailyComPoint')
    .description(' 每日竞技点')
    .action(getDailyComPoint);

/*======================================================================================================================
 *                       最新关卡id
 *======================================================================================================================
 * */
function makeNewBarrierIdHeader() {
    return ['统计时间', '玩家名称','关卡类型（1普通/2精英）','最新挑战的关卡ID'].join(',') + '\r\n';
}
function makeNewBarrierIdLines(rows) {
    var lines = '';
    rows.forEach(function (row) {
        lines += util.format('%s,%s,%s,%s\r\n',row.date,row.playerName,row.type,row.newBarrierId);
    });
    return lines;
}
function getNewBarrierId()
{
    passedBarrierDao.getNewBarrierId(statClient, function (err, rows) {
        if (err) {
            clean();
        } else {
            doCSV('./csv/newBarrierId.csv', makeNewBarrierIdHeader() + makeNewBarrierIdLines(rows));
            console.info('getNewBarrierId ok!');
            clean();
        }
    });
}
program.command('newBarrierId')
    .description(' 最新关卡id')
    .action(getNewBarrierId);



/*======================================================================================================================
 *                       每日章节星数统计
 *======================================================================================================================
 * */
function makeDailyChapterStarCntHeader() {
    return ['统计时间','注册时间', '玩家名称','第1章总星数','第2章总星数','第3章总星数','第4章总星数','第5章总星数','第6章总星数','第7章总星数','第8章总星数'].join(',') + '\r\n';
}
function makeDailyChapterStarCntLines(rows) {
    var lines = '';
    rows.forEach(function (row) {
        lines += util.format('%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\r\n',row.date,row.registerTime,row.playerName,row.chapter1,row.chapter2,row.chapter3,row.chapter4,row.chapter5,row.chapter6,row.chapter7,row.chapter8);
    });
    return lines;
}
function getDailyChapterStarCnt()
{
    passedBarrierDao.getDailyChapterStarCnt(statClient, function (err, rows) {
        if (err) {
            clean();
        } else {
            doCSV('./csv/dailyChapterStarCnt.csv', makeDailyChapterStarCntHeader() + makeDailyChapterStarCntLines(rows));
            console.info('getDailyChapterStarCnt ok!');
            clean();
        }
    });
}
program.command('dailyChapterStarCnt')
    .description(' 每日章节星数统计')
    .action(getDailyChapterStarCnt);



/*======================================================================================================================
 *                       玩家流失点记录
 *======================================================================================================================
 * */
function makePlayerBehaivorHeader() {
    return ['玩家ID','玩家名字', '上阵角色等级','触发年月日','触发时分秒','界面层/场景','不同界面附加记录'].join(',') + '\r\n';
}
function makePlayerBehaivorLines(rows) {
    var lines = '';
    rows.forEach(function (row) {

        var playerId = row.playerId;
        var playerName = row.playerName;
        var behaviorInfo =JSON.parse( row.behaviorInfo );
        _.each(behaviorInfo,function(data){
            var touchTime = new Date(data.time);
            var strYMD =moment(touchTime).format("YYYY-MM-DD");
            var strHMS =moment(touchTime).format("HH:mm:ss");
            lines += util.format('%s,%s,%s,%s,%s,%s,%s\r\n',playerId,playerName,data.heroLv,strYMD,strHMS,data.id,data.parameter1);
        });

    });
    return lines;
}
function getPlayerBehaivor()
{
    playerBehaivorDao.getPlayerBehaivor(dbClient, function (err, rows) {
        if (err) {
            clean();
        } else {
            doCSV('./csv/playerBehaivor.csv', makePlayerBehaivorHeader() + makePlayerBehaivorLines(rows));
            console.info('getPlayerBehaivor ok!');
            clean();
        }
    });
}
program.command('playerBehaivor')
    .description(' 玩家流失点记录')
    .action(getPlayerBehaivor);




/*======================================================================================================================
 *                       玩家充值时的账号状态记录
 *======================================================================================================================
 * */
function makeRechargePlayerInfoHeader() {
    return ['日期年月日','日期时分秒', '	玩家名字','当前战力','普通关卡最新进度','充值的是哪一档的','充值后的账号钻石总数'].join(',') + '\r\n';
}
function makeRechargePlayerInfoLines(rows) {
    var lines = '';
    rows.forEach(function (row) {
        var playerId = row.playerId;
        var playerName = row.playerName;
        var productId = row.productId;
        var fightValue = row.fightValue;
        var normalLastBarrierId = row.normalLastBarrierId;
        var gameMoney = row.gameMoney;

        var touchTime = new Date(row.rechargeTime);
        var strYMD =moment(touchTime).format("YYYY-MM-DD");
        var strHMS =moment(touchTime).format("HH:mm:ss");

        lines += util.format('%s,%s,%s,%s,%s,%s,%s\r\n',strYMD,strHMS,playerName,fightValue,normalLastBarrierId,productId,gameMoney);
    });
    return lines;
}
function getRechargePlayerInfo()
{
    rechargePlayerInfoDao.getRechargeAllInfo(logClient, function (err, rows) {
        if (err) {
            clean();
        } else {
            doCSV('./csv/rechargePlayerInfo.csv',makeRechargePlayerInfoHeader() + makeRechargePlayerInfoLines(rows));
            console.info('getRechargePlayerInfo ok!');
            clean();
        }
    });
}
program.command('rechargePlayerInfo')
    .description(' 玩家充值时的账号状态记录')
    .action(getRechargePlayerInfo);


program.parse(process.argv);