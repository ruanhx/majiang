#!/bin/sh
mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS GameAdmin3;" && mysql -u root -p123456 --database=GameAdmin3 <./createTable.sql >createTable.log -f --batch --silent --show-warnings --line-numbers --table --column-names