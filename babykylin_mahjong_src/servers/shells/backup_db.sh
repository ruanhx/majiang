#!/bin/sh

dbs=('GameLog3' 'serverManager3' 'GameUser3' 'GameStat3')

for db in ${dbs[@]}
do
	/usr/bin/mysqldump -t -uroot -p123456 --default-character-set=utf8 --opt --extended-insert=false --triggers --hex-blob --single-transaction -c ${db} > ${db}.sql
done
