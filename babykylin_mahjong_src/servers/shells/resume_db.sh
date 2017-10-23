#!/bin/sh

dbs=('GameLog3' 'GameUser3' 'serverManager3' 'GameStat3')

for db in ${dbs[@]}
do
	/usr/bin/mysql -uroot -p123456 ${db} < ${db}.sql
done
