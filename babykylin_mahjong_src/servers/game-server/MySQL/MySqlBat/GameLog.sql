/*==============================================================*/
/* SET group_concat_max_len=102400;
/*==============================================================*/

/*==============================================================*/
/* codes below generated by PowerDesigner                                                  */
/*==============================================================*/

drop table if exists PlayerActionLog;

/*==============================================================*/
/* Table: PlayerActionLog                                       */
/*==============================================================*/
create table PlayerActionLog
(
   id                   bigint(20) not null auto_increment,
   playerId             bigint(20),
   type                 int(10),
   detail               text,
   logTime              bigint(20),
   primary key (id),
   key AK_Key_playerId (playerId),
   key AK_Key_type (type),
   key AK_Key_playerId_type (type)
)
auto_increment = 10000
ENGINE= InnoDB;


drop table if exists logRechargePlayerInfo;

/*==============================================================*/
/* Table: logRechargePlayerInfo                                 */
/*==============================================================*/
create table logRechargePlayerInfo
(
   id                   bigint(20) not null auto_increment,
   playerId             bigint(10) not null,
   playerName           char(50),
   productId            char(50),
   fightValue           char(20),
   normalLastBarrierId  bigint(10),
   gameMoney            bigint(50),
   rechargeTime         bigint(20),
   primary key (id),
   key AK_Key_playerId (playerId)
)
auto_increment = 10000
ENGINE= InnoDB;

drop table if exists clientActionLog;

/*==============================================================*/
/* Table: clientActionLog                                 */
/*==============================================================*/
create table clientActionLog
(
   id                   bigint(20) not null auto_increment,
   playerId             bigint(10) not null,
   type                 int(10),
   msg                  varchar(500),
   primary key (id),
   key AK_Key_playerId (playerId)
)
auto_increment = 10000
ENGINE= InnoDB;

drop table if exists logItemFlow;

/*==============================================================*/
/* Table: logItemFlow                                 */
/*==============================================================*/
create table logItemFlow
(
   id                   bigint(20) not null auto_increment,
   playerId             int(10) not null,
   serverId             int(10) ,
   flowType             int(10) ,
   flowSource           int(10) ,
   itemType             int(10) ,
   itemId               int(10) ,
   amount               int(10) ,
   preCount             int(10) ,
   nowCount             int(10) ,
   logTime              bigint(20),
   primary key (id),
   key AK_Key_playerId (playerId)
)
auto_increment = 10000
ENGINE= InnoDB;

