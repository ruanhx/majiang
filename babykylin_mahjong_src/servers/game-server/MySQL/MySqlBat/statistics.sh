#!/bin/sh
mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS GameStat3;" && mysql -u root -p123456 --database=GameStat3 <./statistics.sql >statistics.log -f --batch --silent --show-warnings --line-numbers --table --column-names