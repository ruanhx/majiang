drop table if exists log_loginreg_msg;
CREATE TABLE `log_loginreg_msg` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `channel_id` varchar(32) DEFAULT NULL COMMENT '渠道ID',
  `server_id` int(11) DEFAULT NULL COMMENT '区服id',
  `device_num` varchar(64) DEFAULT NULL COMMENT '设备id',
  `account_id` varchar(64) DEFAULT NULL COMMENT '账号id',
  `role_id` bigint(20) DEFAULT NULL COMMENT '角色id',
  `role_nickname` varchar(64) DEFAULT NULL COMMENT '角色名',
  `role_level` int(11) DEFAULT NULL COMMENT '当前角色等级',
  `add_ip` varchar(32) DEFAULT NULL COMMENT 'ip',
  `daytime` varchar(11) DEFAULT NULL COMMENT '日期{精确到天}',
  `addtime` bigint(20) DEFAULT NULL COMMENT '时间戳',
  `type` tinyint(4) DEFAULT '0' COMMENT '0:注册；3:创角；1：登陆；2：下线',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

drop table if exists log_pay_record;
CREATE TABLE `log_pay_record` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_id` varchar(90) NOT NULL COMMENT '订单号',
  `channel_id` varchar(32) NOT NULL COMMENT '渠道id',
  `device_num` varchar(64) NOT NULL COMMENT '设备id',
  `account_id` varchar(64) NOT NULL COMMENT '账号id',
  `server_id` int(11) NOT NULL COMMENT '区服id',
  `role_id` bigint(20) NOT NULL COMMENT '角色id',
  `role_level` smallint(6) NOT NULL DEFAULT '0' COMMENT '角色当前付费等级',
  `amount` int(11) NOT NULL COMMENT ' 金额数（元）',
  `status` tinyint(4) NOT NULL COMMENT '1成功（到账）；2失败（未到账）',
  `addip` varchar(16) NOT NULL COMMENT 'IP',
  `daytime` datetime NOT NULL  COMMENT '2017-08-10 10:55:00',
  `addtime` bigint(20) NOT NULL DEFAULT '0' COMMENT '记录时间戳',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='付费记录';

drop table if exists log_online;
CREATE TABLE `log_online` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `server_id` smallint(6) NOT NULL COMMENT '1区服id',
  `log_date` datetime NOT NULL  COMMENT '2017-08-10 10:55:00',
  `amount` int(11) NOT NULL COMMENT '(当前在线人数)',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

drop table if exists t_game_role;
CREATE TABLE `t_game_role` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `account` varchar(64) NOT NULL COMMENT '帐号',
  `user_id` varchar(64) NOT NULL COMMENT '用户id',
  `role_id` bigint(20) NOT NULL COMMENT '角色id',
  `server_id` int(11) NOT NULL COMMENT '服务器id',
  `nickname` varchar(64) NOT NULL COMMENT '角色名',
  `channel_id` varchar(10) DEFAULT '0' COMMENT '渠道id',
  `profession` tinyint(4) DEFAULT '0' COMMENT '职业',
  `level` smallint(6) DEFAULT '0' COMMENT '等级',
  `copper` bigint(20) DEFAULT '0' COMMENT '铜钱',
  `bind_gold` bigint(20) DEFAULT '0' COMMENT '绑定元宝',
  `gold_ingot` bigint(20) DEFAULT '0',
  `isHavPay` tinyint(1) DEFAULT '0' COMMENT '是否付费',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='游戏角色';

drop table if exists log_item_flow;
CREATE TABLE `log_item_flow` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `server_id` smallint(6) NOT NULL COMMENT '区服id',
  `role_id` int(11) NOT NULL COMMENT '角色id',
  `flow_type` tinyint(4) NOT NULL COMMENT '流入：1；流出：0',
  `flow_source` tinyint(4) NOT NULL COMMENT '来源分类',
  `item_type` tinyint(4) NOT NULL COMMENT '物品分类：例：1->装备；2->物品',
  `item_id` int(11) NOT NULL COMMENT '物品ID',
  `quality` tinyint(4) NOT NULL COMMENT '品质（可选）',
  `amount` int(11) NOT NULL COMMENT '流向数量',
  `pre_num` bigint(20) NOT NULL COMMENT '其实数量（可选）',
  `now_num` bigint(20) NOT NULL COMMENT '当前数量（可选）',
  `log_time` datetime NOT NULL COMMENT '时间（2017-08-10 10:04:39）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
