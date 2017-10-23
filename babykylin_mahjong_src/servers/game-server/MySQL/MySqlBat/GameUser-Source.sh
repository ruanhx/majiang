#!/bin/sh
mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS GameUser3;" && mysql -u root -p123456 --database=GameUser3 <./GameUser-Source.sql >GameUser-Source.log -f --batch --silent --show-warnings --line-numbers --table --column-names
