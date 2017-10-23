#!/bin/sh

npm install pm2@latest -g

pm2 startup centos
pm2 save