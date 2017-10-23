#!/bin/sh

serverId=$1
user=$2
pwd=$3

echo enter directroy $(pwd)
echo deploying update-server...
echo input serverId=$serverId,user=$user,pwd=$pwd

echo install third-party modules.
chmod +x npm-install.sh && ./npm-install.sh

echo modify port...
yes | cp config.json.bak config.json
port=$[ 3001 + $serverId * 1000 ]
sed -i "s/3001/$port/" config.json

echo end!