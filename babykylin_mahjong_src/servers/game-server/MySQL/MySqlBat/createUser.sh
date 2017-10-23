#!/bin/sh
mysql -u root -p123456 <./createUser.sql >createUser.log -f --batch --silent --show-warnings --line-numbers --table --column-names