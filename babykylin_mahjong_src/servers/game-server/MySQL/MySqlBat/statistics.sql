drop table if exists GuideAchievement;

/*==============================================================*/
/* Table: GuideAchievement                                      */
/*==============================================================*/
create table GuideAchievement
(
   guideId              integer(10) not null,
   total                int(10) default 1,
   primary key (guideId)
)
ENGINE= InnoDB;

drop table if exists DailyReport;

/*==============================================================*/
/* Table: DailyReport                                           */
/*==============================================================*/
create table DailyReport
(
   id                   bigint(20) not null auto_increment,
   sampleTick           bigint(20),
   totalUser            int(10) default 0,
   createPlayer         int(10) default 0,
   everLogonTotal       int(10) default 0,
   activeUser           int(10) default 0,
   todayNeverLogonUser  int(10) default 0,
   todayEverLogonBaseOnNumOfDaysBeforeCreated_1 double default 0,
   todayEverLogonBaseOnNumOfDaysBeforeCreated_2 double default 0,
   todayEverLogonBaseOnNumOfDaysBeforeCreated_3 double default 0,
   todayEverLogonBaseOnNumOfDaysBeforeCreated_4 double default 0,
   todayEverLogonBaseOnNumOfDaysBeforeCreated_5 double default 0,
   todayEverLogonBaseOnNumOfDaysBeforeCreated_6 double default 0,
   todayEverLogonBaseOnNumOfDaysBeforeCreated_7 double default 0,
   todayEverLogonBaseOnNumOfDaysBeforeCreated_15 double default 0,
   todayEverLogonBaseOnNumOfDaysBeforeCreated_30 double default 0,
   primary key (id)
)
auto_increment = 10000
ENGINE= InnoDB;

drop table if exists FightHeroStatistics;

/*==============================================================*/
/* Table: FightHeroStatistics                                   */
/*==============================================================*/
create table FightHeroStatistics
(
   id                   bigint(20) not null auto_increment,
   date                 char(11),
   heroId1              double,
   heroId2              double,
   heroId3              double,
   heroId4              double,
   heroId5              double,
   heroId6              double,
   heroId7              double,
   heroId8              double,
   heroId9              double,
   heroId10             double,
   heroId11             double,
   heroId12             double,
   heroId13             double,
   heroId14             double,
   heroId15             double,
   heroId16             double,
   heroId17             double,
   heroId18             double,
   heroId19             double,
   heroId20             double,
   heroId21             double,
   heroId22             double,
   heroId23             double,
   heroId24             double,
   heroId25             double,
   heroId26             double,
   heroId27             double,
   heroId28             double,
   heroId29             double,
   heroId30             double,
   heroId31             double,
   heroId32             double,
   heroId33             double,
   heroId34             double,
   heroId35             double,
   heroId36             double,
   heroId37             double,
   heroId38             double,
   heroId39             double,
   heroId40             double,
   heroId41             double,
   heroId42             double,
   heroId43             double,
   heroId44             double,
   heroId45             double,
   heroId46             double,
   heroId47             double,
   heroId48             double,
   heroId49             double,
   heroId50             double,
   primary key (id)
)
auto_increment = 10000
ENGINE= InnoDB
DEFAULT CHARACTER SET= utf8;

drop table if exists DailyOnlineTimePercent;

/*==============================================================*/
/* Table: DailyOnlineTimePercent                                */
/*==============================================================*/
create table DailyOnlineTimePercent
(
   id                   bigint(20) not null auto_increment,
   date                 char(11),
   percent1             double,
   percent2             double,
   percent3             double,
   percent4             double,
   percent5             double,
   percent6             double,
   primary key (id)
)
auto_increment = 10000
ENGINE= InnoDB
DEFAULT CHARACTER SET= utf8;

drop table if exists DailyLogonCountPercent;

/*==============================================================*/
/* Table: DailyLogonCountPercent                                */
/*==============================================================*/
create table DailyLogonCountPercent
(
   id                   bigint(20) not null auto_increment,
   date                 char(11),
   percent1             double,
   percent2             double,
   percent3             double,
   percent4             double,
   percent5             double,
   primary key (id)
)
auto_increment = 10000
ENGINE= InnoDB
DEFAULT CHARACTER SET= utf8;

drop table if exists GuideAchievementPercent;

/*==============================================================*/
/* Table: GuideAchievementPercent                               */
/*==============================================================*/
create table GuideAchievementPercent
(
   id                   bigint(20) not null auto_increment,
   date                 char(11),
   guideId1             double,
   guideId2             double,
   guideId3             double,
   guideId4             double,
   guideId5             double,
   guideId6             double,
   guideId7             double,
   guideId8             double,
   guideId9             double,
   guideId10            double,
   guideId11            double,
   guideId12            double,
   guideId13            double,
   guideId14            double,
   guideId15            double,
   guideId16            double,
   guideId17            double,
   guideId18            double,
   guideId19            double,
   guideId20            double,
   guideId21            double,
   guideId22            double,
   guideId23            double,
   guideId24            double,
   guideId25            double,
   guideId26            double,
   guideId27            double,
   guideId28            double,
   guideId29            double,
   guideId30            double,
   guideId31            double,
   guideId32            double,
   guideId33            double,
   guideId34            double,
   guideId35            double,
   guideId36            double,
   guideId37            double,
   guideId38            double,
   guideId39            double,
   guideId40            double,
   guideId41            double,
   guideId42            double,
   guideId43            double,
   guideId44            double,
   guideId45            double,
   guideId46            double,
   guideId47            double,
   guideId48            double,
   guideId49            double,
   guideId50            double,
   guideId51            double,
   guideId52            double,
   guideId53            double,
   guideId54            double,
   guideId55            double,
   guideId56            double,
   guideId57            double,
   guideId58            double,
   guideId59            double,
   guideId60            double,
   guideId61            double,
   guideId62            double,
   guideId63            double,
   guideId64            double,
   guideId65            double,
   guideId66            double,
   guideId67            double,
   guideId68            double,
   guideId69            double,
   guideId70            double,
   guideId71            double,
   guideId72            double,
   guideId73            double,
   guideId74            double,
   guideId75            double,
   guideId76            double,
   guideId77            double,
   guideId78            double,
   guideId79            double,
   guideId80            double,
   guideId81            double,
   guideId82            double,
   guideId83            double,
   guideId84            double,
   guideId85            double,
   guideId86            double,
   guideId87            double,
   guideId88            double,
   guideId89            double,
   guideId90            double,
   guideId91            double,
   guideId92            double,
   guideId93            double,
   guideId94            double,
   guideId95            double,
   guideId96            double,
   guideId97            double,
   guideId98            double,
   guideId99            double,
   guideId100           double,
   guideId101             double,
  guideId102             double,
  guideId103             double,
  guideId104             double,
  guideId105             double,
  guideId106             double,
  guideId107             double,
  guideId108             double,
  guideId109             double,
  guideId110            double,
  guideId111            double,
  guideId112            double,
  guideId113            double,
  guideId114            double,
  guideId115            double,
  guideId116            double,
  guideId117            double,
  guideId118            double,
  guideId119            double,
  guideId120            double,
  guideId121            double,
  guideId122            double,
  guideId123            double,
  guideId124            double,
  guideId125            double,
  guideId126            double,
  guideId127            double,
  guideId128            double,
  guideId129            double,
  guideId130            double,
  guideId131            double,
  guideId132            double,
  guideId133            double,
  guideId134            double,
  guideId135            double,
  guideId136            double,
  guideId137            double,
  guideId138            double,
  guideId139            double,
  guideId140            double,
  guideId141            double,
  guideId142            double,
  guideId143            double,
  guideId144            double,
  guideId145            double,
  guideId146            double,
  guideId147            double,
  guideId148            double,
  guideId149            double,
  guideId150            double,
  guideId151            double,
  guideId152            double,
  guideId153            double,
  guideId154            double,
  guideId155            double,
  guideId156            double,
  guideId157            double,
  guideId158            double,
  guideId159            double,
  guideId160            double,
  guideId161            double,
  guideId162            double,
  guideId163            double,
  guideId164            double,
  guideId165            double,
  guideId166            double,
  guideId167            double,
  guideId168            double,
  guideId169            double,
  guideId170            double,
  guideId171            double,
  guideId172            double,
  guideId173            double,
  guideId174            double,
  guideId175            double,
  guideId176            double,
  guideId177            double,
  guideId178            double,
  guideId179            double,
  guideId180            double,
  guideId181            double,
  guideId182            double,
  guideId183            double,
  guideId184            double,
  guideId185            double,
  guideId186            double,
  guideId187            double,
  guideId188            double,
  guideId189            double,
  guideId190            double,
  guideId191            double,
  guideId192            double,
  guideId193            double,
  guideId194            double,
  guideId195            double,
  guideId196            double,
  guideId197            double,
  guideId198            double,
  guideId199            double,
  guideId200           double,
   primary key (id)
)
auto_increment = 10000
ENGINE= InnoDB
DEFAULT CHARACTER SET= utf8;

drop table if exists PlayerLossLevelPercent;

/*==============================================================*/
/* Table: PlayerLossLevelPercent                                */
/*==============================================================*/
create table PlayerLossLevelPercent
(
   id                   bigint(20) not null auto_increment,
   date                 char(11),
   percent1             double,
   percent2             double,
   percent3             double,
   percent4             double,
   percent5             double,
   percent6             double,
   percent7             double,
   percent8             double,
   percent9             double,
   percent10            double,
   percent11            double,
   percent12            double,
   percent13            double,
   percent14            double,
   percent15            double,
   percent16            double,
   percent17            double,
   percent18            double,
   percent19            double,
   percent20            double,
   percent21            double,
   percent22            double,
   percent23            double,
   percent24            double,
   percent25            double,
   percent26            double,
   percent27            double,
   percent28            double,
   percent29            double,
   percent30            double,
   percent31            double,
   percent32            double,
   percent33            double,
   percent34            double,
   percent35            double,
   percent36            double,
   percent37            double,
   percent38            double,
   percent39            double,
   percent40            double,
   percent41            double,
   percent42            double,
   percent43            double,
   percent44            double,
   percent45            double,
   percent46            double,
   percent47            double,
   percent48            double,
   percent49            double,
   percent50            double,
   percent51            double,
   percent52            double,
   percent53            double,
   percent54            double,
   percent55            double,
   percent56            double,
   percent57            double,
   percent58            double,
   percent59            double,
   percent60            double,
   percent61            double,
   percent62            double,
   percent63            double,
   percent64            double,
   percent65            double,
   percent66            double,
   percent67            double,
   percent68            double,
   percent69            double,
   percent70            double,
   percent71            double,
   percent72            double,
   percent73            double,
   percent74            double,
   percent75            double,
   percent76            double,
   percent77            double,
   percent78            double,
   percent79            double,
   percent80            double,
   percent81            double,
   percent82            double,
   percent83            double,
   percent84            double,
   percent85            double,
   percent86            double,
   percent87            double,
   percent88            double,
   percent89            double,
   percent90            double,
   percent91            double,
   percent92            double,
   percent93            double,
   percent94            double,
   percent95            double,
   percent96            double,
   percent97            double,
   percent98            double,
   percent99            double,
   percent100           double,
   percent101           double,
   percent102           double,
   percent103           double,
   percent104           double,
   percent105           double,
   percent106           double,
   percent107           double,
   percent108           double,
   percent109           double,
   percent110           double,
   percent111           double,
   percent112           double,
   percent113           double,
   percent114           double,
   percent115           double,
   percent116           double,
   percent117           double,
   percent118           double,
   percent119           double,
   percent120           double,
   percent121           double,
   percent122           double,
   percent123           double,
   percent124           double,
   percent125           double,
   percent126           double,
   percent127           double,
   percent128           double,
   percent129           double,
   percent130           double,
   percent131           double,
   percent132           double,
   percent133           double,
   percent134           double,
   percent135           double,
   percent136           double,
   percent137           double,
   percent138           double,
   percent139           double,
   percent140           double,
   percent141           double,
   percent142           double,
   percent143           double,
   percent144           double,
   percent145           double,
   percent146           double,
   percent147           double,
   percent148           double,
   percent149           double,
   percent150           double,
   percent151           double,
   percent152           double,
   percent153           double,
   percent154           double,
   percent155           double,
   percent156           double,
   percent157           double,
   percent158           double,
   percent159           double,
   percent160           double,
   percent161           double,
   percent162           double,
   percent163           double,
   percent164           double,
   percent165           double,
   percent166           double,
   percent167           double,
   percent168           double,
   percent169           double,
   percent170           double,
   percent171           double,
   percent172           double,
   percent173           double,
   percent174           double,
   percent175           double,
   percent176           double,
   percent177           double,
   percent178           double,
   percent179           double,
   percent180           double,
   percent181           double,
   percent182           double,
   percent183           double,
   percent184           double,
   percent185           double,
   percent186           double,
   percent187           double,
   percent188           double,
   percent189           double,
   percent190           double,
   percent191           double,
   percent192           double,
   percent193           double,
   percent194           double,
   percent195           double,
   percent196           double,
   percent197           double,
   percent198           double,
   percent199           double,
   percent200           double,
   primary key (id)
)
auto_increment = 10000
ENGINE= InnoDB
DEFAULT CHARACTER SET= utf8;

drop table if exists equipBattleStatistics;

/*==============================================================*/
/* Table: equipBattleStatistics                                 */
/*==============================================================*/
create table equipBattleStatistics
(
   id                   bigint(20) not null auto_increment,
   data                 char(11),
   playerName           char(20) binary,
   pos                  bigint(20),
   primary key (id)
)
auto_increment = 100000
ENGINE= InnoDB
DEFAULT CHARACTER SET= utf8;

drop table if exists roleCultivateStatistics;

/*==============================================================*/
/* Table: roleCultivateStatistics                               */
/*==============================================================*/
create table roleCultivateStatistics
(
   id                   bigint(20) not null auto_increment,
   data                 char(11),
   playerName           char(20) binary,
   heroId               binary(20),
   type                 bigint,
   bfValue              binary(20),
   afValue              binary(20),
   primary key (id)
)
auto_increment = 100000
ENGINE= InnoDB
DEFAULT CHARACTER SET= utf8;



drop table if exists DailyTaskActiveValueSTTE;

/*==============================================================*/
/* Table: DailyTaskActiveValueSTTE                              */
/*==============================================================*/
create table DailyTaskActiveValueSTTE
(
   playerId             bigint(20) not null,
   date                 varchar(20) not null,
   registerTime         varchar(20),
   playerName           varchar(20),
   dailyTaskActiveValue bigint(20),
   primary key (playerId, date)
)
ENGINE= InnoDB
DEFAULT CHARACTER SET= utf8;


drop table if exists newBarrierIdSTTE;

/*==============================================================*/
/* Table: newBarrierIdSTTE                                      */
/*==============================================================*/
create table newBarrierIdSTTE
(
   playerId             bigint(20) not null,
   date                 char(20),
   playerName           char(20),
   type                 bigint not null,
   newBarrierId         bigint(20),
   primary key (playerId, type)
)
ENGINE= InnoDB
DEFAULT CHARACTER SET= utf8;


drop table if exists DailyEndlessSTTE;

/*==============================================================*/
/* Table: DailyEndlessSTTE                                      */
/*==============================================================*/
create table DailyEndlessSTTE
(
   playerId             bigint(20) not null,
   registerTime         char(20),
   date                 char(20) not null,
   playerName           char(20),
   type                 bigint(20) not null,
   cnt                  varchar(1024),
   winCnt               bigint(20),
   primary key (playerId, date, type)
)
ENGINE= InnoDB
DEFAULT CHARACTER SET= utf8;


drop table if exists DailyRefineCntSTTE;

/*==============================================================*/
/* Table: DailyRefineCntSTTE                                    */
/*==============================================================*/
create table DailyRefineCntSTTE
(
   playerId             bigint(20) not null,
   playerName           char(20),
   registerTime         char(20),
   date                 char(20),
   cnt                  bigint,
   primary key (playerId)
)
ENGINE= InnoDB
DEFAULT CHARACTER SET= utf8;


drop table if exists ArmEquipFullSTTE;

/*==============================================================*/
/* Table: ArmEquipFullSTTE                                      */
/*==============================================================*/
create table ArmEquipFullSTTE
(
   playerId             bigint(20) not null,
   registerTime         char(20),
   playerName           char(20),
   finshTime            char(20),
   primary key (playerId)
)
ENGINE= InnoDB
DEFAULT CHARACTER SET= utf8;

drop table if exists DailyEquipRefineLvSTTE;

/*==============================================================*/
/* Table: DailyEquipRefineLvSTTE                                */
/*==============================================================*/
create table DailyEquipRefineLvSTTE
(
   playerId             bigint(20) not null,
   registerTime         char(20),
   date                 char(20) not null,
   playerName           char(20),
   pos1                 bigint,
   pos2                 bigint,
   pos3                 bigint,
   pos4                 bigint,
   pos5                 bigint,
   pos6                 bigint,
   pos7                 bigint,
   pos8                 bigint,
   primary key (playerId, date)
)
ENGINE= InnoDB
DEFAULT CHARACTER SET= utf8;

drop table if exists DailyEquipAwakeLvSTTE;

/*==============================================================*/
/* Table: DailyEquipAwakeLvSTTE                                 */
/*==============================================================*/
create table DailyEquipAwakeLvSTTE
(
   playerId             bigint(20) not null,
   registerTime         char(20),
   date                 char(20) not null,
   playerName           char(20),
   pos1                 bigint,
   pos2                 bigint,
   pos3                 bigint,
   pos4                 bigint,
   pos5                 bigint,
   pos6                 bigint,
   pos7                 bigint,
   pos8                 bigint,
   primary key (playerId, date)
)
ENGINE= InnoDB
DEFAULT CHARACTER SET= utf8;

drop table if exists DailyUseDiamondSTTE;

/*==============================================================*/
/* Table: DailyUseDiamondSTTE                                   */
/*==============================================================*/
create table DailyUseDiamondSTTE
(
   playerId             bigint(20) not null,
   date                 char(20) not null,
   playerName           char(20),
   useWay               bigint,
   useDiamond           bigint(20),
   surplusDiamond       bigint(20),
   time                 char(30) not null,
   shopGoodsId          bigint(20),
   primary key (playerId, date, time)
)
ENGINE= InnoDB
DEFAULT CHARACTER SET= utf8;

drop table if exists DailyCompointSTTE;

/*==============================================================*/
/* Table: DailyCompointSTTE                                     */
/*==============================================================*/
create table DailyCompointSTTE
(
   playerId             bigint(20) not null,
   date                 char(20) not null,
   registerTime         char(20),
   playerName           char(20),
   getComPoint          bigint(20),
   useComPoint          bigint(20),
   primary key (playerId, date)
)
ENGINE= InnoDB
DEFAULT CHARACTER SET= utf8;

drop table if exists barrierStarSTTE;

/*==============================================================*/
/* Table: barrierStarSTTE                                       */
/*==============================================================*/
create table barrierStarSTTE
(
   playerId             bigint(20) not null,
   date                 char(20) not null,
   registerTime         char(20),
   playerName           char(20),
   chapter1             bigint,
   chapter2             bigint,
   chapter3             bigint,
   chapter4             bigint,
   chapter5             bigint,
   chapter6             bigint,
   chapter7             bigint,
   chapter8             bigint,
   primary key (playerId, date)
)
ENGINE= InnoDB
DEFAULT CHARACTER SET= utf8;