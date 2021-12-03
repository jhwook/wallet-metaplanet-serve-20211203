
CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `createdat` datetime DEFAULT current_timestamp(),
  `updatedat` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `address` varchar(80) DEFAULT NULL,
  `ip` varchar(40) DEFAULT NULL,
  `pw` varchar(20) DEFAULT NULL,
	pwhash varchar(512) default null ,
  `level` int(11) DEFAULT NULL,
  `username` varchar(80) DEFAULT NULL,
  `active` tinyint(4) DEFAULT 1,
  `email` varchar(50) DEFAULT NULL,
  `nickname` varchar(60) DEFAULT NULL,
  `receiveemailnews` tinyint(4) DEFAULT 0,
  `referercode` varchar(50) DEFAULT NULL,
  `myreferercode` varchar(20) DEFAULT NULL,
	icanwithdraw tinyint default 0
  PRIMARY KEY (`id`)
);
create table balances (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `createdat` datetime DEFAULT current_timestamp(),
  `updatedat` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `address` varchar(80) DEFAULT NULL,
	username varchar(80)
	, amount varchar(20)
	, currency varchar(20)
	, nettype varchar(20)
) ;
CREATE TABLE `transactionsinside` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `createdat` datetime DEFAULT current_timestamp(),
  `updatedat` datetime DEFAULT NULL ON UPDATE current_timestamp(),
	username varchar(80)
	, amount varchar(20)
	, currency varchar(20)
	, to varchar(80)
	, writer varchar(80)
	, nettype varchar(20) 
	, type tinyint 
	, typestr varchar(20)
);
CREATE TABLE `transactionsoutside` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `createdat` datetime DEFAULT current_timestamp(),
  `updatedat` datetime DEFAULT NULL ON UPDATE current_timestamp(),
	username varchar(80)
	, from varchar(80)
	, to varchar(80)  
	, txhash varchar(80)
	, amount varchar(20)
	, currency varchar(20)
	, nettype varchar(20) 
	, writer varchar(80)  
	, type tinyint 
	, typestr varchar(20)
);


